import { useRef, useCallback, useState, useEffect } from 'react'
import type { Socket } from 'socket.io-client'

const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export type CallType = 'video' | 'audio'

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'

interface PeerCallbacks {
  onStream?: (stream: MediaStream) => void
  onStateChange?: (state: CallState) => void
  onError?: (error: string) => void
}

export function useWebRTC(socket: Socket | null, userId: number | null, callbacks?: PeerCallbacks) {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const [callState, setCallState] = useState<CallState>('idle')
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const callPartnerRef = useRef<number | null>(null)

  const updateState = useCallback((state: CallState) => {
    setCallState(state)
    callbacks?.onStateChange?.(state)
  }, [callbacks])

  const createPeerConnection = useCallback((targetUserId: number, stream: MediaStream) => {
    const pc = new RTCPeerConnection(STUN_SERVERS)
    pcRef.current = pc
    callPartnerRef.current = targetUserId

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream)
    })

    pc.ontrack = (event) => {
      const [stream] = event.streams
      setRemoteStream(stream)
      callbacks?.onStream?.(stream)
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:ice-candidate', {
          targetUserId,
          candidate: event.candidate.toJSON(),
        })
      }
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        endCall()
      }
    }

    return pc
  }, [socket, callbacks])

  const startCall = useCallback(async (targetUserId: number, type: CallType, localStream?: MediaStream) => {
    if (!socket || !userId) return

    let stream = localStream
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true,
        })
      } catch {
        callbacks?.onError?.('Could not access camera/microphone')
        return
      }
    }
    localStreamRef.current = stream
    updateState('calling')

    const pc = createPeerConnection(targetUserId, stream)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    socket.emit('webrtc:call-user', {
      targetUserId,
      sdp: offer.sdp,
      type: offer.type,
    })
  }, [socket, userId, createPeerConnection, updateState, callbacks])

  const acceptCall = useCallback(async (fromUserId: number, sdp: string, type: string, callType: CallType) => {
    if (!socket) return

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true,
      })
    } catch {
      callbacks?.onError?.('Could not access camera/microphone')
      return
    }
    localStreamRef.current = stream
    updateState('connected')

    const pc = createPeerConnection(fromUserId, stream)
    await pc.setRemoteDescription(new RTCSessionDescription({ type: type as RTCSdpType, sdp }))

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    socket.emit('webrtc:call-accepted', {
      targetUserId: fromUserId,
      sdp: answer.sdp,
      type: answer.type,
    })
  }, [socket, createPeerConnection, updateState, callbacks])

  const rejectCall = useCallback((fromUserId: number) => {
    if (!socket) return
    socket.emit('webrtc:call-rejected', { targetUserId: fromUserId })
    updateState('idle')
  }, [socket, updateState])

  const endCall = useCallback(() => {
    const targetId = callPartnerRef.current
    if (targetId && socket) {
      socket.emit('webrtc:end-call', { targetUserId: targetId })
    }
    cleanup()
    updateState('ended')
    setTimeout(() => updateState('idle'), 1000)
  }, [socket, updateState])

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    setRemoteStream(null)
    callPartnerRef.current = null
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleIncomingCall = (data: { from: number; sdp: string; type: string }) => {
      updateState('ringing')
      callPartnerRef.current = data.from
    }

    const handleCallAccepted = async (data: { from: number; sdp: string; type: string }) => {
      if (!pcRef.current) return
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription({ type: data.type as RTCSdpType, sdp: data.sdp })
      )
      updateState('connected')
    }

    const handleCallRejected = () => {
      callbacks?.onError?.('Call rejected')
      cleanup()
      updateState('idle')
    }

    const handleIceCandidate = async (data: { from: number; candidate: RTCIceCandidateInit }) => {
      if (!pcRef.current) return
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      } catch {
        // Ignore invalid ICE candidates
      }
    }

    const handleCallEnded = () => {
      cleanup()
      updateState('ended')
      setTimeout(() => updateState('idle'), 1000)
    }

    const handleUserUnavailable = () => {
      callbacks?.onError?.('User is offline')
      cleanup()
      updateState('idle')
    }

    socket.on('webrtc:incoming-call', handleIncomingCall)
    socket.on('webrtc:call-accepted', handleCallAccepted)
    socket.on('webrtc:call-rejected', handleCallRejected)
    socket.on('webrtc:ice-candidate', handleIceCandidate)
    socket.on('webrtc:call-ended', handleCallEnded)
    socket.on('webrtc:user-unavailable', handleUserUnavailable)

    return () => {
      socket.off('webrtc:incoming-call', handleIncomingCall)
      socket.off('webrtc:call-accepted', handleCallAccepted)
      socket.off('webrtc:call-rejected', handleCallRejected)
      socket.off('webrtc:ice-candidate', handleIceCandidate)
      socket.off('webrtc:call-ended', handleCallEnded)
      socket.off('webrtc:user-unavailable', handleUserUnavailable)
      cleanup()
    }
  }, [socket, updateState, cleanup, callbacks])

  return {
    callState,
    remoteStream,
    localStream: localStreamRef.current,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    cleanup,
  }
}
