import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

function useCountdown(seconds, onExpire) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const expired = useRef(false)
  useEffect(() => {
    if (!seconds) return
    setTimeLeft(seconds)
    expired.current = false
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          if (!expired.current) { expired.current = true; onExpire() }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds])
  return timeLeft
}

function fmt(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function parseTestCases(raw) {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return [{ input: '', output: raw.trim() }]
}

export default function QuestionDetail() {
  const { id } = useParams()
  const [question, setQuestion] = useState(null)
  const [code, setCode] = useState('')
  const [fetching, setFetching] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)

  // per-case run state: { [index]: { loading, result } }
  const [caseResults, setCaseResults] = useState({})
  const [activeCase, setActiveCase] = useState(0)

  useEffect(() => {
    api.get(`/questions/${id}`).then(r => {
      setQuestion(r.data)
      setCode(r.data.starterCode || `// Write your JavaScript solution here\n\n`)
    }).finally(() => setFetching(false))
  }, [id])

  const testCases = question ? parseTestCases(question.expectedOutput) : []

  const handleAutoSubmit = useCallback(() => {
    if (submitted) return
    doSubmit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, code])

  const timeLeft = useCountdown(question?.timeLimit || 0, handleAutoSubmit)
  const timerColor = timeLeft <= 30 ? 'text-red-400 animate-pulse' : timeLeft <= 60 ? 'text-yellow-400' : 'text-slate-300'

  // Run a single test case
  const handleRunCase = async (index) => {
    setCaseResults(prev => ({ ...prev, [index]: { loading: true, result: null } }))
    try {
      const tc = testCases[index]
      // build a single-case expected JSON so backend evaluates only this case
      const singleExpected = JSON.stringify([{ input: tc.input, output: tc.output }])
      const { data } = await api.post('/submissions/run', {
        code,
        questionId: id,
        overrideExpected: singleExpected
      })
      setCaseResults(prev => ({ ...prev, [index]: { loading: false, result: data } }))
    } catch (e) {
      setCaseResults(prev => ({
        ...prev,
        [index]: { loading: false, result: { status: 'FAIL', results: [{ actual: e.response?.data?.error || 'Error', expected: testCases[index].output, input: testCases[index].input, pass: false }] } }
      }))
    }
  }

  // Final submit all
  const doSubmit = async () => {
    if (submitted) return
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const { data } = await api.post('/submissions', { code, questionId: id })
      setSubmitResult(data)
      setSubmitted(true)
    } catch (e) {
      setSubmitResult({ status: 'FAIL', output: e.response?.data?.error || 'Execution error', saved: false, results: [] })
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) return <div className="text-center py-16 text-slate-500">Loading...</div>
  if (!question) return <div className="text-center py-16 text-red-400">Question not found.</div>

  const cr = caseResults[activeCase]

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-4">

      {/* Timer */}
      {question.timeLimit > 0 && (
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Time Remaining</span>
          <div className={`font-mono text-xl font-bold tabular-nums ${timerColor}`}>{fmt(timeLeft)}</div>
          {submitted && <span className="text-xs text-emerald-500 font-mono">● submitted</span>}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── LEFT: problem description ── */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Badge label={question.difficulty} />
              {question.timeLimit > 0 && (
                <span className="text-xs font-mono text-slate-500 bg-dark-700 border border-dark-400 px-2 py-0.5 rounded-md">
                  ⏱ {Math.floor(question.timeLimit / 60)}m{question.timeLimit % 60 > 0 ? ` ${question.timeLimit % 60}s` : ''}
                </span>
              )}
            </div>
            <h1 className="text-xl font-display font-bold text-white mb-3">{question.title}</h1>
            <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{question.description}</p>
            <div className="mt-4 pt-4 border-t border-dark-500">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Created by</p>
              <p className="text-sm text-slate-300">{question.createdBy?.name}</p>
            </div>
          </Card>

          {/* ── Test cases panel ── */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-display font-semibold text-slate-200">Test Cases</p>
              <span className="text-xs text-slate-500 font-mono">{testCases.length} case{testCases.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Case tabs */}
            <div className="flex gap-2 flex-wrap">
              {testCases.map((_, i) => {
                const r = caseResults[i]
                const hasResult = r && !r.loading && r.result
                const casePassed = hasResult && r.result.status === 'PASS'
                return (
                  <button key={i} onClick={() => setActiveCase(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all flex items-center gap-1.5 ${
                      activeCase === i
                        ? 'bg-dark-600 border-brand-500 text-slate-200'
                        : 'bg-dark-700 border-dark-500 text-slate-500 hover:border-dark-400'
                    }`}>
                    {hasResult && (
                      <span className={casePassed ? 'text-emerald-400' : 'text-red-400'}>
                        {casePassed ? '✓' : '✗'}
                      </span>
                    )}
                    Case {i + 1}
                  </button>
                )
              })}
            </div>

            {/* Active case detail */}
            {testCases[activeCase] && (
              <div className="bg-dark-900 rounded-xl border border-dark-500 overflow-hidden">
                {/* Input */}
                {testCases[activeCase].input !== undefined && testCases[activeCase].input !== '' && (
                  <div className="px-4 py-3 border-b border-dark-600">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Input</p>
                    <pre className="text-sm font-mono text-slate-300">{testCases[activeCase].input}</pre>
                  </div>
                )}
                {/* Expected output */}
                <div className="px-4 py-3 border-b border-dark-600">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Expected Output</p>
                  <pre className="text-sm font-mono text-emerald-400">{testCases[activeCase].output}</pre>
                </div>

                {/* Run result for this case */}
                {cr && (
                  <div className="px-4 py-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Your Output</p>
                    {cr.loading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                        Running...
                      </div>
                    ) : cr.result?.results?.[0] ? (
                      <pre className={`text-sm font-mono ${cr.result.results[0].pass ? 'text-emerald-400' : 'text-red-400'}`}>
                        {cr.result.results[0].actual || '(empty)'}
                      </pre>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Run this case button */}
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => handleRunCase(activeCase)}
              loading={cr?.loading}
              disabled={!code.trim() || submitted}>
              ▷ Run Case {activeCase + 1}
            </Button>
          </Card>

          {/* Submit result summary */}
          {submitResult && (
            <Card className={`border ${submitResult.status === 'PASS' ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-red-700/50 bg-red-900/10'}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-2xl ${submitResult.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {submitResult.status === 'PASS' ? '✓' : '✗'}
                </span>
                <div>
                  <Badge label={submitResult.status} />
                  <p className={`text-sm font-medium mt-1 ${submitResult.status === 'PASS' ? 'text-emerald-300' : 'text-red-300'}`}>
                    {submitResult.status === 'PASS' ? 'All tests passed! Submission saved.' : 'Some tests failed.'}
                  </p>
                </div>
              </div>
              {submitResult.results?.length > 0 && (
                <div className="space-y-2">
                  {submitResult.results.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between text-xs font-mono px-3 py-2 rounded-lg border ${r.pass ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-400' : 'border-red-800/40 bg-red-950/20 text-red-400'}`}>
                      <span>{r.pass ? '✓' : '✗'} Case {i + 1}{r.input ? ` · in: ${r.input}` : ''}</span>
                      <span>got: {r.actual || '(empty)'} · want: {r.expected}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ── RIGHT: code editor ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-500 font-mono ml-2">solution.js</span>
            </div>
            <span className="text-xs text-slate-600 font-mono">JavaScript</span>
          </div>

          <textarea
            className="code-editor min-h-[460px]"
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            placeholder="// Write your solution here..."
            disabled={submitted}
          />

          <Button
            className="w-full justify-center py-3"
            onClick={doSubmit}
            loading={submitting}
            disabled={!code.trim() || submitted}>
            {submitted ? '✓ Submitted' : '↑ Submit All Cases'}
          </Button>

          {submitted && (
            <p className="text-center text-xs text-slate-500">Submission saved. Refresh to try again.</p>
          )}
        </div>
      </div>
    </div>
  )
}
