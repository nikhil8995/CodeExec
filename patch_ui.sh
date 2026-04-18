#!/bin/bash
set -e

echo "🚀 Patching UI for better submissions view..."

# =========================
# QuestionSubmissions Page
# =========================
cat > frontend/src/pages/QuestionSubmissions.jsx << 'EOF'
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../hooks/useApi'
import Badge from '../components/ui/Badge'

export default function QuestionSubmissions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [subs, setSubs] = useState([])
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/questions/${id}/submissions`),
      api.get(`/questions/${id}`)
    ]).then(([s, q]) => {
      setSubs(s.data)
      setQuestion(q.data)
    }).finally(() => setLoading(false))
  }, [id])

  return (
    <div className="flex h-full overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* LEFT PANEL */}
      <div className="w-72 flex flex-col bg-dark-800 border-r border-dark-500">
        <div className="p-4 border-b border-dark-500">
          <button onClick={() => navigate('/my-questions')} className="text-xs text-slate-400 mb-2">
            ← Back
          </button>
          <h2 className="text-white text-sm font-bold">{question?.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-slate-500">Loading...</p>
          ) : subs.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelected(sub)}
              className="w-full text-left p-3 border-b border-dark-600 hover:bg-dark-700"
            >
              <div className="flex justify-between">
                <span>{sub.user?.name}</span>
                <Badge label={sub.status} />
              </div>
              <p className="text-xs text-slate-500">
                {new Date(sub.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-6 overflow-y-auto bg-dark-900">
        {!selected ? (
          <p className="text-slate-500">Select a submission</p>
        ) : (
          <>
            <h2 className="text-white text-lg font-bold">{selected.user?.name}</h2>
            <p className="text-slate-400 text-sm">{selected.user?.email}</p>

            <div className="mt-4">
              <h3 className="text-xs text-slate-500 mb-1">Output</h3>
              <pre className="bg-black p-3 rounded text-green-400">
                {selected.output}
              </pre>
            </div>

            <div className="mt-4">
              <h3 className="text-xs text-slate-500 mb-1">Code</h3>
              <pre className="bg-black p-3 rounded text-white overflow-auto max-h-[60vh]">
                {selected.code}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
EOF

# =========================
# MyQuestions update
# =========================
cat > frontend/src/pages/MyQuestions.jsx << 'EOF'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/useApi'
import Button from '../components/ui/Button'

export default function MyQuestions() {
  const [questions, setQuestions] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/questions/mine').then(r => setQuestions(r.data))
  }, [])

  return (
    <div>
      <h1 className="text-xl text-white mb-4">My Questions</h1>

      {questions.map(q => (
        <div key={q.id} className="mb-3 p-3 border border-dark-600 rounded">
          <h2 className="text-white">{q.title}</h2>

          <Button onClick={() => navigate(`/questions/${q.id}/submissions`)}>
            View Submissions
          </Button>
        </div>
      ))}
    </div>
  )
}
EOF

# =========================
# Routing update
# =========================
cat > frontend/src/App.jsx << 'EOF'
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import QuestionSubmissions from './pages/QuestionSubmissions'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/questions/:id/submissions" element={<QuestionSubmissions />} />
      </Routes>
    </BrowserRouter>
  )
}
EOF

echo "✅ UI patch applied successfully!"
