const express = require('express');
const cors = require('cors');
const promBundle = require('express-prom-bundle');

const app = express();

const metricsMiddleware = promBundle({
  includeMethod: true, 
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { project_name: 'codeexec' },
  promClient: {
    collectDefaultMetrics: {}
  }
});

// must be first middleware to catch response times
app.use(metricsMiddleware);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://13.127.231.58:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS blocked: ' + origin));
  },
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/submissions', require('./routes/submissions'));

app.get('/api/health', (_, res) => res.json({ ok: true }));

module.exports = app;