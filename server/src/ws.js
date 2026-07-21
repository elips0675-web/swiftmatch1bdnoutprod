import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from './middleware.js'
import { getRedisPub, getRedisSub } from './redis.js'
import { rootLogger } from './logger.js'
import pool from './db.js'
import { wsConnectionsGauge, wsRoomsGauge, trackWsMessage } from './metrics.js'

let io = null
const CLEANUP_INTERVAL = 10000

export function startMessageCleanup() {
  setInterval(async () => {
    if (!io) return
    try {
      const [expired] = await pool.query(
        `SELECT m.id, m.chat_id, cp.user_id
         FROM messages m
         JOIN chat_participants cp ON m.chat_id = cp.chat_id
         WHERE m.ttl_seconds IS NOT NULL
           AND m.created_at < DATE_SUB(NOW(), INTERVAL m.ttl_seconds SECOND)`
      )
      if (expired.length === 0) return

      const ids = [...new Set(expired.map(r => r.id))]
      await pool.query('DELETE FROM messages WHERE id IN (?)', [ids])

      const chatIds = [...new Set(expired.map(r => r.chat_id))]
      for (const chatId of chatIds) {
        const deletedIds = expired.filter(r => r.chat_id === chatId).map(r => r.id)
        const users = [...new Set(expired.filter(r => r.chat_id === chatId).map(r => r.user_id))]
        for (const userId of users) {
          io.to(`user:${userId}`).emit('chat:message-deleted', { chatId, messageIds: deletedIds })
        }
      }
    } catch (err) {
      rootLogger.error('[ws] Message cleanup error:', err)
    }
  }, CLEANUP_INTERVAL)
  rootLogger.info('[ws] Message TTL cleanup started every 10s')
}

export function startCheckinCleanup() {
  setInterval(async () => {
    try {
      const [expired] = await pool.query(
        `UPDATE date_checkins SET status = 'expired', notified = 1
         WHERE status = 'active' AND checkin_at < NOW()`
      )
      if (expired.affectedRows > 0) {
        rootLogger.info('[checkin] Expired check-ins marked', { count: expired.affectedRows })
      }
    } catch (err) {
      rootLogger.warn('[checkin] Cleanup error', { error: err.message })
    }
  }, 30000)
  rootLogger.info('[checkin] Expiry cleanup started every 30s')
}

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
      const decoded = jwt.verify(token, JWT_SECRET())
      socket.userId = decoded.userId
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.userId
    socket.join(`user:${userId}`)
    wsConnectionsGauge.inc()
    wsRoomsGauge.set(io.sockets.adapter.rooms.size)
    rootLogger.info(`WS user:${userId} connected`)

    socket.onAny((event) => {
      trackWsMessage(event)
    })

    socket.on('disconnect', () => {
      wsConnectionsGauge.dec()
      wsRoomsGauge.set(io.sockets.adapter.rooms.size)
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
