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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-[12%] w-[28rem] h-[28rem] bg-brand-600/12 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-[12%] w-[24rem] h-[24rem] bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl relative animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] rounded-3xl border border-dark-500/80 overflow-hidden bg-dark-900/60 backdrop-blur-md shadow-[0_20px_70px_rgba(3,8,20,0.55)]">
          <div className="hidden lg:flex flex-col justify-between p-10 border-r border-dark-500/70 bg-gradient-to-br from-dark-800/70 to-dark-900/40">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 mb-5 shadow-lg shadow-brand-800/30">
                <span className="text-white font-bold font-mono text-lg">CE</span>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 font-mono">Get Started</p>
              <h2 className="text-4xl font-display font-bold text-white leading-tight mt-4">Create your coding space.</h2>
              <p className="text-sm text-slate-400 mt-4 max-w-md">Join as student or teacher and start solving or managing challenges in minutes.</p>
            </div>
            <div className="rounded-xl border border-dark-500/70 bg-dark-800/70 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Setup Time</p>
              <p className="text-xl font-display font-semibold text-brand-300">Under 1 minute</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="text-center lg:text-left">
              <div className="inline-flex lg:hidden items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 mb-4">
                <span className="text-white font-bold font-mono text-base">CE</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white">Create account</h1>
              <p className="text-slate-400 text-sm mt-1.5">Join CodeExec today</p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-300 text-sm">
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
                      className={`min-h-11 rounded-xl text-sm font-semibold border transition-all cursor-pointer text-center inline-flex items-center justify-center ${
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

              <Button size="lg" type="submit" className="w-full justify-center" loading={loading}>
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 pt-1">
              Have an account?{' '}
              <Link to="/login" className="text-brand-300 hover:text-brand-200 transition-colors font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
