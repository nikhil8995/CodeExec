const router = require('express').Router();
const ctrl = require('../controllers/questions');
const auth = require('../middleware/auth');
const { requireRole } = auth;

router.get('/', auth, ctrl.getAll);
router.get('/mine', auth, ctrl.getMyQuestions);
router.get('/:id', auth, ctrl.getOne);
router.post('/', auth, requireRole('TEACHER'), ctrl.create);
router.delete('/:id', auth, requireRole('TEACHER'), ctrl.remove);

// FEATURE 2: teacher views all submissions for a question
router.get('/:id/submissions', auth, requireRole('TEACHER'), ctrl.getQuestionSubmissions);

module.exports = router;
