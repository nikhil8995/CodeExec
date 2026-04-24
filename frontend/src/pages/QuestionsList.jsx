import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export default function QuestionsList() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    api.get('/questions').then(r => setQuestions(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? questions : questions.filter(q => q.difficulty === filter)

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-14 right-0 h-36 w-36 rounded-full bg-brand-500/10 blur-3xl"></div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300/80 font-mono">Problem Bank</p>
            <h1 className="text-3xl font-display font-bold text-white mt-1.5">Problems</h1>
            <p className="text-slate-400 text-sm mt-1">{questions.length} problems available</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'EASY', 'MEDIUM', 'HARD'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`min-h-9 px-3.5 rounded-xl text-xs font-mono font-semibold border transition-all ${
                  filter === f ? 'bg-brand-600/20 border-brand-500 text-brand-300' : 'bg-dark-700 border-dark-500 text-slate-400 hover:border-dark-400 hover:text-slate-300'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading problems...</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-500">No problems found.</p>
        </Card>
      ) : (
        <div className="space-y-3 stagger-fade">
          {filtered.map((q, i) => (
            <Link key={q.id} to={`/questions/${q.id}`}>
              <Card hover className="flex items-center gap-4">
                <span className="text-slate-600 font-mono text-sm w-8 flex-shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100">{q.title}</h3>
                    <Badge label={q.difficulty} />
                  </div>
                  <p className="text-sm text-slate-400 truncate mt-0.5">{q.description}</p>
                </div>
                <div className="text-xs text-slate-500 flex-shrink-0 font-mono">
                  by {q.createdBy?.name}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
