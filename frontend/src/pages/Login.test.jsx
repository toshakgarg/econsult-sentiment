import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from './Login'
import {
  loginWithEmail,
  loginWithGoogle,
  registerUser,
  resetPassword,
} from '../services/firebase'

const mockedNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

vi.mock('../services/firebase', () => ({
  getAuthErrorMessage: (error) => error?.message || 'Authentication failed.',
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  registerUser: vi.fn(),
  resetPassword: vi.fn(),
}))

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('signs in with email and password', async () => {
    const userProfile = { id: 'uid-1', email: 'person@example.com' }
    const onLogin = vi.fn()
    loginWithEmail.mockResolvedValue(userProfile)
    const user = userEvent.setup()
    render(<Login onLogin={onLogin} />)

    await user.type(screen.getByLabelText('Email address'), 'person@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => expect(loginWithEmail).toHaveBeenCalledWith('person@example.com', 'secret123'))
    expect(onLogin).toHaveBeenCalledWith(userProfile)
    expect(mockedNavigate).toHaveBeenCalledWith('/home', { replace: true })
  })

  it('registers with email and password', async () => {
    registerUser.mockResolvedValue({ id: 'new-uid' })
    const user = userEvent.setup()
    render(<Login onLogin={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Create an account' }))
    await user.type(screen.getByLabelText('Email address'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => expect(registerUser).toHaveBeenCalledWith('new@example.com', 'secret123'))
  })

  it('signs in with Google', async () => {
    loginWithGoogle.mockResolvedValue({ id: 'google-uid' })
    const user = userEvent.setup()
    render(<Login onLogin={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }))

    await waitFor(() => expect(loginWithGoogle).toHaveBeenCalled())
  })

  it('requests a password reset for the entered email', async () => {
    resetPassword.mockResolvedValue()
    const user = userEvent.setup()
    render(<Login onLogin={vi.fn()} />)

    await user.type(screen.getByLabelText('Email address'), 'person@example.com')
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith('person@example.com'))
    expect(screen.getByRole('status')).toHaveTextContent('If an account exists')
  })

  it('requires an email before requesting a password reset', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))

    expect(resetPassword).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email address')
  })

  it('navigates to the landing page from the Sentrix brand', async () => {
    render(<Login onLogin={vi.fn()} />)

    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: 'Go to Sentrix home' })[0])

    expect(mockedNavigate).toHaveBeenCalledWith('/')
  })
})
