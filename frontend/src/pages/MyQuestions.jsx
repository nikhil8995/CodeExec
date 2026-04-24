import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

export default function MyQuestions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/questions/mine').then(r => setQuestions(r.data)).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this question? All submissions will be removed.')) return
    await api.delete(`/questions/${id}`)
    setQuestions(qs => qs.filter(q => q.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl"></div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300/80 font-mono">Teacher Space</p>
            <h1 className="text-3xl font-display font-bold text-white mt-1.5">My Questions</h1>
            <p className="text-slate-400 text-sm mt-1">{questions.length} questions created</p>
          </div>
          <Link to="/questions/new"><Button size="lg">+ New Question</Button></Link>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading...</div>
      ) : questions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-500">No questions yet.</p>
        </Card>
      ) : (
        <div className="space-y-3 stagger-fade">
          {questions.map(q => (
            <Card key={q.id} className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-100">{q.title}</h3>
                  <Badge label={q.difficulty} />
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{q.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-slate-600 font-mono">{q._count?.submissions || 0} submissions</span>
                  <span className="text-xs text-slate-600 font-mono">{new Date(q.createdAt).toLocaleDateString()}</span>
                  {q.timeLimit > 0 && (
                    <span className="text-xs text-slate-600 font-mono">⏱ {Math.floor(q.timeLimit / 60)}m</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/questions/${q.id}/submissions`)}>
                  View Submissions
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(q.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
