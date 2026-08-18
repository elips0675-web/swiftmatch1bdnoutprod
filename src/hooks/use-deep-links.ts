import { useEffect } from 'react'
import { useRouter } from '@/shims/next-navigation'

export function useDeepLinks() {
  const router = useRouter()

  useEffect(() => {
    let isNative = false
    try {
      isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform()
    } catch { /* ignored */ }

    if (!isNative) {
      const handleUrl = () => {
        const path = window.location.pathname + window.location.search
        if (path !== '/') {
          router.push(path)
        }
      }
      handleUrl()
      window.addEventListener('popstate', handleUrl)
      return () => window.removeEventListener('popstate', handleUrl)
    }

    let App: any
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      App = require('@capacitor/app').App
    } catch {
      return
    }

    App.addListener('appUrlOpen', (data: any) => {
      const url = new URL(data.url)
      const path = url.pathname + url.search
      if (path !== '/') {
        router.push(path)
      }
    })
  }, [router])
}
