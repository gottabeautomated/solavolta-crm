import { Login } from './components/Login'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { supabase } from './lib/supabase'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Willkommen, {user.email}!
        </h2>
        <p className="text-gray-600">
          Login erfolgreich! 🎉
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Abmelden
        </button>
      </div>
    </Layout>
  )
}

export default App
