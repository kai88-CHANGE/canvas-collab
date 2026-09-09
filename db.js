const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Railwayではボリュームを /data にマウント、ローカルはプロジェクトルート
const DATA_DIR = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, 'canvas.db');
const db = new Database(dbPath);
console.log(`DB: ${dbPath}`);

db.exec(`
  CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Canvas',
    content TEXT NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

module.exports = db;
