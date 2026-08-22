const isProduction = process.env.NODE_ENV === 'production'

const baseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
}

export function setAuthCookies(res, token, refreshToken) {
  res.cookie('sm_token', token, { ...baseOptions, maxAge: 24 * 60 * 60 * 1000 })
  if (refreshToken) {
    res.cookie('sm_refresh', refreshToken, { ...baseOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
  }
}

export function clearAuthCookies(res) {
  res.clearCookie('sm_token', { ...baseOptions })
  res.clearCookie('sm_refresh', { ...baseOptions })
}

export function extractToken(req) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  return req.cookies?.sm_token || null
}
