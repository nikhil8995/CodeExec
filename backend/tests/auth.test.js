const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const bcrypt = require('bcryptjs');

// Mock Prisma
jest.mock('../src/utils/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Auth API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── REGISTER ─────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // no existing user
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
        role: 'STUDENT',
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@test.com');
      expect(res.body.user.role).toBe('STUDENT');
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Missing fields');
    });

    it('should return 400 for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' });

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Email already in use');
    });

    it('should register a TEACHER when role is specified', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 2,
        email: 'teacher@test.com',
        name: 'Teacher',
        role: 'TEACHER',
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'teacher@test.com',
        password: 'password123',
        name: 'Teacher',
        role: 'TEACHER',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe('TEACHER');
    });
  });

  // ── LOGIN ────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
        role: 'STUDENT',
        password: hashed,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@test.com');
    });

    it('should return 400 for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@test.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 400 for wrong password', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: hashed,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: 'wrongpassword',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  // ── GET /me ──────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('should return user info with valid token', async () => {
      // First register to get a token
      prisma.user.findUnique.mockResolvedValueOnce(null); // for register check
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
        role: 'STUDENT',
      });

      const registerRes = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      });

      const token = registerRes.body.token;

      // Mock the /me call
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
        role: 'STUDENT',
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('test@test.com');
    });
  });
});
