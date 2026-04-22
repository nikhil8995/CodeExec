/**
 * E2E Workflow Test
 * Simulates the full lifecycle:
 *   Teacher registers → creates question → Student registers → submits code → verify result
 *
 * NOTE: This test runs against a LIVE instance of the app (containerized).
 *       Set E2E_BASE_URL environment variable to point to the running backend.
 *       Default: http://localhost:4000
 */
const request = require('supertest');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:4000';

describe('E2E: Full Workflow', () => {
  let teacherToken;
  let studentToken;
  let questionId;
  const teacherEmail = `teacher_${Date.now()}@test.com`;
  const studentEmail = `student_${Date.now()}@test.com`;

  // ── Step 1: Teacher registers ────────────────────────────
  it('Step 1: Teacher should register', async () => {
    const res = await request(BASE_URL).post('/api/auth/register').send({
      email: teacherEmail,
      password: 'password123',
      name: 'E2E Teacher',
      role: 'TEACHER',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe('TEACHER');
    teacherToken = res.body.token;
  });

  // ── Step 2: Teacher creates a question ───────────────────
  it('Step 2: Teacher should create a question', async () => {
    const res = await request(BASE_URL)
      .post('/api/questions')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'E2E - Hello World',
        description: 'Print hello',
        expectedOutput: 'hello',
        difficulty: 'EASY',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    questionId = res.body.id;
  });

  // ── Step 3: Student registers ────────────────────────────
  it('Step 3: Student should register', async () => {
    const res = await request(BASE_URL).post('/api/auth/register').send({
      email: studentEmail,
      password: 'password123',
      name: 'E2E Student',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe('STUDENT');
    studentToken = res.body.token;
  });

  // ── Step 4: Student can see the question ─────────────────
  it('Step 4: Student should see the question', async () => {
    const res = await request(BASE_URL)
      .get(`/api/questions/${questionId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('E2E - Hello World');
  });

  // ── Step 5: Student submits code ─────────────────────────
  it('Step 5: Student should submit code and get PASS', async () => {
    const res = await request(BASE_URL)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        code: 'console.log("hello")',
        questionId: questionId,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('PASS');
    expect(res.body.saved).toBe(true);
  });

  // ── Step 6: Student can view their submissions ───────────
  it('Step 6: Student should see their submission in history', async () => {
    const res = await request(BASE_URL)
      .get('/api/submissions/mine')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  // ── Step 7: Teacher can view submissions for the question ─
  it('Step 7: Teacher should see student submissions for the question', async () => {
    const res = await request(BASE_URL)
      .get(`/api/questions/${questionId}/submissions`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].user.email).toBe(studentEmail);
  });

  // ── Step 8: Student CANNOT create a question ─────────────
  it('Step 8: Student should be denied from creating a question', async () => {
    const res = await request(BASE_URL)
      .post('/api/questions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Hacker Question',
        description: 'Should fail',
        expectedOutput: 'nope',
      });

    expect(res.statusCode).toBe(403);
  });

  // ── Step 9: Health check ─────────────────────────────────
  it('Step 9: Health endpoint should be reachable', async () => {
    const res = await request(BASE_URL).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
