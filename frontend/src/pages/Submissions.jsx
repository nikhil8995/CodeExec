import React, { useEffect, useState } from 'react'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export default function Submissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/submissions/mine').then(r => setSubmissions(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">My Submissions</h1>
        <p className="text-slate-500 text-sm mt-1">{submissions.length} submissions total</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading...</div>
      ) : submissions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-500">No submissions yet. Solve some problems!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <Card key={sub.id} className={`cursor-pointer transition-all ${expanded === sub.id ? 'border-dark-400' : ''}`}
              onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 truncate">{sub.question?.title}</p>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">{new Date(sub.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={sub.status} />
                  <span className="text-slate-600 text-xs">{expanded === sub.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === sub.id && (
                <div className="mt-4 pt-4 border-t border-dark-500 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Submitted Code:</p>
                    <pre className="text-xs font-mono bg-dark-900 rounded-lg p-3 text-slate-300 overflow-auto max-h-48">{sub.code}</pre>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Output:</p>
                    <pre className={`text-xs font-mono bg-dark-900 rounded-lg p-3 overflow-auto ${sub.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sub.output || '(empty)'}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
