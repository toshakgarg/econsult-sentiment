import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, LineChart, ShieldCheck } from 'lucide-react'
import {
  getAuthErrorMessage,
  loginWithEmail,
  loginWithGoogle,
  registerUser,
  resetPassword,
} from '../services/firebase'
import heroIllustration from '../assets/images/hero-illustration.png'
import logo from '../assets/images/logo.png'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBrandClick = () => {
    navigate('/')
  }

  const runAuthentication = async (authenticate) => {
    setError('')
    setNotice('')
    setIsSubmitting(true)
    try {
      const user = await authenticate()
      onLogin(user)
      navigate('/home', { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await runAuthentication(() =>
      isRegistering ? registerUser(email, password) : loginWithEmail(email, password),
    )
  }

  const handleGoogleSignIn = () => runAuthentication(loginWithGoogle)

  const handlePasswordReset = async () => {
    setError('')
    setNotice('')
    if (!email.trim()) {
      setError('Enter your email address first, then request a password reset.')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(email.trim())
      setNotice('If an account exists for this email, a password reset link will be sent.')
    } catch (err) {
      if (err?.code === 'auth/user-not-found') {
        setNotice('If an account exists for this email, a password reset link will be sent.')
      } else {
        setError(getAuthErrorMessage(err))
      }
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
                {isRegistering ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="font-medium text-on-surface-variant">
                {isRegistering
                  ? 'Create your account to start using Sentrix.'
                  : 'Sign in to your account to continue.'}
              </p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error ? (
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              {notice ? (
                <div role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {notice}
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-on-surface">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-outline-variant/40 bg-white px-4 py-3 text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-on-surface">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-outline-variant/40 bg-white px-4 py-3 text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-primary px-6 py-4 text-lg font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? isRegistering
                    ? 'Creating account...'
                    : 'Signing in...'
                  : isRegistering
                    ? 'Create Account'
                    : 'Sign In'}
              </button>
            </form>

            {!isRegistering ? (
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isSubmitting}
                className="mt-4 w-full text-sm font-semibold text-primary hover:underline disabled:opacity-70"
              >
                Forgot password?
              </button>
            ) : null}

            <div className="my-6 flex items-center gap-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              <span className="h-px flex-1 bg-outline-variant/30" />
              Or continue with
              <span className="h-px flex-1 bg-outline-variant/30" />
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-outline-variant/40 bg-white px-6 py-3 font-semibold text-on-surface transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span aria-hidden="true" className="text-lg font-bold text-primary">G</span>
              Continue with Google
            </button>

            <p className="mt-6 text-center text-sm text-on-surface-variant">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering((isRegisteringMode) => !isRegisteringMode)
                  setError('')
                  setNotice('')
                }}
                className="font-bold text-primary hover:underline"
              >
                {isRegistering ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login
