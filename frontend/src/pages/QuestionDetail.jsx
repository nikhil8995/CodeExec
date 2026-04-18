import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

// ── Timer hook ────────────────────────────────────────────────────
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

// ── Result panel ──────────────────────────────────────────────────
function ResultPanel({ result }) {
  if (!result) return null
  const pass = result.status === 'PASS'
  return (
    <Card className={`border ${pass ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-red-700/50 bg-red-900/10'} animate-fadeIn`}>
      <div className="flex items-center gap-3 mb-3">
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

      {/* Multi test case breakdown */}
      {result.isMulti && result.results?.length > 0 && (
        <div className="space-y-2 mb-3">
          {result.results.map((r, i) => (
            <div key={i} className={`rounded-lg px-3 py-2 border text-xs font-mono ${r.pass ? 'border-emerald-800/50 bg-emerald-950/30' : 'border-red-800/50 bg-red-950/30'}`}>
              <span className={r.pass ? 'text-emerald-400' : 'text-red-400'}>{r.pass ? '✓' : '✗'} </span>
              <span className="text-slate-500">Case {i + 1}</span>
              {r.input && <> · <span className="text-slate-400">in: <span className="text-slate-300">{r.input}</span></span></>}
              <> · <span className="text-slate-400">got: <span className="text-slate-300">{r.actual}</span></span></>
              {!r.pass && <> · <span className="text-slate-400">want: <span className="text-emerald-400">{r.expected}</span></span></>}
            </div>
          ))}
        </div>
      )}

      {/* Single output */}
      {!result.isMulti && (
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

// ── Main component ────────────────────────────────────────────────
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

  // FEATURE 4: auto-submit on timer expire
  const handleAutoSubmit = useCallback(() => {
    if (submitted) return
    doSubmit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, code])

  const timeLeft = useCountdown(question?.timeLimit || 0, handleAutoSubmit)

  // FEATURE 1: run only
  const handleRun = async () => {
    setRunning(true)
    setResult(null)
    try {
      const { data } = await api.post('/submissions/run', { code, questionId: id })
      setResult(data)
    } catch (e) {
      setResult({ status: 'FAIL', output: e.response?.data?.error || 'Execution error', saved: false })
    } finally {
      setRunning(false)
    }
  }

  // FEATURE 1: submit and save
  const doSubmit = async () => {
    if (submitted) return
    setSubmitting(true)
    setResult(null)
    try {
      const { data } = await api.post('/submissions', { code, questionId: id })
      setResult(data)
      setSubmitted(true)
    } catch (e) {
      setResult({ status: 'FAIL', output: e.response?.data?.error || 'Execution error', saved: false })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = () => doSubmit()

  // Timer colour
  const timerColor = timeLeft <= 30 ? 'text-red-400 animate-pulse' : timeLeft <= 60 ? 'text-yellow-400' : 'text-slate-400'

  if (fetching) return <div className="text-center py-16 text-slate-500">Loading...</div>
  if (!question) return <div className="text-center py-16 text-red-400">Question not found.</div>

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      {/* FEATURE 4: Timer bar */}
      {question.timeLimit > 0 && (
        <div className="flex items-center justify-end mb-4 gap-3">
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Time Remaining</span>
          <div className={`font-mono text-xl font-bold tabular-nums ${timerColor}`}>
            {fmt(timeLeft)}
          </div>
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

        {/* Right panel – editor */}
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

          {/* FEATURE 1: two buttons */}
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
              onClick={handleSubmit}
              loading={submitting}
              disabled={!code.trim() || running || submitted}>
              {submitted ? '✓ Submitted' : '↑ Submit'}
            </Button>
          </div>

          {submitted && (
            <p className="text-center text-xs text-slate-500">
              Submission locked. Refresh to start over.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
