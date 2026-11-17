const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

const STORAGE_TOKEN = 'cc_access_token';
const STORAGE_USER = 'cc_user';

export function getStoredToken() {
  return localStorage.getItem(STORAGE_TOKEN);
}

export function getStoredUser() {
  const raw = localStorage.getItem(STORAGE_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(accessToken, user) {
  localStorage.setItem(STORAGE_TOKEN, accessToken);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
}

async function parseError(response) {
  try {
    const body = await response.json();
    return body.detail || body.title || body.message || `Erro HTTP ${response.status}`;
  } catch {
    return `Erro HTTP ${response.status}`;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const auth = token ?? getStoredToken();
  if (auth) {
    headers.Authorization = `Bearer ${auth}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function cadastrarUsuario({ name, email, password }) {
  return request('/api/v1/users', {
    method: 'POST',
    body: { name, email, password },
  });
}

export function login({ email, password }) {
  return request('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function logout() {
  return request('/api/v1/auth/logout', { method: 'POST' });
}

export function buscarUsuario(id) {
  return request(`/api/v1/users/${id}`);
}

export function atualizarUsuario(id, { name, email, password }) {
  const body = { name, email };
  if (password) {
    body.password = password;
  }
  return request(`/api/v1/users/${id}`, {
    method: 'PUT',
    body,
  });
}
