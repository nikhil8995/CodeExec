import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Student Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Keep coding, {user?.name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Attempted', value: attempted, color: 'text-brand-400' },
          { label: 'Passed', value: passed, color: 'text-emerald-400' },
          { label: 'Total Problems', value: questions.length, color: 'text-purple-400' },
        ].map(stat => (
          <Card key={stat.label}>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-display font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-semibold text-slate-200">Recent Submissions</h2>
          <Link to="/submissions" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
        </div>
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : submissions.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-slate-500 text-sm">No submissions yet.</p>
            <Link to="/questions" className="mt-2 text-brand-400 text-sm inline-block">Browse problems →</Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {submissions.slice(0, 5).map(sub => (
              <Card key={sub.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{sub.question?.title}</p>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">{new Date(sub.createdAt).toLocaleString()}</p>
                </div>
                <Badge label={sub.status} />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick access */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-semibold text-slate-200">Available Problems</h2>
          <Link to="/questions" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {questions.slice(0, 4).map(q => (
            <Link key={q.id} to={`/questions/${q.id}`}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-200 text-sm">{q.title}</h3>
                  <Badge label={q.difficulty} />
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{q.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
