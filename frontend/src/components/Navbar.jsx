import { LogOut, UserCircle } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/images/logo.png'

const publicLinkClass = ({ isActive }) =>
  `font-medium transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`

const privateLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-primary text-on-primary'
      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
  }`

function Navbar({ user, onLogout, isAuthenticated = false }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await onLogout()
    navigate('/login', { replace: true })
  }

  const handleFeaturesClick = () => {
    if (location.pathname === '/') {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    navigate('/#features')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
       <Link to="/" className="flex items-center gap-3">
        <img src={logo} alt="eCon-Sentiment logo" className="h-8 w-8 rounded-md" />
        <span className="text-xl font-bold tracking-tighter text-primary">
          eCon-Sentiment
        </span>
      </Link>

      {
        isAuthenticated ? 
        (
          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-2 md:flex">
              <NavLink to="/#" className={privateLinkClass}>
                Home
              </NavLink>
              <NavLink to="/home" className={privateLinkClass}>
                Upload
              </NavLink>
              <NavLink to="/analysis" className={privateLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/history" className={privateLinkClass}>
                History
              </NavLink>
            </nav>
            <div className="hidden items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 sm:flex">
              <UserCircle className="h-5 w-5 text-outline" />
              <span className="text-sm text-on-surface-variant">
                {user?.name || user?.email || 'Authenticated User'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/30 px-3 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : 
        (
          <div className="flex items-center gap-5">
            <nav className="hidden items-center gap-8 md:flex">
              <NavLink to="/" className={publicLinkClass}>
                Home
              </NavLink>
              <NavLink to="/about" className={publicLinkClass}>
                About
              </NavLink>
              <button
                type="button"
                onClick={handleFeaturesClick}
                className="font-medium text-on-surface-variant transition-colors hover:text-primary"
              >
                Features
              </button>
            </nav>
            <Link
              to="/login"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-container"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
