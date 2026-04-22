const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');

// Mock Prisma
jest.mock('../src/utils/prisma', () => ({
  question: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  submission: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

// Helper: generate JWT for testing
const makeToken = (overrides = {}) =>
  jwt.sign(
    { id: 1, email: 'teacher@test.com', role: 'TEACHER', name: 'Teacher', ...overrides },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

const teacherToken = makeToken();
const studentToken = makeToken({ id: 2, email: 'student@test.com', role: 'STUDENT', name: 'Student' });

describe('Questions API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── GET ALL QUESTIONS ────────────────────────────────────
  describe('GET /api/questions', () => {
    it('should return all questions for authenticated user', async () => {
      prisma.question.findMany.mockResolvedValue([
        { id: 1, title: 'Q1', description: 'Desc 1', createdBy: { name: 'Teacher' } },
        { id: 2, title: 'Q2', description: 'Desc 2', createdBy: { name: 'Teacher' } },
      ]);

      const res = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Q1');
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/questions');
      expect(res.statusCode).toBe(401);
    });
  });

  // ── CREATE QUESTION (TEACHER ONLY) ──────────────────────
  describe('POST /api/questions', () => {
    it('should allow a TEACHER to create a question', async () => {
      const questionData = {
        title: 'Sum of Two Numbers',
        description: 'Write a function that adds two numbers',
        expectedOutput: '5',
        difficulty: 'EASY',
      };

      prisma.question.create.mockResolvedValue({
        id: 1,
        ...questionData,
        starterCode: '',
        timeLimit: 300,
        userId: 1,
      });

      const res = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Sum of Two Numbers');
    });

    it('should DENY a STUDENT from creating a question (403)', async () => {
      const res = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Hack', description: 'No', expectedOutput: 'No' });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });
  });

  // ── GET SINGLE QUESTION ─────────────────────────────────
  describe('GET /api/questions/:id', () => {
    it('should return a question by ID', async () => {
      prisma.question.findUnique.mockResolvedValue({
        id: 1,
        title: 'Q1',
        description: 'Desc',
        createdBy: { name: 'Teacher' },
      });

      const res = await request(app)
        .get('/api/questions/1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Q1');
    });

    it('should return 404 for non-existent question', async () => {
      prisma.question.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/questions/999')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE QUESTION (TEACHER ONLY) ──────────────────────
  describe('DELETE /api/questions/:id', () => {
    it('should allow a TEACHER to delete a question', async () => {
      prisma.submission.deleteMany.mockResolvedValue({ count: 0 });
      prisma.question.delete.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .delete('/api/questions/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should DENY a STUDENT from deleting a question (403)', async () => {
      const res = await request(app)
        .delete('/api/questions/1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET QUESTION SUBMISSIONS (TEACHER ONLY) ─────────────
  describe('GET /api/questions/:id/submissions', () => {
    it('should allow a TEACHER to view all submissions for a question', async () => {
      prisma.submission.findMany.mockResolvedValue([
        { id: 1, code: 'console.log(1)', user: { name: 'Student', email: 's@t.com' } },
      ]);

      const res = await request(app)
        .get('/api/questions/1/submissions')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should DENY a STUDENT from viewing question submissions (403)', async () => {
      const res = await request(app)
        .get('/api/questions/1/submissions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
