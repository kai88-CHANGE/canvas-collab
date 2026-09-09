require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const db = require('./db');

const app = express();
const server = http.createServer(app);

const isProd = process.env.NODE_ENV === 'production';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Railwayなどリバースプロキシ経由でHTTPSを使う場合に必要
app.set('trust proxy', 1);

const io = new Server(server, {
  cors: {
    origin: isProd ? true : clientUrl,
    credentials: true,
  },
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

if (!isProd) {
  app.use(cors({ origin: clientUrl, credentials: true }));
}
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// セッションミドルウェアを1つだけ定義してHTTPとSocket.io両方で共有
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'canvas-secret-dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  },
});
app.use(sessionMiddleware);

// ===== 本番環境: ビルド済みReactを配信 =====
if (isProd) {
  const clientDist = path.join(__dirname, 'client', 'dist');
  app.use(express.static(clientDist));
}

// ===== 名前ベース認証 =====
app.post('/auth/login', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: '名前を入力してください' });
  const user = {
    id: uuidv4(),
    name: name.trim(),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=5865f2&color=fff&size=64`,
  };
  req.session.user = user;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'セッション保存エラー' });
    res.json(user);
  });
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/auth/me', (req, res) => {
  if (!req.session.user) return res.json(null);
  res.json(req.session.user);
});

function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// ===== Canvas CRUD =====
app.get('/api/canvases', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM canvases ORDER BY updated_at DESC').all();
  res.json(rows);
});

app.post('/api/canvases', requireAuth, (req, res) => {
  const id = uuidv4();
  const now = Date.now();
  const canvas = {
    id,
    title: req.body.title || '新しいキャンバス',
    content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    created_by: req.session.user.name,
    created_at: now,
    updated_at: now,
  };
  db.prepare('INSERT INTO canvases VALUES (?, ?, ?, ?, ?, ?)').run(
    canvas.id, canvas.title, canvas.content, canvas.created_by, canvas.created_at, canvas.updated_at
  );
  res.json(canvas);
});

app.get('/api/canvases/:id', requireAuth, (req, res) => {
  const canvas = db.prepare('SELECT * FROM canvases WHERE id = ?').get(req.params.id);
  if (!canvas) return res.status(404).json({ error: 'Not found' });
  res.json(canvas);
});

app.patch('/api/canvases/:id', requireAuth, (req, res) => {
  const { title, content } = req.body;
  const now = Date.now();
  if (title !== undefined) db.prepare('UPDATE canvases SET title = ?, updated_at = ? WHERE id = ?').run(title, now, req.params.id);
  if (content !== undefined) db.prepare('UPDATE canvases SET content = ?, updated_at = ? WHERE id = ?').run(content, now, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/canvases/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM canvases WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// 本番: 全ルートをReactにフォールバック (Express 5対応)
if (isProd) {
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  });
}

// ===== リアルタイム共同編集 =====
// 同じsessionMiddlewareインスタンスをSocket.ioでも使う
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

const activeUsers = new Map();

io.on('connection', (socket) => {
  const user = socket.request.session?.user;
  if (!user) return socket.disconnect();

  let currentCanvas = null;

  socket.on('join-canvas', (canvasId) => {
    if (currentCanvas) {
      socket.leave(currentCanvas);
      const users = activeUsers.get(currentCanvas);
      if (users) {
        users.delete(socket.id);
        io.to(currentCanvas).emit('users-update', Array.from(users.values()));
      }
    }
    currentCanvas = canvasId;
    socket.join(canvasId);
    if (!activeUsers.has(canvasId)) activeUsers.set(canvasId, new Map());
    activeUsers.get(canvasId).set(socket.id, { id: user.id, name: user.name, avatar: user.avatar });
    io.to(canvasId).emit('users-update', Array.from(activeUsers.get(canvasId).values()));
  });

  socket.on('content-update', ({ canvasId, content, title }) => {
    const now = Date.now();
    if (content !== undefined) db.prepare('UPDATE canvases SET content = ?, updated_at = ? WHERE id = ?').run(content, now, canvasId);
    if (title !== undefined) db.prepare('UPDATE canvases SET title = ?, updated_at = ? WHERE id = ?').run(title, now, canvasId);
    socket.to(canvasId).emit('content-update', { content, title, from: user.name });
  });

  socket.on('disconnect', () => {
    if (currentCanvas) {
      const users = activeUsers.get(currentCanvas);
      if (users) {
        users.delete(socket.id);
        io.to(currentCanvas).emit('users-update', Array.from(users.values()));
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
