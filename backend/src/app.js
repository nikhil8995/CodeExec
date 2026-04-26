const express = require('express');
const cors = require('cors');
const promBundle = require('express-prom-bundle');
const { register } = require('./utils/metrics');

const app = express();

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  normalizePath: [
    ['^/api/questions/.*', '/api/questions/#id'],
    ['^/api/submissions/.*', '/api/submissions/#id']
  ],
  promClient: {
    collectDefaultMetrics: {},
    register
  }
});
app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://13.127.231.58:5173'
];

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/submissions', require('./routes/submissions'));

app.get('/api/health', (_, res) => res.json({ ok: true }));

module.exports = app;