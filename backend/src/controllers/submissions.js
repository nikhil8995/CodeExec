const prisma = require('../utils/prisma');
const { execFile } = require('child_process');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────

const runCode = (code, stdin = '') => new Promise((resolve) => {
  const runner = path.join(__dirname, '../../../docker-runner/run.js');
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
