import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from './Login'
import { loginWithEmail } from '../services/appwrite'

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
    await user.type(screen.getByLabelText('Official Email'), 'officer@mca.gov.in')
    await user.type(screen.getByLabelText('Password'), 'securepass123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() =>
      expect(loginWithEmail).toHaveBeenCalledWith(
        'officer@mca.gov.in',
        'securepass123',
      ),
    )
    expect(onLogin).toHaveBeenCalledWith({ name: 'MCA Officer' })
    expect(mockedNavigate).toHaveBeenCalledWith('/', { replace: true })
  })
})
