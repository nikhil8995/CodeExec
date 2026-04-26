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
  const avgDifficulty = questions.length ? questions.reduce((sum, q) => {
    const diff = q.difficulty === 'EASY' ? 1 : q.difficulty === 'MEDIUM' ? 2 : 3
    return sum + diff
  }, 0) / questions.length : 0

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Welcome back, <span className="gradient-text">{user?.name}</span> 👋
          </h1>
          <p className="text-slate-500 mt-2">Here are your teaching stats</p>
        </div>
        <Link to="/questions/new">
          <Button icon="➕">Create Question</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        {[
          { label: 'Total Questions', value: questions.length, icon: '📚', color: 'from-blue-500 to-blue-600', stats: `${questions.length} problems created` },
          { label: 'Total Submissions', value: totalSubmissions, icon: '📝', color: 'from-emerald-500 to-emerald-600', stats: `${totalSubmissions} attempts` },
          { label: 'Success Rate', value: '85%', icon: '🎯', color: 'from-purple-500 to-purple-600', stats: 'avg 85% pass rate' },
        ].map((stat, idx) => (
          <Card key={stat.label} glow className="card-lift relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-20`} />
            <div className="relative">
              <p className="text-4xl mb-2">{stat.icon}</p>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
              <p className={`text-4xl font-display font-bold mt-1 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
              <p className="text-slate-600 text-xs mt-2">{stat.stats}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-display font-semibold text-slate-200 mb-4">Your Questions</h2>
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : questions.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-6xl mb-4">📝</p>
            <p className="text-slate-400">No questions yet</p>
            <Link to="/questions/new">
              <Button className="mt-4">Create your first question</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3 stagger-children">
            {questions.map(q => (
              <Card key={q.id} hover className="card-lift">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link to={`/questions/${q.id}`} className="text-lg font-medium text-white hover:text-brand-400 transition-colors">
                      {q.title}
                    </Link>
                    <p className="text-slate-500 text-sm mt-1">{q.description?.slice(0, 80)}...</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant={q.difficulty === 'EASY' ? 'success' : q.difficulty === 'MEDIUM' ? 'warning' : 'danger'}>
                        {q.difficulty}
                      </Badge>
                      <span className="text-slate-600 text-sm">{q._count?.submissions || 0} submissions</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/questions/${q.id}/submissions`}>
                      <Button variant="secondary" size="sm">View</Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(q.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}