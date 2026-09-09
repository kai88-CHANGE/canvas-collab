const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'canvas.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Canvas',
    content TEXT NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS canvas_members (
    canvas_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor',
    PRIMARY KEY (canvas_id, user_id)
  );
`);

module.exports = db;
