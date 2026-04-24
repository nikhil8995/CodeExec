import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Button from '../components/ui/Button'
import { handleTextareaCodeEditorKeyDown } from '../utils/codeEditorKeys'

const EXAMPLE_MULTI = `[
  { "input": "2 3", "output": "5" },
  { "input": "4 6", "output": "10" }
]`

export default function CreateQuestion() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', starterCode: '',
    expectedOutput: '', difficulty: 'MEDIUM', timeLimit: 300
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [multiMode, setMultiMode] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.expectedOutput) {
      setError('Title, description, and expected output are required.')
      return
    }
    // validate JSON if multi mode
    if (multiMode) {
      try { JSON.parse(form.expectedOutput) } catch {
        setError('Expected output must be valid JSON array in multi-test mode.')
        return
      }
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/questions', form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create question')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const updateStarterCode = (nextValue) => {
    setForm((prev) => ({ ...prev, starterCode: nextValue }))
  }

  const updateExpectedOutput = (nextValue) => {
    setForm((prev) => ({ ...prev, expectedOutput: nextValue }))
  }

  const handleStarterCodeKeyDown = (event) => {
    handleTextareaCodeEditorKeyDown(event, updateStarterCode)
  }

  const handleExpectedOutputKeyDown = (event) => {
    handleTextareaCodeEditorKeyDown(event, updateExpectedOutput)
  }

  const toggleMulti = () => {
    setMultiMode(m => {
      if (!m) setForm(f => ({ ...f, expectedOutput: EXAMPLE_MULTI }))
      else setForm(f => ({ ...f, expectedOutput: '' }))
      return !m
    })
  }

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn space-y-6">
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl"></div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-300/80 font-mono">Teacher Studio</p>
          <h1 className="text-3xl font-display font-bold text-white mt-1.5">Create Question</h1>
          <p className="text-slate-400 text-sm mt-1">Design a coding challenge for students with test cases and time limits.</p>
        </div>
      </Card>

      <Card>
        {error && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-300 text-sm mb-5">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Title" placeholder="e.g. Sum of Two Numbers" value={form.title} onChange={set('title')} required />
          <Textarea label="Description" placeholder="Describe the problem clearly. Include examples." value={form.description} onChange={set('description')} rows={4} required />

          {/* Starter code */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Starter Code <span className="text-slate-600">(optional)</span></label>
            <textarea
              className="code-editor min-h-[120px]"
              placeholder={"// e.g.\nfunction solution(a, b) {\n  // your code\n}"}
              value={form.starterCode}
              onChange={set('starterCode')}
              onKeyDown={handleStarterCodeKeyDown}
              spellCheck={false}
            />
          </div>

          {/* Expected output – FEATURE 3 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-300">Expected Output</label>
              <button type="button" onClick={toggleMulti}
                className={`min-h-9 px-3 rounded-lg text-xs font-mono font-medium border transition-all ${multiMode ? 'bg-brand-600/20 border-brand-500 text-brand-300' : 'bg-dark-700 border-dark-500 text-slate-400 hover:border-dark-400 hover:text-slate-300'}`}>
                {multiMode ? '✓ Multi-test JSON' : 'Switch to Multi-test'}
              </button>
            </div>
            <textarea
              className="code-editor min-h-[90px]"
              placeholder={multiMode ? EXAMPLE_MULTI : 'e.g. 42'}
              value={form.expectedOutput}
              onChange={set('expectedOutput')}
              onKeyDown={handleExpectedOutputKeyDown}
              spellCheck={false}
              required
            />
            <p className="text-xs text-slate-600">
              {multiMode
                ? 'JSON array of { input, output } objects. Input is passed as stdin to the code.'
                : 'Exact stdout that correct code should print. Or switch to multi-test mode for multiple cases.'}
            </p>
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Difficulty</label>
            <div className="flex gap-2">
              {['EASY', 'MEDIUM', 'HARD'].map(d => (
                <button key={d} type="button" onClick={() => setForm({ ...form, difficulty: d })}
                  className={`flex-1 min-h-10 px-3 rounded-xl text-sm font-semibold border transition-all ${
                    form.difficulty === d
                      ? d === 'EASY' ? 'bg-emerald-900/30 border-emerald-600 text-emerald-300'
                        : d === 'HARD' ? 'bg-red-900/30 border-red-600 text-red-300'
                        : 'bg-yellow-900/30 border-yellow-600 text-yellow-300'
                      : 'bg-dark-700 border-dark-400 text-slate-500 hover:border-dark-300'
                  }`}>
                  {d.charAt(0) + d.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* FEATURE 4: Time limit */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Time Limit (seconds)</label>
            <div className="flex items-center gap-3">
              <input
                type="number" min="30" max="7200" step="30"
                value={form.timeLimit}
                onChange={e => setForm({ ...form, timeLimit: parseInt(e.target.value) || 300 })}
                className="w-28 min-h-10 px-3 rounded-xl bg-dark-700 border border-dark-400 text-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
              <span className="text-xs text-slate-500">
                = {Math.floor(form.timeLimit / 60)}m {form.timeLimit % 60 > 0 ? `${form.timeLimit % 60}s` : ''} — auto-submits when timer reaches 0
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" size="lg" loading={loading} className="flex-1 justify-center">Create Question</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
