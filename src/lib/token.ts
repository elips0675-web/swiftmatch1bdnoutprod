import { isNative } from './native'

let memoryToken: string | null = null

const AUTH_TOKEN_KEY = 'swiftmatch_auth_token'

export function getToken(): string | null {
  if (memoryToken) return memoryToken
  const stored = sessionStorage.getItem(AUTH_TOKEN_KEY)
  if (stored) {
    memoryToken = stored
    return stored
  }
  // Web: JWT живёт в httpOnly cookie — не читаем легаси localStorage.token,
  // чтобы устаревший чужой Bearer не перебивал актуальную сессию
  if (isNative()) {
    const legacy = localStorage.getItem('token')
    if (legacy) {
      memoryToken = legacy
      return legacy
    }
  }
  return null
}

export function setToken(token: string | null): void {
  memoryToken = token
  if (!isNative()) return
  if (token) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem('token', token)
  } else {
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem('token')
  }
}

export function clearToken(): void {
  memoryToken = null
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem('swiftchat_salt')
  sessionStorage.removeItem('swiftmatch_refresh_token')
  localStorage.removeItem('token')
  localStorage.removeItem('authToken')
  localStorage.removeItem('userProfile')
}
