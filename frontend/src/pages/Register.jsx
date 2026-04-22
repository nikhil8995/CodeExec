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
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-sm relative animate-fadeIn">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500 mb-4">
            <span className="text-white font-bold font-mono text-lg">CE</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Create account</h1>
          <p className="text-slate-500 text-sm mt-1">Join CodeExec today</p>
        </div>

        <div className="bg-dark-800 border border-dark-500 rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" placeholder="Jane Smith" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
            <Input label="Password" type="password" placeholder="min 6 characters" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />

            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-slate-300">Role</span>
              <div className="grid grid-cols-2 gap-2">
                {['STUDENT', 'TEACHER'].map(r => (
                  <label
                    key={r}
                    htmlFor={`role-${r}`}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-all cursor-pointer text-center ${
                      form.role === r
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                        : 'bg-dark-700 border-dark-400 text-slate-400 hover:border-dark-300'
                    }`}
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
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full justify-center" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
