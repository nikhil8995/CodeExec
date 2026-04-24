import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

function parseSubmissionOutput(submission) {
  let parsed
  try {
    parsed = JSON.parse(submission.output)
  } catch {
    parsed = null
  }

  if (!parsed || !Array.isArray(parsed.cases)) {
    return {
      summary: submission.output || '(empty)',
      code: submission.code,
      cases: []
    }
  }

  const cases = parsed.cases.map((testCase, index) => ({
    case: testCase.case || index + 1,
    input: testCase.input ?? '',
    expected: testCase.expected ?? '',
    actual: testCase.actual ?? '',
    pass: Boolean(testCase.pass),
    code: testCase.code || submission.code
  }))

  return {
    summary: parsed.summary || '',
    code: cases[0]?.code || submission.code,
    cases
  }
}

export default function Submissions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    api.get('/submissions/mine').then(r => setSubmissions(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const submissionId = Number(searchParams.get('submissionId'))
    if (submissions.length === 0) {
      setSelectedId(null)
      return
    }

    if (submissionId) {
      const exists = submissions.some((sub) => sub.id === submissionId)
      if (exists) {
        setSelectedId(submissionId)
        return
      }
    }

    setSelectedId(submissions[0].id)
  }, [searchParams, submissions])

  const submissionsWithDetails = useMemo(
    () => submissions.map((sub) => ({ ...sub, details: parseSubmissionOutput(sub) })),
    [submissions]
  )

  const selectedSubmission = useMemo(
    () => submissionsWithDetails.find((sub) => sub.id === selectedId) || null,
    [submissionsWithDetails, selectedId]
  )

  const handleSelectSubmission = (id) => {
    setSelectedId(id)
    setSearchParams({ submissionId: String(id) })
  }

  let content
  if (loading) {
    content = <div className="text-center py-16 text-slate-500">Loading...</div>
  } else if (submissions.length === 0) {
    content = (
      <Card className="text-center py-12">
        <p className="text-slate-500">No submissions yet. Solve some problems!</p>
        <Link to="/questions" className="mt-2 text-cyan-300 hover:text-cyan-200 text-sm inline-block">Open problems</Link>
      </Card>
    )
  } else {
    content = (
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-display font-semibold text-slate-200">Submission History</h2>
            <span className="text-xs font-mono text-slate-500">{submissionsWithDetails.length} total</span>
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
            {submissionsWithDetails.map((sub) => {
              const active = sub.id === selectedId
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectSubmission(sub.id)}
                  className={`w-full text-left rounded-xl border px-3 py-3 transition-all ${active ? 'border-cyan-500/40 bg-cyan-900/10' : 'border-dark-500 bg-dark-900/35 hover:border-dark-400 hover:bg-dark-800/55'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-100 truncate">{sub.question?.title || 'Untitled question'}</p>
                    <Badge label={sub.status} />
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-1">{new Date(sub.createdAt).toLocaleString()}</p>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          {selectedSubmission ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80 font-mono">Submission Inspector</p>
                  <h3 className="text-xl font-display font-bold text-white mt-1">{selectedSubmission.question?.title || 'Untitled question'}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">{new Date(selectedSubmission.createdAt).toLocaleString()}</p>
                </div>
                <Badge label={selectedSubmission.status} />
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide">Submitted Code</p>
                <pre className="text-xs font-mono bg-dark-900 rounded-xl p-3 text-slate-300 overflow-auto max-h-56 border border-dark-500">{selectedSubmission.details.code}</pre>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide">Summary Output</p>
                <pre className={`text-xs font-mono bg-dark-900 rounded-xl p-3 overflow-auto border border-dark-500 ${selectedSubmission.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedSubmission.details.summary || '(empty)'}
                </pre>
              </div>

              {selectedSubmission.details.cases.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide">All Case Results</p>
                  {selectedSubmission.details.cases.map((testCase) => (
                    <div
                      key={`${selectedSubmission.id}-${testCase.case}`}
                      className={`rounded-xl border px-3 py-2 text-xs font-mono ${testCase.pass ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-400' : 'border-red-800/40 bg-red-950/20 text-red-400'}`}
                    >
                      <p>{testCase.pass ? 'PASS' : 'FAIL'} Case {testCase.case}{testCase.input ? ` | in: ${testCase.input}` : ''}</p>
                      <p className="mt-1">got: {testCase.actual || '(empty)'}</p>
                      <p className="mt-1">want: {testCase.expected || '(empty)'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Select a submission from the left panel to inspect details.</p>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <Card className="relative overflow-hidden p-6 sm:p-7 border-cyan-500/20 bg-gradient-to-br from-dark-800/80 to-dark-900/70">
        <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-24 -left-8 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl"></div>
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)', backgroundSize: '22px 22px' }}></div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 font-mono">Activity Log</p>
          <h1 className="text-3xl font-display font-bold text-white mt-1.5">Submission Inspector</h1>
          <p className="text-slate-300 text-sm mt-1">Open any submission and review full output on every case.</p>
        </div>
      </Card>

      {content}
    </div>
  )
}
