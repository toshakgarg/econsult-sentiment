import { BarChart3, History, Home, Info, LogIn, LogOut, Menu, UserCircle, X } from 'lucide-react'
import { useState } from 'react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    setIsMobileMenuOpen(false)
    await onLogout()
    navigate('/login', { replace: true })
  }

  const handleFeaturesClick = () => {
    setIsMobileMenuOpen(false)
    if (location.pathname === '/') {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    navigate('/#features')
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const authNavItems = [
    { to: '/home', label: 'Dashboard', icon: Home },
    { to: '/analysis', label: 'Analysis', icon: BarChart3 },
    { to: '/history', label: 'History', icon: History },
  ]

  const publicNavItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/about', label: 'About', icon: Info },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-surface/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to={isAuthenticated ? '/home' : '/'}
            onClick={closeMobileMenu}
            className="flex items-center gap-3"
          >
            <img src={logo} alt="Sentrix logo" className="h-8 w-8 rounded-md" />
            <span className="text-lg font-bold tracking-tight text-primary sm:text-xl">Sentrix</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <nav className="hidden items-center gap-2 md:flex">
                {authNavItems.map(({ to, label }) => (
                  <NavLink key={to} to={to} className={privateLinkClass}>
                    {label}
                  </NavLink>
                ))}
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
                className="hidden items-center gap-2 rounded-lg border border-outline-variant/30 px-3 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container-low sm:inline-flex"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface md:hidden"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <nav className="hidden items-center gap-8 md:flex">
                {publicNavItems.map(({ to, label }) => (
                  <NavLink key={to} to={to} className={publicLinkClass}>
                    {label}
                  </NavLink>
                ))}
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
                className="hidden rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-container sm:inline-flex"
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface md:hidden"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-outline-variant/20 bg-surface px-4 py-4 shadow-lg md:hidden">
            <nav className="mx-auto flex max-w-screen-2xl flex-col gap-2">
              {(isAuthenticated ? authNavItems : publicNavItems).map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
                        isActive
                          ? 'bg-primary text-on-primary'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                )
              })}
              {!isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={handleFeaturesClick}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Features
                  </button>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-on-primary"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/30 px-4 py-3 text-sm font-bold text-on-surface"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              )}
            </nav>
          </div>
        ) : null}
      </header>

      {isAuthenticated ? (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/25 bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(21,28,39,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
            {authNavItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold ${
                      isActive ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      ) : null}
    </>
  )
}

export default Navbar
