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

function ResultPanel({ result }) {
  if (!result) return null
  const pass = result.status === 'PASS'

  return (
    <Card className={`border ${pass ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-red-700/50 bg-red-900/10'} animate-fadeIn`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-2xl ${pass ? 'text-emerald-400' : 'text-red-400'}`}>{pass ? '✓' : '✗'}</span>
        <div>
          <Badge label={result.status} />
          <p className={`text-sm font-medium mt-1 ${pass ? 'text-emerald-300' : 'text-red-300'}`}>
            {pass ? 'All tests passed!' : 'Some tests failed.'}
            {result.saved === false && <span className="text-slate-500 text-xs ml-2">(not saved)</span>}
            {result.saved === true && <span className="text-emerald-600 text-xs ml-2">✓ saved</span>}
          </p>
        </div>
      </div>

      {/* Test case breakdown — always shown */}
      {result.results && result.results.length > 0 && (
        <div className="space-y-3">
          {result.results.map((r, i) => (
            <div key={i} className={`rounded-xl border overflow-hidden ${r.pass ? 'border-emerald-800/40' : 'border-red-800/40'}`}>
              {/* Case header */}
              <div className={`flex items-center justify-between px-3 py-2 text-xs font-mono ${r.pass ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'}`}>
                <span>{r.pass ? '✓' : '✗'} Case {i + 1}</span>
                <Badge label={r.pass ? 'PASS' : 'FAIL'} />
              </div>

              {/* Case details */}
              <div className="bg-dark-900 px-3 py-3 space-y-2">
                {r.input !== undefined && r.input !== '' && (
                  <div className="flex gap-3 text-xs font-mono">
                    <span className="text-slate-500 w-16 flex-shrink-0">Input</span>
                    <span className="text-slate-300">{r.input}</span>
                  </div>
                )}
                <div className="flex gap-3 text-xs font-mono">
                  <span className="text-slate-500 w-16 flex-shrink-0">Expected</span>
                  <span className="text-emerald-400">{r.expected}</span>
                </div>
                <div className="flex gap-3 text-xs font-mono">
                  <span className="text-slate-500 w-16 flex-shrink-0">Got</span>
                  <span className={r.pass ? 'text-emerald-400' : 'text-red-400'}>{r.actual || '(empty)'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single (non-multi) fallback */}
      {(!result.results || result.results.length === 0) && (
        <div className="space-y-2">
          <div>
            <p className="text-xs text-slate-500 mb-1">Your Output:</p>
            <pre className="text-xs font-mono bg-dark-900 rounded-lg p-3 text-slate-300 overflow-auto">{result.output || '(empty)'}</pre>
          </div>
          {!pass && result.expectedOutput && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Expected:</p>
              <pre className="text-xs font-mono bg-dark-900 rounded-lg p-3 text-emerald-400 overflow-auto">{result.expectedOutput}</pre>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function QuestionDetail() {
  const { id } = useParams()
  const [question, setQuestion] = useState(null)
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    api.get(`/questions/${id}`).then(r => {
      setQuestion(r.data)
      setCode(r.data.starterCode || `// Write your JavaScript solution here\n\n`)
    }).finally(() => setFetching(false))
  }, [id])

  const handleAutoSubmit = useCallback(() => {
    if (submitted) return
    doSubmit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, code])

  const timeLeft = useCountdown(question?.timeLimit || 0, handleAutoSubmit)
  const timerColor = timeLeft <= 30 ? 'text-red-400 animate-pulse' : timeLeft <= 60 ? 'text-yellow-400' : 'text-slate-400'

  const handleRun = async () => {
    setRunning(true)
    setResult(null)
    try {
      const { data } = await api.post('/submissions/run', { code, questionId: id })
      setResult(data)
    } catch (e) {
      setResult({ status: 'FAIL', output: e.response?.data?.error || 'Execution error', saved: false, results: [] })
    } finally {
      setRunning(false)
    }
  }

  const doSubmit = async () => {
    if (submitted) return
    setSubmitting(true)
    setResult(null)
    try {
      const { data } = await api.post('/submissions', { code, questionId: id })
      setResult(data)
      setSubmitted(true)
    } catch (e) {
      setResult({ status: 'FAIL', output: e.response?.data?.error || 'Execution error', saved: false, results: [] })
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) return <div className="text-center py-16 text-slate-500">Loading...</div>
  if (!question) return <div className="text-center py-16 text-red-400">Question not found.</div>

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      {/* Timer */}
      {question.timeLimit > 0 && (
        <div className="flex items-center justify-end mb-4 gap-3">
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Time Remaining</span>
          <div className={`font-mono text-xl font-bold tabular-nums ${timerColor}`}>{fmt(timeLeft)}</div>
          {submitted && <span className="text-xs text-emerald-500 font-mono">● submitted</span>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3 mb-3">
              <Badge label={question.difficulty} />
              {question.timeLimit > 0 && (
                <span className="text-xs font-mono text-slate-500 bg-dark-700 border border-dark-400 px-2 py-0.5 rounded-md">
                  ⏱ {Math.floor(question.timeLimit / 60)}m {question.timeLimit % 60 > 0 ? `${question.timeLimit % 60}s` : ''}
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

          <ResultPanel result={result} />
        </div>

        {/* Right panel */}
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
            className="code-editor min-h-[380px]"
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            placeholder="// Write your solution here..."
            disabled={submitted}
          />

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 justify-center"
              onClick={handleRun}
              loading={running}
              disabled={!code.trim() || submitting || submitted}>
              ▷ Run Code
            </Button>
            <Button
              className="flex-1 justify-center"
              onClick={doSubmit}
              loading={submitting}
              disabled={!code.trim() || running || submitted}>
              {submitted ? '✓ Submitted' : '↑ Submit'}
            </Button>
          </div>

          {submitted && (
            <p className="text-center text-xs text-slate-500">Submission locked. Refresh to start over.</p>
          )}
        </div>
      </div>
    </div>
  )
}
