import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'

type SSEOptions = {
  onMessage: (eventType: string, data: unknown) => void
  guestToken?: string
}

const EVENT_TYPES = ['cards:updated', 'votes:updated', 'topics:updated', 'table:archived', 'table:updated'] as const

export function useSSE(tableId: string | undefined, options: SSEOptions) {
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!tableId) return

    const token = useAuthStore.getState().token
    const params = new URLSearchParams()
    if (token) params.set('token', token)
    if (options.guestToken) params.set('guest_token', options.guestToken)

    const baseUrl = process.env.NEXT_PUBLIC_SSE_URL ?? 'http://localhost:8080'
    const url = `${baseUrl}/api/tables/${tableId}/stream?${params}`

    const source = new EventSource(url)

    source.addEventListener('connected', () => {
      console.log(`[SSE] Connected to room ${tableId}`)
    })

    EVENT_TYPES.forEach((eventType) => {
      source.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          options.onMessage(eventType, data)
        } catch {
          console.error('[SSE] Failed to parse event:', eventType)
        }
      })
    })

    source.onerror = (err) => {
      console.warn('[SSE] Connection lost, reconnecting automatically...', err)
    }

    sourceRef.current = source

    return () => {
      source.close()
      sourceRef.current = null
    }
  }, [tableId]) // eslint-disable-line react-hooks/exhaustive-deps
}
