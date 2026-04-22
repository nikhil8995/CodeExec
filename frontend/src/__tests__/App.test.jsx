import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

// Mock AuthContext to control user state
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: null, loading: false }),
}))

describe('App Component', () => {
  it('should render without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )
  })

  it('should redirect unauthenticated users to login', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    )
    // Since user is null, PrivateRoute redirects to /login
    // The Login page should render
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })
})
