const prisma = require('../utils/prisma');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');

const {
  executionDurationHistogram,
  executionTimeoutCounter,
  activeExecutionsGauge,
  executionErrorCounter,
  sandboxSecurityEventCounter,
  submissionLatencyHistogram,
  questionPassRateGauge,
  questionSubmissionCount,
  questionPassCount
} = require('../utils/metrics');

const runCode = (code, stdin = '') => new Promise((resolve) => {
  const startTime = Date.now();
  const tmpFile = path.join(os.tmpdir(), `ce_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);
  fs.writeFileSync(tmpFile, code);
  const child = exec(`node "${tmpFile}"`, { timeout: 6000 }, (err, stdout, stderr) => {
    try { fs.unlinkSync(tmpFile); } catch {}
    const duration = (Date.now() - startTime) / 1000;
    if (err && err.killed) {
      executionTimeoutCounter.inc({ question_id: '' });
      executionDurationHistogram.observe({ question_id: '', difficulty: '', language: 'javascript' }, duration);
      resolve({ output: 'Execution timed out after 6 seconds', error: true, timeout: true });
    } else if (err) {
      const output = (stderr || err.message || 'Runtime error').trim();
      if (output.includes('EACCES') || output.includes('EPERM')) {
        sandboxSecurityEventCounter.inc({ event_type: 'permission_denied' });
      }
      executionErrorCounter.inc({ error_type: 'runtime_error' });
      resolve({ output, error: true, timeout: false });
    } else {
      resolve({ output: stdout.trim(), error: false, timeout: false, duration });
    }
  });
  if (stdin) { child.stdin.write(stdin); child.stdin.end(); }
});

const parseExpected = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { isMulti: true, cases: parsed };
  } catch {}
  return { isMulti: false, cases: [{ input: '', output: raw.trim() }] };
};

const runAllCases = async (code, expectedRaw, questionId = '', difficulty = 'MEDIUM') => {
  const { isMulti, cases } = parseExpected(expectedRaw);
  const results = [];
  let totalDuration = 0;
  for (const tc of cases) {
    const { output, error, timeout, duration } = await runCode(code, tc.input || '');
    if (duration) totalDuration += duration;
    const pass = !error && !timeout && output === tc.output.trim();
    results.push({ input: tc.input, expected: tc.output, actual: output, pass });
  }
  const allPass = results.every(r => r.pass);
  const failing = results.find(r => !r.pass);
  const displayOutput = failing ? failing.actual : results[results.length - 1]?.actual;

  if (questionId) {
    executionDurationHistogram.observe({ question_id: String(questionId), difficulty, language: 'javascript' }, totalDuration);
    questionSubmissionCount.inc({ question_id: String(questionId) });
    if (allPass) questionPassCount.inc({ question_id: String(questionId) });
    const subCount = 1;
    const passCount = allPass ? 1 : 0;
    questionPassRateGauge.labels({ question_id: String(questionId), difficulty }).set((passCount / subCount) * 100);
  }

  return { status: allPass ? 'PASS' : 'FAIL', output: displayOutput || '', results, isMulti };
};

exports.runCodeOnly = async (req, res) => {
  const startTime = Date.now();
  activeExecutionsGauge.inc();
  try {
    const { code, questionId, overrideExpected } = req.body;
    const question = await prisma.question.findUnique({ where: { id: parseInt(questionId) } });
    if (!question) {
      activeExecutionsGauge.dec();
      return res.status(404).json({ error: 'Question not found' });
    }
    const expected = overrideExpected || question.expectedOutput;
    const { status, output, results, isMulti } = await runAllCases(code, expected, question.id, question.difficulty);
    const latency = (Date.now() - startTime) / 1000;
    submissionLatencyHistogram.observe({ question_id: String(question.id), difficulty: question.difficulty }, latency);
    activeExecutionsGauge.dec();
    res.json({ status, output, results, isMulti, saved: false });
  } catch (e) {
    activeExecutionsGauge.dec();
    executionErrorCounter.inc({ error_type: 'system_error' });
    res.status(500).json({ error: e.message });
  }
};

// Save pre-verified results with per-case code snapshots
exports.saveSubmission = async (req, res) => {
  try {
    const { code, questionId, status, output, results } = req.body;
    const question = await prisma.question.findUnique({ where: { id: parseInt(questionId) } });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // Store results + per-case code snapshots as JSON in output field
    const fullOutput = JSON.stringify({
      summary: output || '',
      cases: results.map((r, i) => ({
        case: i + 1,
        input: r.input,
        expected: r.expected,
        actual: r.actual,
        pass: r.pass,
        code: r.codeSnapshot || code
      }))
    });

    const sub = await prisma.submission.create({
      data: {
        code,
        output: fullOutput,
        status: status === 'PASS' ? 'PASS' : 'FAIL',
        userId: req.user.id,
        questionId: parseInt(questionId)
      }
    });
    res.json({ ...sub, results, saved: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const { submissionCounter } = require('../utils/metrics');

exports.submit = async (req, res) => {
  const startTime = Date.now();
  activeExecutionsGauge.inc();
  try {
    const { code, questionId } = req.body;
    const question = await prisma.question.findUnique({ where: { id: parseInt(questionId) } });
    if (!question) {
      activeExecutionsGauge.dec();
      return res.status(404).json({ error: 'Question not found' });
    }
    const { status, output, results, isMulti } = await runAllCases(code, question.expectedOutput, question.id, question.difficulty);
    const sub = await prisma.submission.create({
      data: { code, output, status, userId: req.user.id, questionId: parseInt(questionId) }
    });
    submissionCounter.inc({ status, difficulty: question.difficulty });
    const latency = (Date.now() - startTime) / 1000;
    submissionLatencyHistogram.observe({ question_id: String(question.id), difficulty: question.difficulty }, latency);
    activeExecutionsGauge.dec();
    res.json({ ...sub, expectedOutput: question.expectedOutput, results, isMulti, saved: true });
  } catch (e) {
    activeExecutionsGauge.dec();
    executionErrorCounter.inc({ error_type: 'system_error' });
    submissionCounter.inc({ status: 'ERROR', difficulty: 'UNKNOWN' });
    res.status(500).json({ error: e.message });
  }
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
