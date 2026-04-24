import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { handleTextareaCodeEditorKeyDown } from '../utils/codeEditorKeys'

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

function SubmitPreviewModal({ testCases, caseResults, code, onConfirm, onCancel, submitting }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-dark-800 border border-dark-400 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-fadeIn">
        <div className="p-5 border-b border-dark-500">
          <h2 className="font-display font-bold text-white text-lg">Review Before Submitting</h2>
          <p className="text-slate-500 text-sm mt-1">This is what will be saved. You cannot change it after.</p>
        </div>
        <div className="p-5 space-y-4">
          {testCases.map((tc, i) => {
            const r = caseResults[i]
            const pass = r?.pass ?? false
            const codeSnap = r?.codeSnapshot ?? code
            const actual = r?.actual ?? '(not run)'
            return (
              <div key={i} className={`rounded-xl border overflow-hidden ${pass ? 'border-emerald-700/40' : 'border-red-700/40'}`}>
                <div className={`flex items-center justify-between px-4 py-2 text-xs font-mono ${pass ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'}`}>
                  <span>{pass ? '✓' : '✗'} Case {i + 1}{tc.input ? ` — input: ${tc.input}` : ''}</span>
                  <Badge label={pass ? 'PASS' : 'FAIL'} />
                </div>
                <div className="bg-dark-900 px-4 py-3 space-y-3">
                  <div className="flex gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500">Expected </span>
                      <span className="text-emerald-400">{tc.output}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Got </span>
                      <span className={pass ? 'text-emerald-400' : 'text-red-400'}>{actual}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Code submitted for this case:</p>
                    <pre className="text-xs font-mono text-slate-300 bg-dark-800 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre">{codeSnap}</pre>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="p-5 border-t border-dark-500 flex gap-3">
          <Button variant="secondary" className="flex-1 justify-center" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button className="flex-1 justify-center" onClick={onConfirm} loading={submitting}>
            Confirm Submit
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function QuestionDetail() {
  const { id } = useParams()
  const [question, setQuestion] = useState(null)
  const [code, setCode] = useState('')
  const [fetching, setFetching] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [activeCase, setActiveCase] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [timeExpired, setTimeExpired] = useState(false)

  // caseResults[i] = { pass, actual, codeSnapshot, ran }
  // Once pass=true it never goes back to false (locked)
  const [caseResults, setCaseResults] = useState({})

  const handleCodeEditorKeyDown = useCallback((event) => {
    if (event.target.readOnly) return
    handleTextareaCodeEditorKeyDown(event, setCode)
  }, [])

  useEffect(() => {
    api.get(`/questions/${id}`).then(r => {
      setQuestion(r.data)
      setCode(r.data.starterCode || `// Write your JavaScript solution here\n\n`)
    }).finally(() => setFetching(false))
  }, [id])

  const testCases = question ? parseTestCases(question.expectedOutput) : []

  const handleTimerExpire = useCallback(() => {
    setTimeExpired(true)
  }, [])

  const timeLeft = useCountdown(question?.timeLimit || 0, handleTimerExpire)
  const timerColor = timeLeft <= 30 ? 'text-red-400 animate-pulse' : timeLeft <= 60 ? 'text-yellow-400' : 'text-slate-300'

  const handleRunCase = async (index) => {
    // If already passed, don't re-run — locked
    if (caseResults[index]?.pass) return

    setCaseResults(prev => ({ ...prev, [index]: { ...prev[index], loading: true } }))
    try {
      const tc = testCases[index]
      const singleExpected = JSON.stringify([{ input: tc.input, output: tc.output }])
      const { data } = await api.post('/submissions/run', {
        code,
        questionId: id,
        overrideExpected: singleExpected
      })
      const pass = data.status === 'PASS'
      const actual = data.results?.[0]?.actual ?? data.output
      setCaseResults(prev => ({
        ...prev,
        [index]: {
          loading: false,
          pass,           // once true, stays true forever
          actual,
          codeSnapshot: code,  // save the code used for this case
          ran: true
        }
      }))
    } catch (e) {
      setCaseResults(prev => ({
        ...prev,
        [index]: {
          loading: false,
          pass: false,
          actual: e.response?.data?.error || 'Error',
          codeSnapshot: code,
          ran: true
        }
      }))
    }
  }

  const allCasesRan = testCases.length > 0 && testCases.every((_, i) => caseResults[i]?.ran)

  const doSubmit = async () => {
    if (submitted) return
    setSubmitting(true)
    setShowPreview(false)
    try {
      const results = testCases.map((tc, i) => {
        const r = caseResults[i]
        return {
          input: tc.input,
          expected: tc.output,
          actual: r?.actual ?? '',
          pass: r?.pass ?? false,
          codeSnapshot: r?.codeSnapshot ?? code
        }
      })
      const allPass = results.every(r => r.pass)
      const { data } = await api.post('/submissions/save', {
        code,
        questionId: id,
        status: allPass ? 'PASS' : 'FAIL',
        output: results[results.length - 1]?.actual ?? '',
        results
      })
      setSubmitResult({ ...data, results })
      setSubmitted(true)
    } catch (e) {
      setSubmitResult({ status: 'FAIL', output: e.response?.data?.error || 'Error', results: [] })
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) return <div className="text-center py-16 text-slate-500">Loading...</div>
  if (!question) return <div className="text-center py-16 text-red-400">Question not found.</div>

  const cr = caseResults[activeCase]
  const editorLocked = submitted || timeExpired

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-4">

      {showPreview && (
        <SubmitPreviewModal
          testCases={testCases}
          caseResults={caseResults}
          code={code}
          onConfirm={doSubmit}
          onCancel={() => setShowPreview(false)}
          submitting={submitting}
        />
      )}

      {/* Timer */}
      {question.timeLimit > 0 && (
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Time Remaining</span>
          <div className={`font-mono text-xl font-bold tabular-nums ${timerColor}`}>
            {timeExpired ? '00:00' : fmt(timeLeft)}
          </div>
          {timeExpired && !submitted && (
            <span className="text-xs text-red-400 font-mono animate-pulse">● time up — submit now</span>
          )}
          {submitted && <span className="text-xs text-emerald-500 font-mono">● submitted</span>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Badge label={question.difficulty} />
              {question.timeLimit > 0 && (
                <span className="inline-flex items-center min-h-7 text-xs font-mono text-slate-500 bg-dark-700 border border-dark-400 px-2.5 rounded-lg">
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

          {/* Test Cases */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-display font-semibold text-slate-200">Test Cases</p>
              <span className="text-xs text-slate-500 font-mono">{testCases.length} case{testCases.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              {testCases.map((_, i) => {
                const r = caseResults[i]
                const ran = r?.ran
                const pass = r?.pass
                return (
                  <button key={i} onClick={() => setActiveCase(i)}
                    className={`min-h-9 px-3.5 rounded-xl text-xs font-mono font-semibold border transition-all flex items-center gap-1.5 ${
                      activeCase === i
                        ? 'bg-dark-600 border-brand-500 text-slate-200'
                        : 'bg-dark-700 border-dark-500 text-slate-400 hover:border-dark-400 hover:text-slate-300'
                    }`}>
                    {ran && <span className={pass ? 'text-emerald-400' : 'text-red-400'}>{pass ? '✓' : '✗'}</span>}
                    Case {i + 1}
                    {ran && pass && <span className="text-emerald-600 text-xs">🔒</span>}
                  </button>
                )
              })}
            </div>

            {/* Active case */}
            {testCases[activeCase] && (
              <div className="bg-dark-900 rounded-xl border border-dark-500 overflow-hidden">
                {testCases[activeCase].input !== '' && testCases[activeCase].input !== undefined && (
                  <div className="px-4 py-3 border-b border-dark-600">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Input</p>
                    <pre className="text-sm font-mono text-slate-300">{testCases[activeCase].input}</pre>
                  </div>
                )}
                <div className="px-4 py-3 border-b border-dark-600">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Expected Output</p>
                  <pre className="text-sm font-mono text-emerald-400">{testCases[activeCase].output}</pre>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Your Output</p>
                  {cr?.loading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                      Running...
                    </div>
                  ) : cr?.ran ? (
                    <div className="space-y-1">
                      <pre className={`text-sm font-mono ${cr.pass ? 'text-emerald-400' : 'text-red-400'}`}>
                        {cr.actual || '(empty)'}
                      </pre>
                      {cr.pass && (
                        <p className="text-xs text-emerald-600 font-mono">✓ Locked in — this case is saved</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 font-mono">Not run yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Run case button — hidden if already passed */}
            {!caseResults[activeCase]?.pass && (
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={() => handleRunCase(activeCase)}
                loading={cr?.loading}
                disabled={!code.trim() || submitted || timeExpired}>
                ▷ Run Case {activeCase + 1}
              </Button>
            )}
            {caseResults[activeCase]?.pass && (
              <div className="text-center text-xs text-emerald-600 font-mono py-2">
                ✓ Case {activeCase + 1} passed and locked
              </div>
            )}
          </Card>

          {/* Submit result */}
          {submitResult && (
            <Card className={`border ${submitResult.status === 'PASS' ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-red-700/50 bg-red-900/10'}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-2xl ${submitResult.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {submitResult.status === 'PASS' ? '✓' : '✗'}
                </span>
                <div>
                  <Badge label={submitResult.status} />
                  <p className={`text-sm font-medium mt-1 ${submitResult.status === 'PASS' ? 'text-emerald-300' : 'text-red-300'}`}>
                    {submitResult.status === 'PASS' ? 'All cases passed!' : 'Submission saved.'}
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

        {/* RIGHT — editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-500 font-mono ml-2">solution.js</span>
            </div>
            <div className="flex items-center gap-2">
              {timeExpired && !submitted && (
                <span className="text-xs text-red-400 font-mono border border-red-800/50 bg-red-900/20 px-2 py-0.5 rounded">time up</span>
              )}
              <span className="text-xs text-slate-600 font-mono">JavaScript</span>
            </div>
          </div>

          <textarea
            className={`code-editor min-h-[460px] ${editorLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            value={code}
            onChange={e => !editorLocked && setCode(e.target.value)}
            onKeyDown={handleCodeEditorKeyDown}
            spellCheck={false}
            placeholder="// Write your solution here..."
            readOnly={editorLocked}
          />

          {timeExpired && !submitted && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 text-red-300 text-sm text-center">
              ⏱ Time is up. Editor locked. Submit your current work.
            </div>
          )}

          {!submitted && (
            <Button
              size="lg"
              className="w-full justify-center"
              onClick={() => setShowPreview(true)}
              disabled={submitting || !allCasesRan}
              loading={submitting}>
              ↑ Submit All Cases
            </Button>
          )}

          {submitted && (
            <Button size="lg" className="w-full justify-center" disabled>
              ✓ Submitted
            </Button>
          )}

          {!submitted && !allCasesRan && (
            <p className="text-center text-xs text-yellow-500 font-mono">
              Run all cases before submitting
            </p>
          )}
          {submitted && (
            <p className="text-center text-xs text-slate-500">Submission saved. Refresh to try again.</p>
          )}
        </div>
      </div>
    </div>
  )
}
