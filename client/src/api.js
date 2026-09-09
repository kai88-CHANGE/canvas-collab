// 本番はサーバーと同じオリジン、開発はlocalhost:3001
const BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

export async function fetchMe() {
  const r = await fetch(`${BASE}/auth/me`, { credentials: 'include' });
  return r.json();
}

export async function login(name) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return r.json();
}

export async function logout() {
  await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}

export async function fetchCanvases() {
  const r = await fetch(`${BASE}/api/canvases`, { credentials: 'include' });
  return r.json();
}

export async function createCanvas(title) {
  const r = await fetch(`${BASE}/api/canvases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title }),
  });
  return r.json();
}

export async function fetchCanvas(id) {
  const r = await fetch(`${BASE}/api/canvases/${id}`, { credentials: 'include' });
  return r.json();
}

export async function deleteCanvas(id) {
  await fetch(`${BASE}/api/canvases/${id}`, { method: 'DELETE', credentials: 'include' });
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append('image', file);
  const r = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const data = await r.json();
  return `${BASE}${data.url}`;
}
