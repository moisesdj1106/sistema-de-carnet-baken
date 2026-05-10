const BASE = import.meta.env.VITE_API_URL || '/api';

const getToken = () => localStorage.getItem('vex_token');

const headers = (isForm = false) => {
  const h = { Authorization: `Bearer ${getToken()}` };
  if (!isForm) h['Content-Type'] = 'application/json';
  return h;
};

// Wrapper que detecta 401 y redirige al login
async function apiFetch(...args) {
  const res = await fetch(...args);
  if (res.status === 401) {
    localStorage.removeItem('vex_token');
    localStorage.removeItem('vex_user');
    window.location.href = '/login';
  }
  return res;
}

export const api = {
  // Auth
  login: (data) => fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  setupStatus: () => fetch(`${BASE}/auth/setup-status`),
  register: (data) => apiFetch(`${BASE}/auth/register`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }),
  registerPublic: (data) => fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getAdmins: () => apiFetch(`${BASE}/auth/admins`, { headers: headers() }),
  deleteAdmin: (id) => apiFetch(`${BASE}/auth/admins/${id}`, { method: 'DELETE', headers: headers() }),

  // Workers
  getWorkers: () => apiFetch(`${BASE}/workers`, { headers: headers() }),
  getPositions: () => apiFetch(`${BASE}/workers/positions/all`, { headers: headers() }),
  createWorker: (form) => apiFetch(`${BASE}/workers`, { method: 'POST', headers: headers(true), body: form }),
  updateWorker: (id, form) => apiFetch(`${BASE}/workers/${id}`, { method: 'PUT', headers: headers(true), body: form }),
  deleteWorker: (id) => apiFetch(`${BASE}/workers/${id}`, { method: 'DELETE', headers: headers() }),

  // Cards
  getCards: () => apiFetch(`${BASE}/cards`, { headers: headers() }),
  getCard: (id) => apiFetch(`${BASE}/cards/${id}`, { headers: headers() }),
  createCard: (data) => apiFetch(`${BASE}/cards`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }),
  deleteCard: (id) => apiFetch(`${BASE}/cards/${id}`, { method: 'DELETE', headers: headers() }),
  toggleCard: (id) => apiFetch(`${BASE}/cards/${id}/toggle`, { method: 'PATCH', headers: headers() }),

  // Attendance
  scan: (card_code) => fetch(`${BASE}/attendance/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ card_code }) }),
  getToday: () => apiFetch(`${BASE}/attendance/today`, { headers: headers() }),
  deleteLog: (id) => apiFetch(`${BASE}/attendance/${id}`, { method: 'DELETE', headers: headers() }),
  getBiweekly: (start, end) => apiFetch(`${BASE}/attendance/biweekly?start=${start}&end=${end}`, { headers: headers() }),
};
