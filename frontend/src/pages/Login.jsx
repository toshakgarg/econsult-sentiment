import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Eye, EyeOff, LineChart, ShieldCheck } from 'lucide-react'
import { loginWithEmail } from '../services/appwrite'
import heroIllustration from '../assets/images/hero-illustration.png'
import logo from '../assets/images/logo.png'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBrandClick = () => {
    navigate('/')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const user = await loginWithEmail(email, password)
      onLogin(user)
      navigate('/home', { replace: true })
    } catch (err) {
      setError(
        err?.message ||
          'Authentication failed. Verify your Appwrite configuration and credentials.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="flex min-h-screen flex-col md:flex-row">
        <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary-container p-16 text-on-primary md:flex">
          <div className="absolute -right-48 -top-48 h-96 w-96 rounded-full bg-primary opacity-20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-secondary opacity-20 blur-3xl" />

          <div className="relative z-10">
            <button
              type="button"
              onClick={handleBrandClick}
              className="mb-10 flex items-center gap-3 text-left transition hover:opacity-80"
              aria-label="Go to Sentrix home"
            >
              <img src={logo} alt="Sentrix logo" className="h-10 w-10 rounded-lg" />
              <span className="text-3xl font-extrabold tracking-tighter">Sentrix</span>
            </button>
            <h2 className="mb-6 text-5xl font-bold leading-tight tracking-tight">
              Precise economic intelligence through analytical clarity.
            </h2>

            <div className="border-l-4 border-primary pl-6">
              <div className="mb-6 flex items-start gap-3">
                <LineChart className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">Real-time Sentiment Analysis</p>
                  <p className="text-sm text-on-primary-container">
                    Decode market trends with high-fidelity sentiment signals.
                  </p>
                </div>
              </div>
              <div className="mb-6 flex items-start gap-3">
                <BarChart3 className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">Predictive Modeling</p>
                  <p className="text-sm text-on-primary-container">
                    Leverage AI patterns to forecast stakeholder mood shifts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">Enterprise-grade Security</p>
                  <p className="text-sm text-on-primary-container">
                    Designed with secure auth and role-based system access.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 overflow-hidden rounded-xl border border-white/20 shadow-2xl">
            <img
              src={heroIllustration}
              alt="Analytics dashboard illustration"
              className="h-auto w-full object-cover"
            />
          </div>
        </section>

        <section className="flex w-full flex-1 items-center justify-center bg-surface px-4 py-8 sm:p-8 md:w-1/2 md:p-24">
          <div className="w-full max-w-md">
            <div className="mb-8 md:hidden">
              <button
                type="button"
                onClick={handleBrandClick}
                className="mb-6 flex items-center gap-3 text-left transition hover:opacity-80"
                aria-label="Go to Sentrix home"
              >
                <img src={logo} alt="Sentrix logo" className="h-9 w-9 rounded-md" />
                <span className="text-2xl font-bold tracking-tight text-primary">
                  Sentrix
                </span>
              </button>
            </div>

            <header className="mb-8">
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                Welcome Back
              </h2>
              <p className="font-medium text-on-surface-variant">
                Sign in to your account to continue.
              </p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-xs font-bold uppercase tracking-widest text-outline"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-none border-0 border-b-2 border-transparent bg-surface-container-low px-0 py-4 text-on-surface placeholder:text-outline focus:border-primary focus:ring-0"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-xs font-bold uppercase tracking-widest text-outline"
                >
                  Password
                </label>
                <div className="flex items-center border-b-2 border-transparent bg-surface-container-low focus-within:border-primary">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full border-0 bg-transparent px-0 py-4 text-on-surface placeholder:text-outline focus:ring-0"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((isVisible) => !isVisible)}
                    className="pr-2 text-outline hover:text-primary"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-primary px-6 py-4 text-lg font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login
