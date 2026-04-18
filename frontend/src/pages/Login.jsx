import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-sm relative animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500 mb-4">
            <span className="text-white font-bold font-mono text-lg">CE</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to CodeExec</p>
        </div>

        <div className="bg-dark-800 border border-dark-500 rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
            <Button type="submit" className="w-full justify-center" loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 transition-colors">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
