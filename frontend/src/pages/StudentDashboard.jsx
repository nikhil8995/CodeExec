import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/submissions/mine'),
      api.get('/questions'),
    ]).then(([s, q]) => {
      setSubmissions(s.data)
      setQuestions(q.data)
    }).finally(() => setLoading(false))
  }, [])

  const passed = submissions.filter(s => s.status === 'PASS').length
  const attempted = new Set(submissions.map(s => s.questionId)).size
  const passRate = submissions.length > 0 ? Math.round((passed / submissions.length) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Hey, <span className="gradient-text">{user?.name}</span> 👋
          </h1>
          <p className="text-slate-500 mt-2">Ready to code today?</p>
        </div>
        <Link to="/questions">
          <Button icon="🎯" className="from-blue-500 to-blue-600 btn-glow-primary">Start Coding</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        {[
          { label: 'Problems Solved', value: passed, icon: '✅', color: 'from-emerald-500 to-emerald-600', stats: `${passRate}% success rate` },
          { label: 'Problems Attempted', value: attempted, icon: '📝', color: 'from-blue-500 to-blue-600', stats: `${questions.length - attempted} remaining` },
          { label: 'Available', value: questions.length - attempted, icon: '📚', color: 'from-purple-500 to-purple-600', stats: 'problems available' },
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

      {/* Recent Submissions */}
      <div>
        <h2 className="text-xl font-display font-semibold text-slate-200 mb-4">Recent Attempts</h2>
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : submissions.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-6xl mb-4">🚀</p>
            <p className="text-slate-400">No submissions yet</p>
            <Link to="/questions">
              <button className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500">
                Try your first problem
              </button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3 stagger-children">
            {submissions.slice(0, 5).map(s => (
              <Card key={s.id} hover className="card-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{s.question?.title || 'Unknown'}</p>
                    <p className="text-slate-500 text-sm mt-1">
                      {new Date(s.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <Badge variant={s.status === 'PASS' ? 'success' : 'danger'}>
                    {s.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}