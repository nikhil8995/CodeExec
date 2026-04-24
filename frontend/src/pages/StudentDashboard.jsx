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
  const attempted = submissions.length
  const score = attempted > 0 ? Math.round((passed / attempted) * 100) : 0

  const recentSubmissions = submissions.slice(0, 6)
  const recommendedQuestions = questions.slice(0, 6)

  let recentSubmissionsContent
  if (loading) {
    recentSubmissionsContent = <div className="text-center py-10 text-slate-500">Loading...</div>
  } else if (recentSubmissions.length === 0) {
    recentSubmissionsContent = (
      <div className="text-center py-10">
        <p className="text-slate-500 text-sm">No submissions yet.</p>
        <Link to="/questions" className="mt-2 text-cyan-300 text-sm inline-block hover:text-cyan-200">Solve your first problem</Link>
      </div>
    )
  } else {
    recentSubmissionsContent = (
      <div className="space-y-3">
        {recentSubmissions.map((sub) => (
          <Link key={sub.id} to={`/submissions?submissionId=${sub.id}`} className="block">
            <div className="rounded-xl border border-dark-500 bg-dark-900/40 px-3 py-3 hover:border-cyan-500/40 hover:bg-dark-800/60 transition-all">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{sub.question?.title || 'Untitled question'}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">{new Date(sub.createdAt).toLocaleString()}</p>
                </div>
                <Badge label={sub.status} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <Card className="relative overflow-hidden p-6 sm:p-8 border-cyan-500/20 bg-gradient-to-br from-dark-800/80 to-dark-900/70">
        <div className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="relative flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 font-mono">Student Command Center</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">Welcome back, {user?.name}</h1>
          <p className="text-sm text-slate-300 max-w-2xl">Track every run, inspect every submission, and keep your momentum with a focused workflow.</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Attempts', value: attempted, color: 'text-cyan-300', tone: 'from-cyan-500/20 to-cyan-900/10' },
          { label: 'Passed', value: passed, color: 'text-emerald-300', tone: 'from-emerald-500/20 to-emerald-900/10' },
          { label: 'Success Rate', value: `${score}%`, color: 'text-yellow-300', tone: 'from-yellow-500/20 to-yellow-900/10' },
          { label: 'Problems', value: questions.length, color: 'text-brand-300', tone: 'from-brand-500/20 to-brand-900/10' },
        ].map(stat => (
          <Card key={stat.label} className={`bg-gradient-to-br ${stat.tone}`}>
            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-[0.18em]">{stat.label}</p>
            <p className={`text-3xl font-display font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-slate-200">Recent Submissions</h2>
            <Link to="/submissions" className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors">Open submissions</Link>
          </div>

          {recentSubmissionsContent}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-slate-200">Recommended Problems</h2>
            <Link to="/questions" className="text-sm text-brand-300 hover:text-brand-200 transition-colors">Browse all</Link>
          </div>

          <div className="space-y-2">
            {recommendedQuestions.map((q) => (
              <Link key={q.id} to={`/questions/${q.id}`}>
                <div className="rounded-xl border border-dark-500 bg-dark-900/40 px-3 py-3 hover:border-brand-500/40 hover:bg-dark-800/60 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-100 font-medium leading-snug">{q.title}</p>
                    <Badge label={q.difficulty} />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{q.description}</p>
                </div>
              </Link>
            ))}
            {!loading && recommendedQuestions.length === 0 && (
              <p className="text-sm text-slate-500">No problems available right now.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
