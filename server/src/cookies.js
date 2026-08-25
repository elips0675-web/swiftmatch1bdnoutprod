const isProduction = process.env.NODE_ENV === 'production'

// Этап 42 (аудит kimi 1.2): в проде __Host- префикс — браузер не даст перезаписать
// такую cookie с поддомена. Требует Secure + Path=/ + без Domain атрибута (уже так).
// В dev оставляем обычные имена (Secure недоступен на http://localhost)
export const ACCESS_COOKIE = isProduction ? '__Host-sm_token' : 'sm_token'
export const REFRESH_COOKIE = isProduction ? '__Host-sm_refresh' : 'sm_refresh'

const baseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
}

export function setAuthCookies(res, token, refreshToken) {
  res.cookie(ACCESS_COOKIE, token, { ...baseOptions, maxAge: 24 * 60 * 60 * 1000 })
  if (refreshToken) {
    res.cookie(REFRESH_COOKIE, refreshToken, { ...baseOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
  }
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions })
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions })
}

export function extractToken(req) {
  const authHeader = req.headers?.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  return req.cookies?.[ACCESS_COOKIE] || null
}
