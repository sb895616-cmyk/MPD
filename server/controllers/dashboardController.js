const Supplier = require('../models/Supplier');
const RiskAssessment = require('../models/RiskAssessment');

/**
 * Build a map of supplierId -> latest assessment using aggregation.
 * This ensures we count each supplier only once.
 */
const buildLatestAssessmentMap = async () => {
  const results = await RiskAssessment.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$supplier',
        riskLevel: { $first: '$riskLevel' },
        riskScore: { $first: '$riskScore' },
        createdAt: { $first: '$createdAt' },
      },
    },
  ]);
  const map = {};
  results.forEach((r) => { map[r._id.toString()] = r; });
  return map;
};

// GET /api/dashboard/stats
const getStats = async (req, res, next) => {
  try {
    const [allSuppliers, latestMap] = await Promise.all([
      Supplier.find({}, '_id status').lean(),
      buildLatestAssessmentMap(),
    ]);

    let totalActive = 0, low = 0, medium = 0, high = 0, notAssessed = 0;

    allSuppliers.forEach((s) => {
      if (s.status !== 'Active') return;
      totalActive++;
      const latest = latestMap[s._id.toString()];
      if (!latest) { notAssessed++; return; }
      if (latest.riskLevel === 'Low') low++;
      else if (latest.riskLevel === 'Medium') medium++;
      else high++;
    });

    res.json({ data: { totalActive, low, medium, high, notAssessed } });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/recent-assessments
const getRecentAssessments = async (req, res, next) => {
  try {
    const assessments = await RiskAssessment.find()
      .populate('supplier', 'name supplierCode')
      .populate('assessedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ data: assessments });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/high-risk-suppliers
const getHighRiskSuppliers = async (req, res, next) => {
  try {
    // Get the latest assessment for every supplier, sorted by score descending
    const latestPerSupplier = await RiskAssessment.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$supplier',
          riskScore: { $first: '$riskScore' },
          riskLevel: { $first: '$riskLevel' },
          assessmentId: { $first: '$_id' },
          assessedAt: { $first: '$createdAt' },
        },
      },
      { $match: { riskLevel: 'High' } },
      { $sort: { riskScore: -1 } },
      { $limit: 5 },
    ]);

    // Populate supplier names
    const supplierIds = latestPerSupplier.map((r) => r._id);
    const suppliers = await Supplier.find({ _id: { $in: supplierIds } }, 'name supplierCode status');
    const supplierMap = {};
    suppliers.forEach((s) => { supplierMap[s._id.toString()] = s; });

    const result = latestPerSupplier.map((r) => ({
      supplier: supplierMap[r._id.toString()],
      riskScore: r.riskScore,
      riskLevel: r.riskLevel,
      assessedAt: r.assessedAt,
    }));

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getRecentAssessments, getHighRiskSuppliers };
