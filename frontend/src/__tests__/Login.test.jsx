import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

// Mock the navigate function
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock AuthContext
const mockLogin = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}))

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with email and password fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('should show a link to the register page', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByText('Register')).toBeInTheDocument()
  })

  it('should display error message on login failure', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const emailInput = screen.getByPlaceholderText('you@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByText('Sign In')

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should navigate to dashboard on successful login', async () => {
    mockLogin.mockResolvedValue({ role: 'STUDENT' })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const emailInput = screen.getByPlaceholderText('you@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByText('Sign In')

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })
})
