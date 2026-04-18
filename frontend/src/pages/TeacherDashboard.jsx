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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Teacher Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link to="/questions/new">
          <Button>+ New Question</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Questions', value: questions.length, color: 'text-brand-400' },
          { label: 'Total Submissions', value: totalSubmissions, color: 'text-emerald-400' },
          { label: 'Active Students', value: '–', color: 'text-purple-400' },
        ].map(stat => (
          <Card key={stat.label}>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-display font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Questions */}
      <div>
        <h2 className="text-lg font-display font-semibold text-slate-200 mb-3">Your Questions</h2>
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
          <div className="space-y-3">
            {questions.map(q => (
              <Card key={q.id} className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-200 truncate">{q.title}</h3>
                    <Badge label={q.difficulty} />
                  </div>
                  <p className="text-sm text-slate-500 truncate">{q.description}</p>
                  <p className="text-xs text-slate-600 mt-1 font-mono">{q._count?.submissions || 0} submissions</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="danger" onClick={() => handleDelete(q.id)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
