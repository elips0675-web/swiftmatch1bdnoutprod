import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/context/auth-context'

let WS_URL = `http://localhost:3002`
if (typeof window !== 'undefined') {
  const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform()
  if (isNative) {
    const envWs = import.meta.env.VITE_WS_URL as string | undefined
    WS_URL = envWs || 'wss://swiftmatch.app'
  } else if (window.location.hostname !== 'localhost') {
    WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  }
}

export function useWebSocket() {
  const { token } = useAuth()
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

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [token])

  return { socket: socketRef.current, connected }
}
