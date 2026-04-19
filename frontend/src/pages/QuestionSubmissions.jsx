import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../hooks/useApi'
import Badge from '../components/ui/Badge'

function parseOutput(raw) {
  try {
    const parsed = JSON.parse(raw)
    if (parsed.cases) return parsed
  } catch {}
  return null
}

export default function QuestionSubmissions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [subs, setSubs] = useState([])
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
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

  const handleSelect = (sub) => {
    setSelected(sub)
    setActiveTab(0)
  }

  return (
    <div className="flex h-full gap-0 -m-6 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* LEFT PANEL */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-dark-800 border-r border-dark-500 overflow-hidden">
        <div className="px-4 py-4 border-b border-dark-500 flex-shrink-0">
          <button onClick={() => navigate('/my-questions')}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-3 flex items-center gap-1">
            ← Back
          </button>
          <h2 className="font-display font-bold text-white text-sm leading-snug line-clamp-2">
            {question?.title || 'Loading...'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{subs.length} submission{subs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">Loading...</div>
          ) : subs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No submissions yet.</div>
          ) : (
            subs.map(sub => {
              const active = selected?.id === sub.id
              return (
                <button key={sub.id} onClick={() => handleSelect(sub)}
                  className={`w-full text-left px-4 py-3 border-b border-dark-600 transition-all ${active ? 'bg-dark-600 border-l-2 border-l-brand-500' : 'hover:bg-dark-700'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-200 truncate">{sub.user?.name}</span>
                    <Badge label={sub.status} />
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{new Date(sub.createdAt).toLocaleString()}</p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 overflow-y-auto bg-dark-900">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-4 opacity-20">◈</div>
            <p className="text-slate-500 text-sm">Select a submission from the left</p>
          </div>
        ) : (() => {
          const parsed = parseOutput(selected.output)
          const cases = parsed?.cases || null

          return (
            <div className="p-6 max-w-4xl mx-auto space-y-5 animate-fadeIn">

              {/* Student info */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-white">{selected.user?.name}</h3>
                  <p className="text-sm text-slate-500 font-mono">{selected.user?.email}</p>
                  <p className="text-xs text-slate-600 font-mono mt-1">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
                <Badge label={selected.status} />
              </div>

              {/* Per-case view */}
              {cases ? (
                <div className="space-y-4">
                  {/* Case tabs */}
                  <div className="flex gap-2">
                    {cases.map((c, i) => (
                      <button key={i} onClick={() => setActiveTab(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all flex items-center gap-1.5 ${
                          activeTab === i
                            ? 'bg-dark-600 border-brand-500 text-slate-200'
                            : 'bg-dark-800 border-dark-500 text-slate-500 hover:border-dark-400'
                        }`}>
                        <span className={c.pass ? 'text-emerald-400' : 'text-red-400'}>{c.pass ? '✓' : '✗'}</span>
                        Case {c.case}
                      </button>
                    ))}
                  </div>

                  {/* Active case detail */}
                  {cases[activeTab] && (
                    <div className="space-y-4">
                      {/* Result row */}
                      <div className="bg-dark-800 border border-dark-500 rounded-xl overflow-hidden">
                        <div className={`px-4 py-2 border-b border-dark-500 flex items-center justify-between text-xs font-mono ${cases[activeTab].pass ? 'bg-emerald-950/30 text-emerald-400' : 'bg-red-950/30 text-red-400'}`}>
                          <span>{cases[activeTab].pass ? '✓ Passed' : '✗ Failed'} — Case {cases[activeTab].case}</span>
                          <Badge label={cases[activeTab].pass ? 'PASS' : 'FAIL'} />
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-dark-500">
                          {cases[activeTab].input !== undefined && cases[activeTab].input !== '' && (
                            <div className="px-4 py-3">
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Input</p>
                              <pre className="text-sm font-mono text-slate-300">{cases[activeTab].input}</pre>
                            </div>
                          )}
                          <div className="px-4 py-3">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Expected</p>
                            <pre className="text-sm font-mono text-emerald-400">{cases[activeTab].expected}</pre>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Got</p>
                            <pre className={`text-sm font-mono ${cases[activeTab].pass ? 'text-emerald-400' : 'text-red-400'}`}>
                              {cases[activeTab].actual || '(empty)'}
                            </pre>
                          </div>
                        </div>
                      </div>

                      {/* Code for this case */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">
                          Code submitted for Case {cases[activeTab].case}
                        </p>
                        <div className="rounded-xl border border-dark-500 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2 bg-dark-700 border-b border-dark-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-xs text-slate-500 font-mono ml-2">case_{cases[activeTab].case}_solution.js</span>
                          </div>
                          <pre className="text-xs font-mono p-4 bg-dark-900 text-slate-300 overflow-auto whitespace-pre" style={{ maxHeight: '50vh' }}>
                            {cases[activeTab].code}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback: old-style submission without per-case data */
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Output</p>
                    <pre className={`text-sm font-mono rounded-xl p-4 border overflow-auto max-h-36 ${selected.status === 'PASS' ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-red-950/30 border-red-800/40 text-red-300'}`}>
                      {selected.output || '(empty)'}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Submitted Code</p>
                    <div className="rounded-xl border border-dark-500 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2 bg-dark-700 border-b border-dark-500">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-xs text-slate-500 font-mono ml-2">solution.js</span>
                      </div>
                      <pre className="text-xs font-mono p-4 bg-dark-900 text-slate-300 overflow-auto whitespace-pre" style={{ maxHeight: '60vh' }}>
                        {selected.code}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
