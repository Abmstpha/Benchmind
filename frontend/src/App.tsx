import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './components/LandingPage'
import ProfessionalLayout from './components/ProfessionalLayout'
import './styles/modern.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  console.log('🔒 ProtectedRoute check:', { isAuthenticated, isLoading });

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
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  console.log('🌐 PublicRoute check:', { isAuthenticated, isLoading });

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

  if (isAuthenticated) {
    console.log('✅ User is authenticated, redirecting to home');
    return <Navigate to="/home" replace />
  }

  console.log('🌐 User not authenticated, showing login page');
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Root redirect */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            } 
          />
          
          {/* All routes inside ProfessionalLayout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ProfessionalLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
