import { useAuthContext } from '../contexts/AuthContext'

// Backwards compatibility - kann später entfernt werden
export function useAuth() {
  return useAuthContext()
} 