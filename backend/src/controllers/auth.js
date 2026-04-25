const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const sign = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, name: user.name },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const { authCounter } = require('../utils/metrics');

exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: role === 'TEACHER' ? 'TEACHER' : 'STUDENT' }
    });
    authCounter.inc({ type: 'register', status: 'success' });
    res.json({ token: sign(user), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    authCounter.inc({ type: 'register', status: 'failure' });
    res.status(500).json({ error: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      authCounter.inc({ type: 'login', status: 'failure' });
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      authCounter.inc({ type: 'login', status: 'failure' });
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    authCounter.inc({ type: 'login', status: 'success' });
    res.json({ token: sign(user), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    authCounter.inc({ type: 'login', status: 'failure' });
    res.status(500).json({ error: e.message });
  }
};

exports.me = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, name: true, role: true } });
  res.json(user);
};
