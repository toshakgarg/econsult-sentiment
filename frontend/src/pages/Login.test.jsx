import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from './Login'
import { loginWithEmail, registerUser } from '../services/appwrite'

const mockedNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

vi.mock('../services/appwrite', () => ({
  loginWithEmail: vi.fn(),
  registerUser: vi.fn(),
}))

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs in and redirects on successful authentication', async () => {
    const onLogin = vi.fn()
    loginWithEmail.mockResolvedValue({ name: 'MCA Officer' })

    render(<Login onLogin={onLogin} />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email Address'), 'officer@mca.gov.in')
    await user.type(screen.getByLabelText('Password'), 'securepass123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() =>
      expect(loginWithEmail).toHaveBeenCalledWith(
        'officer@mca.gov.in',
        'securepass123',
      ),
    )
    expect(onLogin).toHaveBeenCalledWith({ name: 'MCA Officer' })
    expect(mockedNavigate).toHaveBeenCalledWith('/home', { replace: true })
  })

  it('toggles password visibility from the eye button', async () => {
    render(<Login onLogin={vi.fn()} />)

    const user = userEvent.setup()
    const passwordInput = screen.getByLabelText('Password')

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('creates an account and redirects on successful registration', async () => {
    const onLogin = vi.fn()
    registerUser.mockResolvedValue({ name: 'New User' })

    render(<Login onLogin={onLogin} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Create an account' }))
    await user.type(screen.getByLabelText('Full Name'), 'New User')
    await user.type(screen.getByLabelText('Email Address'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'securepass123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() =>
      expect(registerUser).toHaveBeenCalledWith(
        'New User',
        'new@example.com',
        'securepass123',
      ),
    )
    expect(onLogin).toHaveBeenCalledWith({ name: 'New User' })
    expect(mockedNavigate).toHaveBeenCalledWith('/home', { replace: true })
  })

  it('navigates to the landing page from the Sentrix brand', async () => {
    render(<Login onLogin={vi.fn()} />)

    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: 'Go to Sentrix home' })[0])

    expect(mockedNavigate).toHaveBeenCalledWith('/')
  })
})
