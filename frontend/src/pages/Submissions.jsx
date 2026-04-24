import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/submissions/mine').then(r => setSubmissions(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const submissionId = Number(searchParams.get('submissionId'))
    if (!submissionId || submissions.length === 0) return
    const exists = submissions.some((sub) => sub.id === submissionId)
    if (exists) setExpanded(submissionId)
  }, [searchParams, submissions])

  const submissionsWithDetails = useMemo(
    () => submissions.map((sub) => ({ ...sub, details: parseSubmissionOutput(sub) })),
    [submissions]
  )

  let content
  if (loading) {
    content = <div className="text-center py-16 text-slate-500">Loading...</div>
  } else if (submissions.length === 0) {
    content = (
      <Card className="text-center py-12">
        <p className="text-slate-500">No submissions yet. Solve some problems!</p>
      </Card>
    )
  } else {
    content = (
      <div className="space-y-3 stagger-fade">
        {submissionsWithDetails.map(sub => (
          <Card key={sub.id} className={`cursor-pointer transition-all ${expanded === sub.id ? 'border-dark-400' : ''}`}
            onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100 truncate">{sub.question?.title}</p>
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
                  <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide">Submitted Code</p>
                  <pre className="text-xs font-mono bg-dark-900 rounded-xl p-3 text-slate-300 overflow-auto max-h-48 border border-dark-500">{sub.details.code}</pre>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide">Summary Output</p>
                  <pre className={`text-xs font-mono bg-dark-900 rounded-xl p-3 overflow-auto border border-dark-500 ${sub.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sub.details.summary || '(empty)'}
                  </pre>
                </div>

                {sub.details.cases.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide">All Case Results</p>
                    {sub.details.cases.map((testCase) => (
                      <div
                        key={`${sub.id}-${testCase.case}`}
                        className={`rounded-xl border px-3 py-2 text-xs font-mono ${testCase.pass ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-400' : 'border-red-800/40 bg-red-950/20 text-red-400'}`}
                      >
                        <p>{testCase.pass ? '✓' : '✗'} Case {testCase.case}{testCase.input ? ` · in: ${testCase.input}` : ''}</p>
                        <p className="mt-1">got: {testCase.actual || '(empty)'} · want: {testCase.expected || '(empty)'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 font-mono">Activity Log</p>
          <h1 className="text-3xl font-display font-bold text-white mt-1.5">My Submissions</h1>
          <p className="text-slate-400 text-sm mt-1">{submissions.length} submissions total</p>
        </div>
      </Card>

      {content}
    </div>
  )
}
