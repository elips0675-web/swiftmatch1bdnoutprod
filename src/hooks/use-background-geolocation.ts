import { useEffect, useRef } from 'react'
import { getToken } from '@/lib/token'

const UPDATE_INTERVAL_MS = 5 * 60 * 1000
const MIN_DISPLACEMENT_M = 100

export function useBackgroundGeolocation() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const isNative = typeof window !== 'undefined' &&
      (window as any).Capacitor?.isNativePlatform?.() === true

    let cancelled = false

    async function updateLocation() {
      try {
        const { Geolocation } = await import('@capacitor/geolocation')
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        })

        if (cancelled || !pos?.coords) return

        const { latitude, longitude } = pos.coords
        const authToken = getToken()
        if (!authToken) return

        await fetch('/api/location', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ lat: latitude, lng: longitude }),
        })

        if (import.meta.env.DEV) {
          console.log('[GPS] Location updated:', latitude, longitude)
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.log('[GPS] Update failed:', err)
        }
      }
    }

    if (isNative) {
      updateLocation()
      intervalRef.current = setInterval(updateLocation, UPDATE_INTERVAL_MS)
    } else {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return
            const authToken = getToken()
            if (!authToken) return
            const { latitude, longitude } = pos.coords
            fetch('/api/location', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            }).catch(() => {})
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
        )

        intervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return
              const authToken = getToken()
              if (!authToken) return
              const { latitude, longitude } = pos.coords
              fetch('/api/location', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ lat: latitude, lng: longitude }),
              }).catch(() => {})
            },
            () => {},
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
          )
        }, UPDATE_INTERVAL_MS)
      }
    }

    return () => {
      cancelled = true
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
}
