#!/bin/bash
set -e

# Run from inside the codeexec/ directory
if [ ! -f "backend/package.json" ]; then
  echo "❌ Run this script from inside the codeexec/ directory"
  exit 1
fi

echo "🔧 Patching CodeExec with 4 new features..."

# ─────────────────────────────────────────────────────────────────
# FEATURE 4 PREREQUISITE: Add timeLimit to Prisma schema
# ─────────────────────────────────────────────────────────────────

echo "📐 Updating Prisma schema..."

# Replace the Question model to add timeLimit field
python3 - <<'PYEOF'
import re

path = "backend/prisma/schema.prisma"
with open(path, "r") as f:
    content = f.read()

old = "  difficulty     Difficulty   @default(MEDIUM)\n  createdAt      DateTime     @default(now())"
new = "  difficulty     Difficulty   @default(MEDIUM)\n  timeLimit      Int          @default(300)\n  createdAt      DateTime     @default(now())"

if "timeLimit" in content:
    print("timeLimit already in schema, skipping.")
else:
    content = content.replace(old, new)
    with open(path, "w") as f:
        f.write(content)
    print("Schema updated.")
PYEOF

# ─────────────────────────────────────────────────────────────────
# FEATURE 1: Run Code Only – backend controller
# ─────────────────────────────────────────────────────────────────

echo "✏️  Patching backend/src/controllers/submissions.js..."

cat > backend/src/controllers/submissions.js <<'EOF'
const prisma = require('../utils/prisma');
const { execFile } = require('child_process');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────

const runCode = (code, stdin = '') => new Promise((resolve) => {
  const runner = path.join(__dirname, '../../docker-runner/run.js');
  execFile('node', [runner, code], { timeout: 6000, env: { ...process.env, CE_STDIN: stdin } },
    (err, stdout, stderr) => {
      if (err) resolve({ output: (stderr || err.message || 'Runtime error').trim(), error: true });
      else resolve({ output: stdout.trim(), error: false });
    }
  );
});

/**
 * Parse expectedOutput: either a plain string or JSON test-case array.
 * Returns { isMulti: bool, cases: [{ input, output }] }
 */
const parseExpected = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { isMulti: true, cases: parsed };
    }
  } catch {}
  return { isMulti: false, cases: [{ input: '', output: raw.trim() }] };
};

/**
 * Run all test cases. Returns { status, output, results[] }
 */
const runAllCases = async (code, expectedRaw) => {
  const { isMulti, cases } = parseExpected(expectedRaw);
  const results = [];

  for (const tc of cases) {
    const { output, error } = await runCode(code, tc.input || '');
    const pass = !error && output === tc.output.trim();
    results.push({ input: tc.input, expected: tc.output, actual: output, pass });
  }

  const allPass = results.every(r => r.pass);
  // User-facing output: show last result or failure detail
  const failing = results.find(r => !r.pass);
  const displayOutput = failing ? failing.actual : results[results.length - 1]?.actual;

  return {
    status: allPass ? 'PASS' : 'FAIL',
    output: displayOutput || '',
    results,
    isMulti,
  };
};

// ── controllers ──────────────────────────────────────────────────

/**
 * FEATURE 1 – Run code without saving to DB
 * POST /api/submissions/run
 */
