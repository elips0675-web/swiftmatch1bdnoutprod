function isNative(): boolean {
  try {
    return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform() === true
  } catch {
    return false
  }
}

function getApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined
  if (envUrl && envUrl !== '/api') {
    return envUrl.replace(/\/+$/, '')
  }
  return 'https://swiftmatch.app'
}

function getWsUrl(): string {
  const envWs = import.meta.env.VITE_WS_URL as string | undefined
  if (envWs) return envWs
  return 'wss://swiftmatch.app'
}

if (isNative()) {
  const base = getApiBase()
  const origFetch = window.fetch
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = `${base}${input}`
    } else if (input instanceof Request && input.url.startsWith('/api/')) {
      const url = `${base}${input.url}`
      input = new Request(url, init || {})
    }
    return origFetch.call(window, input as RequestInfo | URL, init)
  } as typeof window.fetch

  if (import.meta.env.DEV) console.log(`[Native] Capacitor detected, API → ${base}, WS → ${getWsUrl()}`)
}

export { isNative, getApiBase, getWsUrl }
