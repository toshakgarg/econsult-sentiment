import { NavLink, useNavigate } from 'react-router-dom'

const linkClassName = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-700 text-white'
      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
  }`

function Navbar({ user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Ministry of Corporate Affairs
            </p>
            <h1 className="text-lg font-semibold text-slate-900">eCon-Sentiment</h1>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/" className={linkClassName}>
              Home
            </NavLink>
            <NavLink to="/analysis" className={linkClassName}>
              Analysis
            </NavLink>
            <NavLink to="/history" className={linkClassName}>
              History
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">
            {user?.name || user?.email || 'Authenticated User'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
