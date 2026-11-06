const router = require('express').Router();
const { getStats, getRecentAssessments, getHighRiskSuppliers } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getStats);
router.get('/recent-assessments', getRecentAssessments);
router.get('/high-risk-suppliers', getHighRiskSuppliers);

module.exports = router;
