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
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 left-[15%] w-[28rem] h-[28rem] bg-brand-600/12 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-[10%] w-[24rem] h-[24rem] bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl relative animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] rounded-3xl border border-dark-500/80 overflow-hidden bg-dark-900/60 backdrop-blur-md shadow-[0_20px_70px_rgba(3,8,20,0.55)]">
          <div className="hidden lg:flex flex-col justify-between p-10 border-r border-dark-500/70 bg-gradient-to-br from-dark-800/70 to-dark-900/40">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 mb-5 shadow-lg shadow-brand-800/30">
                <span className="text-white font-bold font-mono text-lg">CE</span>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-300/80 font-mono">CodeExec Platform</p>
              <h2 className="text-4xl font-display font-bold text-white leading-tight mt-4">Run code.<br />Ship confidence.</h2>
              <p className="text-sm text-slate-400 mt-4 max-w-md">A focused coding workspace for classes and learners with instant feedback and structured progress.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-dark-500/70 bg-dark-800/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Realtime Runs</p>
                <p className="text-lg font-display font-semibold text-cyan-300">Fast</p>
              </div>
              <div className="rounded-xl border border-dark-500/70 bg-dark-800/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Grading</p>
                <p className="text-lg font-display font-semibold text-emerald-300">Structured</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="text-center lg:text-left">
              <div className="inline-flex lg:hidden items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 mb-4">
                <span className="text-white font-bold font-mono text-base">CE</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white">Welcome back</h1>
              <p className="text-slate-400 text-sm mt-1.5">Sign in to continue to your workspace</p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-300 text-sm">
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
              <Button size="lg" type="submit" className="w-full justify-center" loading={loading}>
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 pt-1">
              No account?{' '}
              <Link to="/register" className="text-brand-300 hover:text-brand-200 transition-colors font-medium">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
