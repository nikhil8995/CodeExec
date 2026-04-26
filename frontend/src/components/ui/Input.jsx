import React from 'react'

export default function Input({ label, error, icon, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
          {icon && <span className="text-brand-400">{icon}</span>}
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`w-full px-4 py-3 rounded-xl bg-dark-700/80 border ${error ? 'border-red-600' : 'border-dark-400/50'} text-slate-200 placeholder-slate-600 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all ${icon ? 'pl-11' : ''} ${className}`}
          {...props}
        />
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}