const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');

// Mock Prisma
jest.mock('../src/utils/prisma', () => ({
  question: {
    findUnique: jest.fn(),
  },
  submission: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
}));

const studentToken = jwt.sign(
  { id: 2, email: 'student@test.com', role: 'STUDENT', name: 'Student' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const student2Token = jwt.sign(
  { id: 3, email: 'student2@test.com', role: 'STUDENT', name: 'Student 2' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Submissions API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── SUBMIT CODE ─────────────────────────────────────────
  describe('POST /api/submissions', () => {
    it('should submit code and get a result', async () => {
      prisma.question.findUnique.mockResolvedValue({
        id: 1,
        title: 'Hello World',
        expectedOutput: 'hello',
      });

      prisma.submission.create.mockResolvedValue({
        id: 1,
        code: 'console.log("hello")',
        output: 'hello',
        status: 'PASS',
        userId: 2,
        questionId: 1,
      });

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: 'console.log("hello")',
          questionId: 1,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('saved', true);
    });

    it('should return 404 for non-existent question', async () => {
      prisma.question.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: 'console.log("hello")',
          questionId: 999,
        });

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/submissions')
        .send({
          code: 'console.log("hello")',
          questionId: 1,
        });

      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET MY SUBMISSIONS ──────────────────────────────────
  describe('GET /api/submissions/mine', () => {
    it('should return only current user submissions', async () => {
      prisma.submission.findMany.mockResolvedValue([
        { id: 1, code: 'test', status: 'PASS', question: { title: 'Q1' } },
      ]);

      const res = await request(app)
        .get('/api/submissions/mine')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      // Verify Prisma was called with the correct userId filter
      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 2 },
        })
      );
    });

    it('should isolate data between users', async () => {
      prisma.submission.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/submissions/mine')
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.statusCode).toBe(200);
      // Verify Prisma filter uses student2's userId (3), not student1's (2)
      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 3 },
        })
      );
    });
  });

  // ── GET SUBMISSIONS FOR QUESTION ────────────────────────
  describe('GET /api/submissions/question/:questionId', () => {
    it('should return submissions for a specific question', async () => {
      prisma.submission.findMany.mockResolvedValue([
        { id: 1, code: 'test', status: 'PASS' },
      ]);

      const res = await request(app)
        .get('/api/submissions/question/1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 2, questionId: 1 },
        })
      );
    });
  });

  // ── RUN CODE (WITHOUT SAVING) ───────────────────────────
  describe('POST /api/submissions/run', () => {
    it('should run code and return output without saving', async () => {
      prisma.question.findUnique.mockResolvedValue({
        id: 1,
        expectedOutput: 'hello',
      });

      const res = await request(app)
        .post('/api/submissions/run')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: 'console.log("hello")',
          questionId: 1,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('saved', false);
    });
  });
});
