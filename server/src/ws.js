import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from './middleware.js'
import { getRedisPub, getRedisSub } from './redis.js'
import { rootLogger } from './logger.js'

let io = null

export function initIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  })

  const pub = getRedisPub()
  const sub = getRedisSub()
  if (pub && sub) {
    io.adapter(createAdapter(pub, sub))
    rootLogger.info('[ws] Redis adapter attached — horizontal scaling enabled')
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (!token) return next(new Error('Authentication required'))
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.userId = decoded.userId
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.userId
    socket.join(`user:${userId}`)
    rootLogger.info(`WS user:${userId} connected`)

    socket.on('disconnect', () => {
      rootLogger.info(`WS user:${userId} disconnected`)
      // Notify call partner if in a call
      if (socket.callPartnerId) {
        io.to(`user:${socket.callPartnerId}`).emit('webrtc:call-ended', {
          from: userId,
          reason: 'disconnected',
        })
      }
    })

    // --- WebRTC Signalling ---
    socket.on('webrtc:call-user', ({ targetUserId, sdp, type }) => {
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.userId === targetUserId && s.connected
      )
      if (!targetSocket) {
        socket.emit('webrtc:user-unavailable', { targetUserId })
        return
      }
      socket.callPartnerId = targetUserId
      targetSocket.callPartnerId = userId
      targetSocket.emit('webrtc:incoming-call', {
        from: userId,
        sdp,
        type,
      })
    })

    socket.on('webrtc:call-accepted', ({ targetUserId, sdp, type }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:call-accepted', {
        from: userId,
        sdp,
        type,
      })
    })

    socket.on('webrtc:call-rejected', ({ targetUserId }) => {
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.userId === targetUserId && s.connected
      )
      if (targetSocket) {
        targetSocket.callPartnerId = null
      }
      socket.callPartnerId = null
      io.to(`user:${targetUserId}`).emit('webrtc:call-rejected', {
        from: userId,
      })
    })

    socket.on('webrtc:ice-candidate', ({ targetUserId, candidate }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:ice-candidate', {
        from: userId,
        candidate,
      })
    })

    socket.on('webrtc:end-call', ({ targetUserId }) => {
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.userId === targetUserId && s.connected
      )
      if (targetSocket) {
        targetSocket.callPartnerId = null
      }
      socket.callPartnerId = null
      io.to(`user:${targetUserId}`).emit('webrtc:call-ended', {
        from: userId,
        reason: 'user-ended',
      })
    })
  })

  return io
}

export function getIO() {
  return io
}
