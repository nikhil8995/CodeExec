import React from 'react'

export default function Card({ children, className = '', hover = false }) {
  return (
    <div className={`bg-dark-800 border border-dark-500 rounded-xl p-5 ${hover ? 'hover:border-brand-600/50 hover:bg-dark-700 transition-all cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  )
}
