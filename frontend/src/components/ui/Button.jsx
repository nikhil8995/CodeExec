import React from 'react'

const variants = {
  primary: 'bg-brand-500 hover:bg-brand-400 text-white border-brand-400 shadow-[0_8px_18px_rgba(45,95,245,0.24)]',
  secondary: 'bg-dark-600 hover:bg-dark-500 text-slate-100 border-dark-400',
  danger: 'bg-red-900/40 hover:bg-red-800/45 text-red-200 border-red-700/50',
  ghost: 'bg-transparent hover:bg-dark-600 text-slate-300 border-transparent',
}

const sizes = {
  sm: 'min-h-9 px-3 text-xs rounded-lg',
  md: 'min-h-10 px-4 text-sm rounded-xl',
  lg: 'min-h-11 px-5 text-sm rounded-xl',
}

export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 ${variants[variant]} ${sizes[size] || sizes.md} ${(disabled || loading) ? 'opacity-55 cursor-not-allowed shadow-none' : 'hover:-translate-y-0.5'} ${className}`}
      {...props}>
      {loading && <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></span>}
      {children}
    </button>
  )
}