exports.runCodeOnly = async (req, res) => {
  try {
    const { code, questionId } = req.body;
    const question = await prisma.question.findUnique({ where: { id: parseInt(questionId) } });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const { status, output, results, isMulti } = await runAllCases(code, question.expectedOutput);
    res.json({ status, output, results, isMulti, saved: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * FEATURE 1 – Submit and save to DB
 * POST /api/submissions
 */
exports.submit = async (req, res) => {
  try {
    const { code, questionId } = req.body;
    const question = await prisma.question.findUnique({ where: { id: parseInt(questionId) } });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const { status, output, results, isMulti } = await runAllCases(code, question.expectedOutput);

    const sub = await prisma.submission.create({
      data: { code, output, status, userId: req.user.id, questionId: parseInt(questionId) }
    });
    res.json({ ...sub, expectedOutput: question.expectedOutput, results, isMulti, saved: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * GET /api/submissions/mine
 */
exports.getMySubmissions = async (req, res) => {
  try {
    const subs = await prisma.submission.findMany({
      where: { userId: req.user.id },
      include: { question: { select: { title: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(subs);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * GET /api/submissions/question/:questionId  (student's own)
 */
exports.getForQuestion = async (req, res) => {
  try {
    const subs = await prisma.submission.findMany({
      where: { userId: req.user.id, questionId: parseInt(req.params.questionId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(subs);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
EOF

# ─────────────────────────────────────────────────────────────────
# FEATURE 2: Teacher – view all submissions per question
# ─────────────────────────────────────────────────────────────────

echo "✏️  Patching backend/src/controllers/questions.js..."

cat > backend/src/controllers/questions.js <<'EOF'
const prisma = require('../utils/prisma');

exports.create = async (req, res) => {
  try {
    const { title, description, starterCode, expectedOutput, difficulty, timeLimit } = req.body;
    const q = await prisma.question.create({
      data: {
        title, description,
        starterCode: starterCode || '',
        expectedOutput,
        difficulty: difficulty || 'MEDIUM',
        timeLimit: timeLimit ? parseInt(timeLimit) : 300,
        userId: req.user.id
      }
    });
    res.json(q);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(questions);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const q = await prisma.question.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { createdBy: { select: { name: true } } }
    });
    if (!q) return res.status(404).json({ error: 'Not found' });
    res.json(q);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getMyQuestions = async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(questions);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.submission.deleteMany({ where: { questionId: parseInt(req.params.id) } });
    await prisma.question.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * FEATURE 2 – Teacher: get ALL submissions for a question
 * GET /api/questions/:id/submissions
 */
exports.getQuestionSubmissions = async (req, res) => {
  try {
    const subs = await prisma.submission.findMany({
      where: { questionId: parseInt(req.params.id) },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(subs);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
EOF

# ─────────────────────────────────────────────────────────────────
# Update routes
# ─────────────────────────────────────────────────────────────────

echo "✏️  Patching routes..."

cat > backend/src/routes/submissions.js <<'EOF'
const router = require('express').Router();
const ctrl = require('../controllers/submissions');
const auth = require('../middleware/auth');

// FEATURE 1: run without saving
router.post('/run', auth, ctrl.runCodeOnly);

router.post('/', auth, ctrl.submit);
router.get('/mine', auth, ctrl.getMySubmissions);
router.get('/question/:questionId', auth, ctrl.getForQuestion);

module.exports = router;
EOF

cat > backend/src/routes/questions.js <<'EOF'
const router = require('express').Router();
const ctrl = require('../controllers/questions');
const auth = require('../middleware/auth');
const { requireRole } = auth;

router.get('/', auth, ctrl.getAll);
router.get('/mine', auth, ctrl.getMyQuestions);
router.get('/:id', auth, ctrl.getOne);
router.post('/', auth, requireRole('TEACHER'), ctrl.create);
router.delete('/:id', auth, requireRole('TEACHER'), ctrl.remove);

// FEATURE 2: teacher views all submissions for a question
router.get('/:id/submissions', auth, requireRole('TEACHER'), ctrl.getQuestionSubmissions);

module.exports = router;
EOF

# ─────────────────────────────────────────────────────────────────
# Update docker-runner to accept stdin via env
# ─────────────────────────────────────────────────────────────────

echo "✏️  Patching docker-runner/run.js..."

cat > docker-runner/run.js <<'EOF'
// Receives code via argv[2], optional stdin via CE_STDIN env var
const code = process.argv[2] || '';
const stdinData = process.env.CE_STDIN || '';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpFile = path.join(os.tmpdir(), `ce_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);
fs.writeFileSync(tmpFile, code);

try {
  const result = execSync(`node "${tmpFile}"`, {
    timeout: 5000,
    encoding: 'utf8',
    input: stdinData,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  process.stdout.write(result);
  process.exit(0);
} catch (e) {
  process.stderr.write(e.stderr || e.message || 'Runtime error');
  process.exit(1);
} finally {
  try { fs.unlinkSync(tmpFile); } catch {}
}
EOF

# ─────────────────────────────────────────────────────────────────
# FRONTEND – QuestionDetail (Features 1 + 4: Run/Submit + Timer)
# ─────────────────────────────────────────────────────────────────

echo "✏️  Patching frontend/src/pages/QuestionDetail.jsx..."

cat > frontend/src/pages/QuestionDetail.jsx <<'EOF'
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
EOF

# ─────────────────────────────────────────────────────────────────
# FRONTEND – MyQuestions (Feature 2: View Submissions)
# ─────────────────────────────────────────────────────────────────

echo "✏️  Patching frontend/src/pages/MyQuestions.jsx..."

cat > frontend/src/pages/MyQuestions.jsx <<'EOF'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

function SubmissionsModal({ question, onClose }) {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/questions/${question.id}/submissions`)
      .then(r => setSubs(r.data))
      .finally(() => setLoading(false))
  }, [question.id])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-400 rounded-2xl w-full max-w-3xl mb-16 animate-fadeIn" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-500">
          <div>
            <h2 className="font-display font-bold text-white text-lg">{question.title}</h2>
            <p className="text-slate-500 text-sm mt-0.5">All student submissions</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-xl leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading submissions...</div>
          ) : subs.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No submissions yet.</div>
          ) : (
            subs.map(sub => (
              <div key={sub.id} className="bg-dark-700 border border-dark-500 rounded-xl overflow-hidden">
                {/* Student row */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-dark-500">
                  <div>
                    <p className="font-medium text-slate-200 text-sm">{sub.user?.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{sub.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 font-mono">{new Date(sub.createdAt).toLocaleString()}</span>
                    <Badge label={sub.status} />
                  </div>
                </div>

                {/* Output */}
                <div className="px-4 py-3 border-b border-dark-500">
                  <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Output</p>
                  <pre className={`text-xs font-mono bg-dark-900 rounded-lg p-3 overflow-auto max-h-24 ${sub.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sub.output || '(empty)'}
                  </pre>
                </div>

                {/* Full code – always visible, never truncated */}
                <div className="px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Submitted Code</p>
                  <pre className="text-xs font-mono bg-dark-900 rounded-lg p-3 overflow-auto text-slate-300 max-h-72 whitespace-pre">
                    {sub.code}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function MyQuestions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null) // question being viewed

  useEffect(() => {
    api.get('/questions/mine').then(r => setQuestions(r.data)).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this question? All submissions will be removed.')) return
    await api.delete(`/questions/${id}`)
    setQuestions(qs => qs.filter(q => q.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">My Questions</h1>
          <p className="text-slate-500 text-sm mt-1">{questions.length} questions created</p>
        </div>
        <Link to="/questions/new"><Button>+ New Question</Button></Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading...</div>
      ) : questions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-500">No questions yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <Card key={q.id} className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-slate-200">{q.title}</h3>
                  <Badge label={q.difficulty} />
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">{q.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-slate-600 font-mono">{q._count?.submissions || 0} submissions</span>
                  <span className="text-xs text-slate-600 font-mono">{new Date(q.createdAt).toLocaleDateString()}</span>
                  {q.timeLimit > 0 && (
                    <span className="text-xs text-slate-600 font-mono">⏱ {Math.floor(q.timeLimit / 60)}m</span>
                  )}
                </div>
              </div>
              {/* FEATURE 2 button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="secondary" onClick={() => setViewing(q)}>
                  View Submissions
                </Button>
                <Button variant="danger" onClick={() => handleDelete(q.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* FEATURE 2 modal */}
      {viewing && <SubmissionsModal question={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
EOF

# ─────────────────────────────────────────────────────────────────
# FRONTEND – CreateQuestion (Feature 3+4: JSON expected output + timeLimit)
# ─────────────────────────────────────────────────────────────────

echo "✏️  Patching frontend/src/pages/CreateQuestion.jsx..."

cat > frontend/src/pages/CreateQuestion.jsx <<'EOF'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/useApi'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Button from '../components/ui/Button'

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

  const toggleMulti = () => {
    setMultiMode(m => {
      if (!m) setForm(f => ({ ...f, expectedOutput: EXAMPLE_MULTI }))
      else setForm(f => ({ ...f, expectedOutput: '' }))
      return !m
    })
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-white">Create Question</h1>
        <p className="text-slate-500 text-sm mt-1">Design a coding challenge for students</p>
      </div>

      <Card>
        {error && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 text-red-400 text-sm mb-5">{error}</div>
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
              spellCheck={false}
            />
          </div>

          {/* Expected output – FEATURE 3 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-300">Expected Output</label>
              <button type="button" onClick={toggleMulti}
                className={`text-xs font-mono px-2 py-1 rounded-md border transition-all ${multiMode ? 'bg-brand-600/20 border-brand-500 text-brand-300' : 'bg-dark-700 border-dark-500 text-slate-500 hover:border-dark-400'}`}>
                {multiMode ? '✓ Multi-test JSON' : 'Switch to Multi-test'}
              </button>
            </div>
            <textarea
              className="code-editor min-h-[90px]"
              placeholder={multiMode ? EXAMPLE_MULTI : 'e.g. 42'}
              value={form.expectedOutput}
              onChange={set('expectedOutput')}
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
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
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
                className="w-28 px-3 py-2.5 rounded-lg bg-dark-700 border border-dark-400 text-slate-200 text-sm outline-none focus:border-brand-500 transition-colors"
              />
              <span className="text-xs text-slate-500">
                = {Math.floor(form.timeLimit / 60)}m {form.timeLimit % 60 > 0 ? `${form.timeLimit % 60}s` : ''} — auto-submits when timer reaches 0
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1 justify-center">Create Question</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
EOF

# ─────────────────────────────────────────────────────────────────
# Run Prisma migration
# ─────────────────────────────────────────────────────────────────

echo ""
echo "✅ All files patched!"
echo ""
echo "📦 Final steps:"
echo ""
echo "  1. Run Prisma migration (adds timeLimit column):"
echo "     cd backend && npx prisma migrate dev --name add_time_limit && cd .."
echo ""
echo "  2. Restart backend:"
echo "     cd backend && npm run dev"
echo ""
echo "  3. Frontend hot-reloads automatically (if already running)"
echo "     Otherwise: cd frontend && npm run dev"
echo ""
echo "Features added:"
echo "  ✓ F1: Run Code (no save) + Submit (save) – two buttons in QuestionDetail"
echo "  ✓ F2: Teacher 'View Submissions' modal with full code, output, student info"
echo "  ✓ F3: Multi test-case JSON support in expectedOutput + UI toggle in CreateQuestion"
echo "  ✓ F4: Countdown timer with auto-submit, color warning, locked after submit"
EOF

chmod +x /mnt/user-data/outputs/patch_codeexec.sh
echo "Done"
