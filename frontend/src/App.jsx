import { Suspense, cloneElement, lazy, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import { getCurrentUser, logoutUser } from './services/appwrite'

const Landing = lazy(() => import('./pages/Landing'))
const About = lazy(() => import('./pages/About'))
const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const Analysis = lazy(() => import('./pages/Analysis'))
const History = lazy(() => import('./pages/History'))

function ProtectedRoute({ user, onLogout, children }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar isAuthenticated user={user} onLogout={onLogout} />
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-8 md:pt-8 lg:px-8">
        {cloneElement(children, { user })}
      </main>
    </div>
  )
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      {children}
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
    Object.keys(localStorage)
      .filter((key) => key.startsWith('lastUploadId:'))
      .forEach((key) => localStorage.removeItem(key))
    setUser(null)
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="rounded-lg border border-outline-variant/20 bg-white px-6 py-4 text-sm text-on-surface-variant shadow-sm">
          Loading application...
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="rounded-lg border border-outline-variant/20 bg-white px-6 py-4 text-sm text-on-surface-variant shadow-sm">
              Loading page...
            </div>
          </div>
        }
      >
        <Routes>
          <Route
            path="/"
            element={
              <PublicLayout>
                <Landing />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <About />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/home" replace /> : <Login onLogin={setUser} />}
          />
          <Route
            path="/home"
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
          <Route path="*" element={<Navigate to={user ? '/home' : '/'} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
