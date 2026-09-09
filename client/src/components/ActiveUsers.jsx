export default function ActiveUsers({ users, currentUserId }) {
  if (!users.length) return null;

  return (
    <div className="active-users">
      <span className="active-users-label">編集中:</span>
      <div className="active-users-list">
        {users.map((u) => (
          <div key={u.id} className="active-user" title={u.name}>
            <img
              src={u.avatar}
              alt={u.name}
              className={`active-user-avatar ${u.id === currentUserId ? 'current-user' : ''}`}
            />
            <span className="active-user-name">{u.name}</span>
            {u.id === currentUserId && <span className="you-badge">あなた</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
