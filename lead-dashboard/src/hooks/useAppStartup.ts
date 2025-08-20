import { useEffect, useState } from 'react'
import { clearAppCaches } from '../lib/cacheBuster'

interface StartupState {
  isReady: boolean
  error: string | null
  isFirstLoad: boolean
}

export function useAppStartup() {
  const [state, setState] = useState<StartupState>({
    isReady: false,
    error: null,
    isFirstLoad: false,
  })

  useEffect(() => {
    const initApp = async () => {
      try {
        const lastClear = localStorage.getItem('lastCacheClear')
        const now = Date.now()
        const fiveMinutesAgo = now - 5 * 60 * 1000
        const isFirstLoad = !lastClear || parseInt(lastClear) < fiveMinutesAgo

        if (import.meta.env.DEV && isFirstLoad) {
          console.log('🔄 Development: Clearing old caches...')
          await clearAppCaches({ clearAuth: false, reload: false, logDetails: true })
          localStorage.setItem('lastCacheClear', now.toString())
        }

        try {
          const tenantId = localStorage.getItem('activeTenantId')
          if (tenantId && (tenantId.includes('<') || tenantId.includes('>'))) {
            if (import.meta.env.DEV) console.warn('🧹 Corrupted activeTenantId detected, clearing...')
            localStorage.removeItem('activeTenantId')
          }
        } catch (e) {
          if (import.meta.env.DEV) console.warn('🧹 localStorage validation failed, clearing...')
          localStorage.clear()
        }

        setState({ isReady: true, error: null, isFirstLoad })
      } catch (error) {
        if (import.meta.env.DEV) console.error('❌ App startup failed:', error)
        setState({
          isReady: false,
          error: error instanceof Error ? error.message : 'Startup failed',
          isFirstLoad: false,
        })
      }
    }

    void initApp()
  }, [])

  return state
}



