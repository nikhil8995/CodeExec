import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'STUDENT' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.email, form.password, form.name, form.role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl animate-pulse delay-700" />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-xl shadow-brand-600/30">
            <span className="text-white font-bold text-2xl font-mono">CE</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Create Account</h1>
          <p className="text-slate-500 mt-2">Join CodeExec and start learning</p>
        </div>

        <div className="bg-dark-800/80 backdrop-blur-lg border border-dark-500/50 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="min 6 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {['STUDENT', 'TEACHER'].map(r => (
                  <label
                    key={r}
                    htmlFor={`role-${r}`}
                    className={`
                      py-3 rounded-xl text-sm font-medium border transition-all cursor-pointer text-center
                      ${form.role === r
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300 shadow-lg shadow-brand-500/20' 
                        : 'bg-dark-700/50 border-dark-400 text-slate-400 hover:border-dark-300 hover:bg-dark-600'
                      }
                    `}
                  >
                    <input
                      id={`role-${r}`}
                      type="radio"
                      name="role"
                      value={r}
                      checked={form.role === r}
                      onChange={() => setForm({ ...form, role: r })}
                      className="sr-only"
                    />
                    {r === 'STUDENT' ? '🎓 Student' : '👩‍🏫 Teacher'}
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full justify-center py-3">
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-500/50">
            <p className="text-center text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          CodeExec © 2026 — Built for learning
        </p>
      </div>
    </div>
  )
}