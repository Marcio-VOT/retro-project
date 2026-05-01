import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSSE } from './useSSE'

// useSSE calls useAuthStore.getState() at effect time — mock the module
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: {
    getState: () => ({ token: null }),
  },
}))

class MockEventSource {
  static instances: MockEventSource[] = []
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {}
  onerror: ((e: Event) => void) | null = null
  closed = false

  constructor(public url: string, public init?: EventSourceInit) {
    MockEventSource.instances.push(this)
  }

  addEventListener(type: string, cb: (e: MessageEvent) => void) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(cb)
  }

  emit(type: string, data: unknown) {
    const event = new MessageEvent(type, { data: JSON.stringify(data) })
    this.listeners[type]?.forEach((cb) => cb(event))
  }

  close() {
    this.closed = true
  }
}

beforeEach(() => {
  MockEventSource.instances = []
  vi.stubGlobal('EventSource', MockEventSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSSE', () => {
  it('does not create EventSource if tableId is undefined', () => {
    renderHook(() => useSSE(undefined, { onMessage: vi.fn() }))
    expect(MockEventSource.instances).toHaveLength(0)
  })

  it('creates EventSource with the correct URL', () => {
    renderHook(() => useSSE('table-1', { onMessage: vi.fn() }))
    expect(MockEventSource.instances).toHaveLength(1)
    expect(MockEventSource.instances[0].url).toContain('/api/tables/table-1/stream')
  })

  it('includes guest_token in the URL when provided', () => {
    renderHook(() =>
      useSSE('table-1', { onMessage: vi.fn(), guestToken: 'abc123' })
    )
    expect(MockEventSource.instances[0].url).toContain('guest_token=abc123')
  })

  it('calls onMessage with correct eventType and data', () => {
    const onMessage = vi.fn()
    renderHook(() => useSSE('table-1', { onMessage }))

    const source = MockEventSource.instances[0]
    source.emit('cards:updated', [{ id: 1, text: 'card' }])

    expect(onMessage).toHaveBeenCalledWith('cards:updated', [{ id: 1, text: 'card' }])
  })

  it('registers listeners for all event types', () => {
    renderHook(() => useSSE('table-1', { onMessage: vi.fn() }))
    const source = MockEventSource.instances[0]
    const types = ['cards:updated', 'votes:updated', 'topics:updated', 'table:archived', 'table:updated']
    types.forEach((t) => expect(source.listeners[t]).toBeDefined())
  })

  it('closes EventSource on cleanup', () => {
    const { unmount } = renderHook(() => useSSE('table-1', { onMessage: vi.fn() }))
    const source = MockEventSource.instances[0]
    unmount()
    expect(source.closed).toBe(true)
  })
})
