import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DashboardProvider } from './contexts/DashboardContext'
import { AppHealthProvider } from './components/AppHealthProvider'

// 🚨 CRITICAL: Install global array guard BEFORE anything else
import './lib/arrayGuard'

// Dev-Only Debug-Helfer minimal halten
if (import.meta.env.DEV) {
  import('./lib/debugAuth')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppHealthProvider>
      <DashboardProvider>
        <App />
      </DashboardProvider>
    </AppHealthProvider>
  </StrictMode>,
)
