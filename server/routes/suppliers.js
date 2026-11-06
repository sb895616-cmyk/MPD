const router = require('express').Router();
const {
  getSuppliers, createSupplier, getSupplier, updateSupplier, updateSupplierStatus,
} = require('../controllers/supplierController');
const { getSupplierAssessments } = require('../controllers/assessmentController');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

router.use(protect);

router.get('/', getSuppliers);
router.post('/', createSupplier);

// Must be before /:id to avoid Express treating "assessments" as the :id value
router.get('/:supplierId/assessments', validateObjectId('supplierId'), getSupplierAssessments);

router.get('/:id', validateObjectId(), getSupplier);
router.put('/:id', validateObjectId(), updateSupplier);
router.patch('/:id/status', validateObjectId(), updateSupplierStatus);

module.exports = router;
