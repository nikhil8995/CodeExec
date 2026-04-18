const prisma = require('../utils/prisma');

exports.create = async (req, res) => {
  try {
    const { title, description, starterCode, expectedOutput, difficulty, timeLimit } = req.body;
    const q = await prisma.question.create({
      data: {
        title, description,
        starterCode: starterCode || '',
        expectedOutput,
        difficulty: difficulty || 'MEDIUM',
        timeLimit: timeLimit ? parseInt(timeLimit) : 300,
        userId: req.user.id
      }
    });
    res.json(q);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(questions);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const q = await prisma.question.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { createdBy: { select: { name: true } } }
    });
    if (!q) return res.status(404).json({ error: 'Not found' });
    res.json(q);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getMyQuestions = async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(questions);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.submission.deleteMany({ where: { questionId: parseInt(req.params.id) } });
    await prisma.question.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * FEATURE 2 – Teacher: get ALL submissions for a question
 * GET /api/questions/:id/submissions
 */
exports.getQuestionSubmissions = async (req, res) => {
  try {
    const subs = await prisma.submission.findMany({
      where: { questionId: parseInt(req.params.id) },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(subs);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
