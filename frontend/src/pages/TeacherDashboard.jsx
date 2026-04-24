import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/questions/mine').then(r => setQuestions(r.data)).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return
    await api.delete(`/questions/${id}`)
    setQuestions(qs => qs.filter(q => q.id !== id))
  }

  const totalSubmissions = questions.reduce((sum, q) => sum + (q._count?.submissions || 0), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <Card className="relative overflow-hidden p-6 sm:p-7">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="pointer-events-none absolute left-10 -bottom-16 h-36 w-36 rounded-full bg-brand-500/10 blur-3xl"></div>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300/80 font-mono">Teaching Hub</p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mt-2">Welcome back, {user?.name}</h1>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl">Manage coding challenges, review learner activity, and keep your class momentum high.</p>
          </div>
          <Link to="/questions/new">
            <Button size="lg" className="w-full sm:w-auto">+ Create New Question</Button>
          </Link>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Questions', value: questions.length, color: 'text-brand-300', tone: 'from-brand-500/20 to-brand-900/10' },
          { label: 'Total Submissions', value: totalSubmissions, color: 'text-emerald-300', tone: 'from-emerald-500/20 to-emerald-900/10' },
          { label: 'Active Students', value: 'Live', color: 'text-cyan-300', tone: 'from-cyan-500/20 to-cyan-900/10' },
        ].map(stat => (
          <Card key={stat.label} className={`bg-gradient-to-br ${stat.tone}`}>
            <p className="text-slate-400 text-[11px] font-medium uppercase tracking-[0.18em]">{stat.label}</p>
            <p className={`text-3xl font-display font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-semibold text-slate-100">Your Questions</h2>
          <span className="text-xs font-mono text-slate-500">{questions.length} total</span>
        </div>
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : questions.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-500 text-sm">No questions yet.</p>
            <Link to="/questions/new" className="mt-3 inline-block">
              <Button variant="secondary">Create your first question</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3 stagger-fade">
            {questions.map(q => (
              <Card key={q.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-200 truncate">{q.title}</h3>
                    <Badge label={q.difficulty} />
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{q.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs font-mono text-slate-500">
                    <span>{q._count?.submissions || 0} submissions</span>
                    <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="danger" size="sm" onClick={() => handleDelete(q.id)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
