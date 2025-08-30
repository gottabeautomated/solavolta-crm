import { useEffect, useRef, useState, useCallback } from 'react'

export interface LoadingController {
  loading: boolean
  delayed: boolean
  error: string | null
  start: () => void
  success: () => void
  fail: (message: string) => void
  withGuard: <T>(fn: () => Promise<T>) => Promise<T | undefined>
}

/**
 * Vereinheitlichter Loading-State mit Timeout und Recovery-Hooks
 * - delayed: wird true, wenn loading > delayMs, um Skeletons erst nach kurzer Zeit zu zeigen
 */
export function useLoadingState(options?: { delayMs?: number; timeoutMs?: number }): LoadingController {
  const delayMs = options?.delayMs ?? 200
  const timeoutMs = options?.timeoutMs ?? 15000

  const [loading, setLoading] = useState(false)
  const [delayed, setDelayed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedAt = useRef<number | null>(null)
  const delayTimer = useRef<number | undefined>(undefined)
  const timeoutTimer = useRef<number | undefined>(undefined)

  const clearTimers = () => {
    if (delayTimer.current) window.clearTimeout(delayTimer.current)
    if (timeoutTimer.current) window.clearTimeout(timeoutTimer.current)
    delayTimer.current = undefined
    timeoutTimer.current = undefined
  }

  const start = useCallback(() => {
    setError(null)
    setLoading(true)
    setDelayed(false)
    startedAt.current = Date.now()
    clearTimers()
    delayTimer.current = window.setTimeout(() => setDelayed(true), delayMs)
    timeoutTimer.current = window.setTimeout(() => setError('Zeitüberschreitung beim Laden'), timeoutMs)
  }, [delayMs, timeoutMs])

  const success = useCallback(() => {
    clearTimers()
    setLoading(false)
    setDelayed(false)
  }, [])

  const fail = useCallback((message: string) => {
    clearTimers()
    setError(message)
    setLoading(false)
  }, [])

  const withGuard = useCallback(async <T,>(fn: () => Promise<T>) => {
    try {
      start()
      const res = await fn()
      success()
      return res
    } catch (e) {
      fail(e instanceof Error ? e.message : 'Unbekannter Fehler')
      return undefined
    }
  }, [start, success, fail])

  useEffect(() => () => clearTimers(), [])

  return { loading, delayed, error, start, success, fail, withGuard }
}


