import React from 'react'

export default function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <textarea
        className={`w-full px-3 py-2.5 rounded-lg bg-dark-700 border ${error ? 'border-red-600' : 'border-dark-400'} text-slate-200 placeholder-slate-600 text-sm outline-none focus:border-brand-500 transition-colors resize-y ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
