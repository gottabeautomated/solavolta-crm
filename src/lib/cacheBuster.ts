export interface ClearOptions {
  clearAuth?: boolean
  clearLocalStorage?: boolean
  clearSessionStorage?: boolean
  clearCaches?: boolean
  clearServiceWorkers?: boolean
  reload?: boolean
  logDetails?: boolean
}

export async function bustCachesOnceOnVersionChange(appVersion: string) {
  try {
    const KEY = 'app_cache_version'
    const prev = localStorage.getItem(KEY)
    if (prev === appVersion) return
    localStorage.setItem(KEY, appVersion)
    if (window.caches && caches.keys) {
      const ks = await caches.keys()
      await Promise.all(ks.map(k => caches.delete(k)))
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Cache buster failed', e)
  }
}

export async function clearAppCaches(options: ClearOptions = {}) {
  const {
    clearAuth = false,
    clearLocalStorage = true,
    clearSessionStorage = true,
    clearCaches = true,
    clearServiceWorkers = true,
    reload = true,
    logDetails = true,
  } = options

  if (import.meta.env.DEV && logDetails) console.log('🧹 Clearing app caches...', options)

  try {
    // localStorage
    if (clearLocalStorage) {
      if (clearAuth) {
        localStorage.clear()
        if (import.meta.env.DEV && logDetails) console.log('✅ localStorage cleared completely')
      } else {
        const authKeys = ['sb-', 'supabase.auth.token', 'activeTenantId']
        const allKeys = Object.keys(localStorage)
        const keysToDelete = allKeys.filter(key => !authKeys.some(authKey => key.includes(authKey)))
        keysToDelete.forEach(key => localStorage.removeItem(key))
        if (import.meta.env.DEV && logDetails) console.log('✅ localStorage cleared (auth preserved)')
      }
    }

    // sessionStorage
    if (clearSessionStorage) {
      sessionStorage.clear()
      if (import.meta.env.DEV && logDetails) console.log('✅ sessionStorage cleared')
    }

    // Browser caches
    if (clearCaches && 'caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      if (import.meta.env.DEV && logDetails) console.log('✅ Browser caches cleared:', cacheNames.length)
    }

    // Service workers
    if (clearServiceWorkers && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(reg => reg.unregister()))
      if (import.meta.env.DEV && logDetails) console.log('✅ Service workers cleared:', registrations.length)
    }

    if (reload) {
      if (import.meta.env.DEV && logDetails) console.log('🔄 Reloading page...')
      window.location.href = window.location.origin + '?t=' + Date.now()
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('❌ Cache clear failed:', error)
  }
}

export function setupDevelopmentCacheBuster() {
  if (import.meta.env.DEV) {
    ;(window as any).clearAppCaches = clearAppCaches
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason: any = (event as any).reason
      if (reason?.message?.includes?.('tenant') || reason?.message?.includes?.('auth')) {
        if (import.meta.env.DEV) console.warn('🚨 Critical auth/tenant error detected, clearing caches...')
        clearAppCaches({ clearAuth: false, reload: true })
      }
    })
    if (import.meta.env.DEV) console.log('🔧 Dev cache-buster active. Use clearAppCaches() in console.')
  }
}

