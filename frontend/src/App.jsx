import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Analysis from './pages/Analysis'
import History from './pages/History'
import Home from './pages/Home'
import Login from './pages/Login'
import { getCurrentUser, logoutUser } from './services/appwrite'

function ProtectedRoute({ user, onLogout, children }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar user={user} onLogout={onLogout} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch {
        setUser(null)
      } finally {
        setIsAuthLoading(false)
      }
    }

    bootstrapAuth()
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    setUser(null)
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Loading application...
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login onLogin={setUser} />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <Analysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <History />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
