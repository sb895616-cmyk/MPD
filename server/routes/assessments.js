const router = require('express').Router();
const { createAssessment, getAssessments, getAssessment } = require('../controllers/assessmentController');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

router.use(protect);

router.post('/', createAssessment);
router.get('/', getAssessments);
router.get('/:id', validateObjectId(), getAssessment);

module.exports = router;
