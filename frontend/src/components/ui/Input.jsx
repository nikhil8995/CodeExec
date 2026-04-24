import React from 'react'

export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <input
        className={`w-full min-h-11 px-3.5 rounded-xl bg-dark-700/90 border ${error ? 'border-red-600' : 'border-dark-400'} text-slate-100 placeholder-slate-500 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
