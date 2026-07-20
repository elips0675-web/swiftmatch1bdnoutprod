import { useEffect, useRef } from 'react'
import { getToken } from '@/lib/token'

export function usePushCapacitor() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    let isNative = false
    try {
      isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform()
    } catch {}

    if (!isNative) return

    let PushNotifications: any
    try {
      PushNotifications = require('@capacitor/push-notifications').PushNotifications
    } catch {
      return
    }

    PushNotifications.requestPermissions().then((result: any) => {
      if (result.receive !== 'granted') return

      PushNotifications.register()

      PushNotifications.addListener('registration', (token: any) => {
        const authToken = getToken()
        if (!authToken) return

        fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            endpoint: token.value,
            platform: 'fcm',
          }),
        }).catch(() => {})
      })

      PushNotifications.addListener('pushNotificationReceived', (notification: any) => {})
    }).catch(() => {})
  }, [])
}
