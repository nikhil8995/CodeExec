require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/submissions', require('./routes/submissions'));

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
