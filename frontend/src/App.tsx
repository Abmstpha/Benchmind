import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './components/LandingPage'
import ProfessionalLayout from './components/ProfessionalLayout'
import './styles/modern.css'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Benchmind...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LandingPage />
  }

  return <ProfessionalLayout />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
