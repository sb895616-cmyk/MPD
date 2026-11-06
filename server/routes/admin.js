const router = require('express').Router();
const { getUsers, getUser, updateUserStatus } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

// All admin routes require authentication AND Admin role
router.use(protect, authorize('Admin'));

router.get('/users', getUsers);
router.get('/users/:id', validateObjectId(), getUser);
router.patch('/users/:id/status', validateObjectId(), updateUserStatus);

module.exports = router;
