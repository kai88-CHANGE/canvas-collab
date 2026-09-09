import { useState, useEffect } from 'react';
import { fetchCanvases, createCanvas, deleteCanvas, login, logout } from '../api';

export default function Dashboard({ user, setUser, onSelectCanvas }) {
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchCanvases().then(data => {
      setCanvases(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) { setNameError('名前を入力してください'); return; }
    const result = await login(nameInput.trim());
    if (result.error) { setNameError(result.error); return; }
    setUser(result);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const canvas = await createCanvas(newTitle.trim());
    setCanvases(prev => [canvas, ...prev]);
    setNewTitle('');
    setCreating(false);
    onSelectCanvas(canvas.id);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('このキャンバスを削除しますか？')) return;
    await deleteCanvas(id);
    setCanvases(prev => prev.filter(c => c.id !== id));
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5865f2" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1>Canvas</h1>
          <p>名前を入力するだけで<br />みんなとリアルタイム編集できます</p>
          <form onSubmit={handleLogin} className="name-form">
            <input
              autoFocus
              className="name-input"
              value={nameInput}
              onChange={e => { setNameInput(e.target.value); setNameError(''); }}
              placeholder="あなたの名前"
              maxLength={30}
            />
            {nameError && <p className="name-error">{nameError}</p>}
            <button type="submit" className="login-btn">はじめる</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Canvas</h1>
        <div className="user-info">
          <img
            src={user.avatar}
            alt={user.name}
            className="user-avatar"
          />
          <span className="user-name">{user.name}</span>
          <button className="logout-btn" onClick={handleLogout}>退出</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="canvases-header">
          <h2>キャンバス一覧</h2>
          <button className="create-btn" onClick={() => setCreating(true)}>+ 新規作成</button>
        </div>

        {creating && (
          <form className="create-form" onSubmit={handleCreate}>
            <input
              autoFocus
              className="create-input"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="キャンバスのタイトル..."
            />
            <button type="submit" className="create-submit-btn">作成</button>
            <button type="button" className="cancel-btn" onClick={() => setCreating(false)}>キャンセル</button>
          </form>
        )}

        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : canvases.length === 0 ? (
          <div className="empty-state">
            <p>キャンバスがまだありません</p>
            <button className="create-btn" onClick={() => setCreating(true)}>最初のキャンバスを作成</button>
          </div>
        ) : (
          <div className="canvases-grid">
            {canvases.map(canvas => (
              <div
                key={canvas.id}
                className="canvas-card"
                onClick={() => onSelectCanvas(canvas.id)}
              >
                <div className="canvas-card-content">
                  <h3>{canvas.title}</h3>
                  <p className="canvas-meta">作成: {canvas.created_by}</p>
                  <p className="canvas-date">
                    {new Date(canvas.updated_at).toLocaleDateString('ja-JP', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  className="delete-canvas-btn"
                  onClick={(e) => handleDelete(canvas.id, e)}
                  title="削除"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
