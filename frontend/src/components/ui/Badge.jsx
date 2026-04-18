import React from 'react'

const variants = {
  PASS: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
  FAIL: 'bg-red-900/40 text-red-400 border-red-700/40',
  PENDING: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/40',
  EASY: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
  MEDIUM: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/40',
  HARD: 'bg-red-900/40 text-red-400 border-red-700/40',
  TEACHER: 'bg-purple-900/40 text-purple-400 border-purple-700/40',
  STUDENT: 'bg-brand-900/40 text-brand-400 border-brand-700/40',
}

export default function Badge({ label }) {
  const cls = variants[label] || 'bg-dark-500 text-slate-400 border-dark-400'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium border ${cls}`}>
      {label}
    </span>
  )
}
