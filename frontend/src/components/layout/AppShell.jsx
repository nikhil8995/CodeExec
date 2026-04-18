import React, { useState } from 'react'
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const nav = user?.role === 'TEACHER' ? TeacherNav : StudentNav

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0 flex flex-col bg-dark-800 border-r border-dark-500 transition-all duration-300`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-500">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm font-mono flex-shrink-0">
            CE
          </div>
          {sidebarOpen && (
            <span className="font-display font-bold text-white text-lg leading-none">CodeExec</span>
          )}
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="px-4 py-3">
            <span className={`text-xs font-mono px-2 py-1 rounded-full ${user?.role === 'TEACHER' ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' : 'bg-brand-900/50 text-brand-300 border border-brand-700/50'}`}>
              {user?.role?.toLowerCase()}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-1">
          {nav.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                    : 'text-slate-400 hover:bg-dark-600 hover:text-slate-200'
                }`}>
                <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-dark-500">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors text-xs" title="Logout">✕</button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-slate-500 hover:text-red-400 transition-colors" title="Logout">✕</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-dark-500 bg-dark-800/50 backdrop-blur-sm flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-slate-200 transition-colors">
            <div className="space-y-1">
              <span className="block w-5 h-0.5 bg-current"></span>
              <span className="block w-4 h-0.5 bg-current"></span>
              <span className="block w-5 h-0.5 bg-current"></span>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
