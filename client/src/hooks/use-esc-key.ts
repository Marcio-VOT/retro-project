import { useEffect } from 'react'

export function useEscKey(onEsc: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEsc()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onEsc, isActive])
} 