const RiskAssessment = require('../models/RiskAssessment');
const Supplier = require('../models/Supplier');
const { calculateRiskScore, generateInsights } = require('../services/scoringService');

// POST /api/assessments
const createAssessment = async (req, res, next) => {
  try {
    const {
      supplierId,
      financialStabilityRating,
      deliveryPerformanceRating,
      qualityRating,
      complianceRating,
      dependencyRating,
      notes,
    } = req.body;

    if (!supplierId) {
      return res.status(400).json({ message: 'Supplier is required.' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
    if (supplier.status === 'Inactive') {
      return res.status(400).json({
        message: 'Cannot assess an inactive supplier. Reactivate the supplier first.',
      });
    }

    // Backend calculates the score — never trust a submitted score
    const ratings = {
      financialStabilityRating: Number(financialStabilityRating),
      deliveryPerformanceRating: Number(deliveryPerformanceRating),
      qualityRating: Number(qualityRating),
      complianceRating: Number(complianceRating),
      dependencyRating: Number(dependencyRating),
    };

    let scoreResult;
    try {
      scoreResult = calculateRiskScore(ratings);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const assessment = await RiskAssessment.create({
      supplier: supplierId,
      assessedBy: req.user._id,
      ...ratings,
      riskScore: scoreResult.score,
      riskLevel: scoreResult.level,
      notes: notes?.trim(),
    });

    const populated = await RiskAssessment.findById(assessment._id)
      .populate('supplier', 'name supplierCode')
      .populate('assessedBy', 'name email');

    res.status(201).json({
      data: {
        ...populated.toObject(),
        breakdown: scoreResult.breakdown,
        insights: generateInsights(scoreResult.breakdown),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/assessments  (all assessments — admin/analyst with pagination)
const getAssessments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, riskLevel } = req.query;
    const filter = riskLevel ? { riskLevel } : {};

    const [assessments, total] = await Promise.all([
      RiskAssessment.find(filter)
        .populate('supplier', 'name supplierCode')
        .populate('assessedBy', 'name')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      RiskAssessment.countDocuments(filter),
    ]);

    res.json({
      data: assessments,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/assessments/:id
const getAssessment = async (req, res, next) => {
  try {
    const assessment = await RiskAssessment.findById(req.params.id)
      .populate('supplier', 'name supplierCode status')
      .populate('assessedBy', 'name email');

    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });

    // Recalculate breakdown for display (not stored in DB to keep schema lean)
    const scoreResult = calculateRiskScore({
      financialStabilityRating: assessment.financialStabilityRating,
      deliveryPerformanceRating: assessment.deliveryPerformanceRating,
      qualityRating: assessment.qualityRating,
      complianceRating: assessment.complianceRating,
      dependencyRating: assessment.dependencyRating,
    });

    res.json({
      data: {
        ...assessment.toObject(),
        breakdown: scoreResult.breakdown,
        insights: generateInsights(scoreResult.breakdown),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/:supplierId/assessments
const getSupplierAssessments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const supplier = await Supplier.findById(req.params.supplierId);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });

    const [assessments, total] = await Promise.all([
      RiskAssessment.find({ supplier: req.params.supplierId })
        .populate('assessedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      RiskAssessment.countDocuments({ supplier: req.params.supplierId }),
    ]);

    res.json({
      data: assessments,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createAssessment, getAssessments, getAssessment, getSupplierAssessments };
