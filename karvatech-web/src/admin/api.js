const CSRF_COOKIE = 'karvatech_csrf'

function readCookie(name) {
  const m = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'),
  )
  return m ? decodeURIComponent(m[1]) : ''
}

export function getCsrf() {
  return readCookie(CSRF_COOKIE)
}

async function ensureCsrf() {
  if (!getCsrf()) {
    await fetch('/api/admin/csrf', { method: 'GET', credentials: 'include' })
  }
}

async function parseError(res) {
  let data = null
  try {
    data = await res.json()
  } catch {
    /* cuerpo no JSON */
  }
  return (data && data.detail) || 'Error inesperado del servidor'
}

async function api(path, { method = 'GET', body = null } = {}) {
  if (method !== 'GET') await ensureCsrf()
  const headers = {}
  if (body !== null) headers['Content-Type'] = 'application/json'
  const token = getCsrf()
  if (token) headers['X-CSRF-Token'] = token
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers,
    body: body === null ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error((data && data.detail) || (await parseError(res)))
    err.status = res.status
    throw err
  }
  return data
}

export const http = {
  get: (p) => api(p),
  post: (p, b) => api(p, { method: 'POST', body: b }),
  patch: (p, b) => api(p, { method: 'PATCH', body: b }),
  del: (p) => api(p, { method: 'DELETE' }),
}

export function changePassword(currentPassword, newPassword) {
  return api('/api/admin/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  })
}

export async function login(username, password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((data && data.detail) || 'No pudimos iniciar sesión.')
  }
  return data.user
}

export async function logout() {
  try {
    await api('/api/admin/logout', { method: 'POST', body: {} })
  } catch {
    /* la sesión pudo haber expirado; se ignora */
  }
}

export async function uploadImage(file) {
  await ensureCsrf()
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': getCsrf() },
    body: fd,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((data && data.detail) || 'No se pudo subir la imagen.')
  }
  return data.url
}