const router = require('express').Router();
const ctrl = require('../controllers/submissions');
const auth = require('../middleware/auth');

router.post('/run', auth, ctrl.runCodeOnly);
router.post('/save', auth, ctrl.saveSubmission);
router.post('/', auth, ctrl.submit);
router.get('/mine', auth, ctrl.getMySubmissions);
router.get('/question/:questionId', auth, ctrl.getForQuestion);

module.exports = router;
