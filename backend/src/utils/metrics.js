const promClient = require('prom-client');

const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

const authCounter = new promClient.Counter({
  name: 'codeexec_auth_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'status'],
  registers: [register]
});

const submissionCounter = new promClient.Counter({
  name: 'codeexec_submissions_total',
  help: 'Total number of code submissions',
  labelNames: ['status', 'difficulty'],
  registers: [register]
});

const executionDurationHistogram = new promClient.Histogram({
  name: 'codeexec_execution_duration_seconds',
  help: 'Time taken to execute submitted code',
  labelNames: ['question_id', 'difficulty', 'language'],
  buckets: [0.1, 0.25, 0.5, 1, 2, 3, 4, 5, 6],
  registers: [register]
});

const submissionLatencyHistogram = new promClient.Histogram({
  name: 'codeexec_submission_latency_seconds',
  help: 'End-to-end latency from submission request to result',
  labelNames: ['question_id', 'difficulty'],
  buckets: [0.25, 0.5, 1, 2, 3, 5, 10],
  registers: [register]
});

const executionTimeoutCounter = new promClient.Counter({
  name: 'codeexec_execution_timeouts_total',
  help: 'Total number of code executions that timed out',
  labelNames: ['question_id'],
  registers: [register]
});

const activeExecutionsGauge = new promClient.Gauge({
  name: 'codeexec_active_executions',
  help: 'Number of code executions currently in progress',
  registers: [register]
});

const executionErrorCounter = new promClient.Counter({
  name: 'codeexec_execution_errors_total',
  help: 'Total number of execution errors',
  labelNames: ['error_type'],
  registers: [register]
});

const sandboxSecurityEventCounter = new promClient.Counter({
  name: 'codeexec_sandbox_security_events_total',
  help: 'Total number of sandbox security events (permission denials, spawn failures)',
  labelNames: ['event_type'],
  registers: [register]
});

const questionPassRateGauge = new promClient.Gauge({
  name: 'codeexec_question_pass_rate',
  help: 'Pass rate per question (updated on each submission)',
  labelNames: ['question_id', 'difficulty'],
  registers: [register]
});

const questionSubmissionCount = new promClient.Counter({
  name: 'codeexec_question_submissions_total',
  help: 'Total submissions per question',
  labelNames: ['question_id'],
  registers: [register]
});

const questionPassCount = new promClient.Counter({
  name: 'codeexec_question_passes_total',
  help: 'Total passes per question',
  labelNames: ['question_id'],
  registers: [register]
});

module.exports = {
  register,
  authCounter,
  submissionCounter,
  executionDurationHistogram,
  submissionLatencyHistogram,
  executionTimeoutCounter,
  activeExecutionsGauge,
  executionErrorCounter,
  sandboxSecurityEventCounter,
  questionPassRateGauge,
  questionSubmissionCount,
  questionPassCount,
  promClient
};
