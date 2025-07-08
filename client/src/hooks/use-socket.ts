import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth-store'
import { env } from '@/config/env'

interface UseSocketOptions {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null)
  const { token } = useAuthStore()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!token) {
      console.log('No token available, skipping socket connection')
      return
    }

    // If socket already exists and is connected, don't recreate
    if (socketRef.current?.connected) {
      console.log('Socket already connected, skipping')
      return
    }

    console.log('Creating new socket connection...', { token: token.substring(0, 20) + '...' })

    // Create socket connection
    const socket = io(env.SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // Prefer websocket
      timeout: 20000,
      forceNew: false, // Don't force new connection
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    // Event listeners
    socket.on('connect', () => {
      console.log('Connected to WebSocket server', { socketId: socket.id })
      setIsConnected(true)
      options.onConnect?.()
      
      // Test the connection
      socket.emit('test', { message: 'Hello from client' })
    })

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server', { socketId: socket.id, reason })
      setIsConnected(false)
      options.onDisconnect?.()
    })

    socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error)
      setIsConnected(false)
      options.onError?.(error)
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to WebSocket server', { socketId: socket.id, attemptNumber })
    })

    socket.on('reconnect_error', (error: Error) => {
      console.error('WebSocket reconnection error:', error)
    })

    socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed')
    })

    // Test event listener
    socket.on('test-response', (data: any) => {
      console.log('Received test response:', data)
    })

    socketRef.current = socket

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection...', { socketId: socket.id })
      setIsConnected(false)
      socket.disconnect()
      socketRef.current = null
    }
  }, [token]) // Only depend on token changes

  // Create stable references to socket methods
  const joinRoom = useCallback((roomId: string): void => {
    if (socketRef.current) {
      console.log('Joining room:', roomId)
      socketRef.current.emit('joinRoom', { roomId })
    } else {
      console.warn('Socket not connected, cannot join room:', roomId)
    }
  }, [])

  const leaveRoom = useCallback((roomId: string): void => {
    if (socketRef.current) {
      console.log('Leaving room:', roomId)
      socketRef.current.emit('leaveRoom', { roomId })
    }
  }, [])

  const emit = useCallback((event: string, data: unknown): void => {
    if (socketRef.current) {
      console.log('Emitting event:', event, data)
      socketRef.current.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }, [])

  const on = useCallback((event: string, callback: (data: unknown) => void): void => {
    if (socketRef.current) {
      console.log('Adding event listener:', event)
      socketRef.current.on(event, callback)
    }
  }, [])

  const off = useCallback((event: string): void => {
    if (socketRef.current) {
      console.log('Removing event listener:', event)
      socketRef.current.off(event)
    }
  }, [])

  // Return stable references
  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    emit,
    on,
    off,
    isConnected,
  }
} 