import React from 'react'

const variants = {
  primary: 'bg-brand-600 hover:bg-brand-500 text-white border-brand-600',
  secondary: 'bg-dark-600 hover:bg-dark-500 text-slate-200 border-dark-400',
  danger: 'bg-red-900/50 hover:bg-red-800/50 text-red-300 border-red-700/50',
  ghost: 'bg-transparent hover:bg-dark-600 text-slate-400 border-transparent',
}

export default function Button({ children, variant = 'primary', className = '', disabled, loading, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${variants[variant]} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}>
      {loading && <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></span>}
      {children}
    </button>
  )
}
