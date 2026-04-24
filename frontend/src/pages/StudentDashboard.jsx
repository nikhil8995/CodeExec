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
  const score = attempted > 0 ? Math.round((passed / attempted) * 100) : 0

  let recentSubmissionsContent
  if (loading) {
    recentSubmissionsContent = <div className="text-center py-8 text-slate-500">Loading...</div>
  } else if (submissions.length === 0) {
    recentSubmissionsContent = (
      <Card className="text-center py-8">
        <p className="text-slate-500 text-sm">No submissions yet.</p>
        <Link to="/questions" className="mt-2 text-brand-400 text-sm inline-block">Browse problems →</Link>
      </Card>
    )
  } else {
    recentSubmissionsContent = (
      <div className="space-y-2.5 stagger-fade">
        {submissions.slice(0, 5).map(sub => (
          <Link key={sub.id} to={`/submissions?submissionId=${sub.id}`}>
            <Card hover className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-200">{sub.question?.title}</p>
                <p className="text-xs text-slate-600 font-mono mt-0.5">{new Date(sub.createdAt).toLocaleString()}</p>
              </div>
              <Badge label={sub.status} />
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <Card className="relative overflow-hidden p-6 sm:p-7">
        <div className="pointer-events-none absolute -top-14 right-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-16 left-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl"></div>
        <div className="relative flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 font-mono">Student Arena</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">Keep coding, {user?.name}!</h1>
          <p className="text-sm text-slate-400 max-w-2xl">Solve problems daily, improve consistency, and track your performance in real time.</p>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Attempted', value: attempted, color: 'text-brand-300' },
          { label: 'Passed', value: passed, color: 'text-emerald-300' },
          { label: 'Success Rate', value: `${score}%`, color: 'text-cyan-300' },
          { label: 'Total Problems', value: questions.length, color: 'text-violet-300' },
        ].map(stat => (
          <Card key={stat.label}>
            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-[0.18em]">{stat.label}</p>
            <p className={`text-3xl font-display font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-semibold text-slate-200">Recent Submissions</h2>
          <Link to="/submissions" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
        </div>
        {recentSubmissionsContent}
      </div>

      {/* Quick access */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-semibold text-slate-200">Available Problems</h2>
          <Link to="/questions" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-fade">
          {questions.slice(0, 4).map(q => (
            <Link key={q.id} to={`/questions/${q.id}`}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-100 text-sm leading-snug">{q.title}</h3>
                  <Badge label={q.difficulty} />
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{q.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
