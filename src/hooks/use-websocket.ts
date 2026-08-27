import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/context/auth-context'

let WS_URL: string | undefined
if (typeof window !== 'undefined') {
  const envWs = import.meta.env.VITE_WS_URL as string | undefined
  const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform()
  if (isNative) {
    WS_URL = envWs || 'wss://swiftmatch.app'
  } else {
    WS_URL = envWs || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  }
}

export function useWebSocket() {
  const { token, logout } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token) return

    const socket = io(WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('user:banned', () => {
      if (import.meta.env.DEV) console.log('[ws] user:banned — server banned this user')
      logout()
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [token, logout])

  return { socket: socketRef.current, connected }
}
