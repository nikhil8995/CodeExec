import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const TeacherNav = [
  { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { path: '/questions/new', label: 'New Question', icon: '+' },
  { path: '/my-questions', label: 'My Questions', icon: '☰' },
]

const StudentNav = [
  { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { path: '/questions', label: 'Problems', icon: '◈' },
  { path: '/submissions', label: 'Submissions', icon: '◎' },
]

export default function AppShell({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const hasWindow = typeof globalThis.window === 'object'
  const [sidebarOpen, setSidebarOpen] = useState(() => !(hasWindow && globalThis.window.innerWidth < 1024))
  const nav = user?.role === 'TEACHER' ? TeacherNav : StudentNav

  const handleLogout = () => { logout(); navigate('/login') }
  const handleNavClick = () => {
    if (hasWindow && globalThis.window.innerWidth < 1024) setSidebarOpen(false)
  }

  useEffect(() => {
    if (!hasWindow) return undefined

    const onResize = () => {
      if (globalThis.window.innerWidth < 1024) setSidebarOpen(false)
    }
    globalThis.window.addEventListener('resize', onResize)
    return () => globalThis.window.removeEventListener('resize', onResize)
  }, [hasWindow])

  return (
    <div className="relative flex h-screen overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl"></div>
        <div className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="lg:hidden absolute inset-0 z-10 bg-black/45"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-[calc(100%+1rem)] lg:translate-x-0 w-20'} absolute lg:relative z-20 m-3 mr-0 flex-shrink-0 flex flex-col rounded-2xl bg-dark-800/90 border border-dark-500/80 backdrop-blur-md transition-all duration-300`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-500/90">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-sm font-mono flex-shrink-0 shadow-lg shadow-brand-800/30">
            CE
          </div>
          {sidebarOpen && (
            <div>
              <span className="font-display font-bold text-white text-lg leading-none block">CodeExec</span>
              <span className="text-[11px] tracking-wide uppercase text-slate-500 font-mono">Workspace</span>
            </div>
          )}
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="px-4 pt-4 pb-2">
            <span className={`inline-flex min-h-7 items-center rounded-lg px-2.5 text-[11px] font-mono font-semibold uppercase tracking-wide ${user?.role === 'TEACHER' ? 'bg-amber-900/40 text-amber-300 border border-amber-700/40' : 'bg-brand-900/40 text-brand-300 border border-brand-700/40'}`}>
              {user?.role?.toLowerCase()}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1.5">
          {nav.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}
                onClick={handleNavClick}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-brand-600/30 to-cyan-500/10 text-brand-200 border border-brand-500/40 shadow-[0_8px_20px_rgba(45,95,245,0.18)]'
                    : 'text-slate-400 hover:bg-dark-600/80 hover:text-slate-200 border border-transparent'
                }`}>
                <span className={`text-base w-6 text-center flex-shrink-0 ${active ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300'}`}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-dark-500/90 bg-dark-900/40 rounded-b-2xl">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-900/20 transition-all" title="Logout">✕</button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full min-h-10 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-red-300 hover:bg-red-900/20 transition-all" title="Logout">✕</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden m-3 rounded-2xl border border-dark-500/80 bg-dark-900/55 backdrop-blur-sm lg:ml-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-dark-500/90 bg-dark-800/70 backdrop-blur-sm flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-dark-600 transition-all">
            <div className="space-y-1">
              <span className="block w-5 h-0.5 bg-current"></span>
              <span className="block w-4 h-0.5 bg-current"></span>
              <span className="block w-5 h-0.5 bg-current"></span>
            </div>
          </button>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="rounded-lg border border-dark-400 px-2.5 py-1 text-slate-400 bg-dark-700/70">{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
