const prisma = require('../utils/prisma');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ── run code with stdin piped in ──────────────────────────────────
const runCode = (code, stdin = '') => new Promise((resolve) => {
  const tmpFile = path.join(os.tmpdir(), `ce_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);
  fs.writeFileSync(tmpFile, code);

  const child = exec(`node "${tmpFile}"`, { timeout: 6000 }, (err, stdout, stderr) => {
    try { fs.unlinkSync(tmpFile); } catch {}
    if (err && !stdout) resolve({ output: (stderr || err.message || 'Runtime error').trim(), error: true });
    else resolve({ output: stdout.trim(), error: false });
  });

  if (stdin) {
    child.stdin.write(stdin);
    child.stdin.end();
  }
});

// ── parse expected output ─────────────────────────────────────────
const parseExpected = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { isMulti: true, cases: parsed };
  } catch {}
  return { isMulti: false, cases: [{ input: '', output: raw.trim() }] };
};

// ── run all test cases ────────────────────────────────────────────
const runAllCases = async (code, expectedRaw) => {
  const { isMulti, cases } = parseExpected(expectedRaw);
  const results = [];

  for (const tc of cases) {
    const { output, error } = await runCode(code, tc.input || '');
    const pass = !error && output === tc.output.trim();
    results.push({ input: tc.input, expected: tc.output, actual: output, pass });
  }

  const allPass = results.every(r => r.pass);
  const failing = results.find(r => !r.pass);
  const displayOutput = failing ? failing.actual : results[results.length - 1]?.actual;

  return { status: allPass ? 'PASS' : 'FAIL', output: displayOutput || '', results, isMulti };
};

// ── controllers ───────────────────────────────────────────────────
exports.runCodeOnly = async (req, res) => {
  try {
    const { code, questionId } = req.body;
    const question = await prisma.question.findUnique({ where: { id: parseInt(questionId) } });
    if (!question) return res.status(404).json({ error: 'Question not found' });
    const { status, output, results, isMulti } = await runAllCases(code, question.expectedOutput);
    res.json({ status, output, results, isMulti, saved: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

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

exports.getForQuestion = async (req, res) => {
  try {
    const subs = await prisma.submission.findMany({
      where: { userId: req.user.id, questionId: parseInt(req.params.questionId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(subs);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
