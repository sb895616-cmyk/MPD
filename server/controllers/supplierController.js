const Supplier = require('../models/Supplier');
const RiskAssessment = require('../models/RiskAssessment');

// GET /api/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const {
      search = '',
      status,
      industry,
      riskLevel,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { supplierCode: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (industry) filter.industry = { $regex: industry, $options: 'i' };

    const sortMap = {
      name: 'name',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };
    const sortField = sortMap[sortBy] || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .populate('createdBy', 'name email')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(Number(limit)),
      Supplier.countDocuments(filter),
    ]);

    // Attach latest assessment to each supplier
    const supplierIds = suppliers.map((s) => s._id);
    const latestAssessments = await RiskAssessment.aggregate([
      { $match: { supplier: { $in: supplierIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$supplier',
          riskScore: { $first: '$riskScore' },
          riskLevel: { $first: '$riskLevel' },
          createdAt: { $first: '$createdAt' },
        },
      },
    ]);

    const assessmentMap = {};
    latestAssessments.forEach((a) => {
      assessmentMap[a._id.toString()] = a;
    });

    // Filter by risk level if requested (post-join filter)
    let results = suppliers.map((s) => ({
      ...s.toObject(),
      latestAssessment: assessmentMap[s._id.toString()] || null,
    }));

    if (riskLevel) {
      results = results.filter(
        (s) => s.latestAssessment && s.latestAssessment.riskLevel === riskLevel
      );
    }

    res.json({
      data: results,
      pagination: {
        total: riskLevel ? results.length : total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((riskLevel ? results.length : total) / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/suppliers
const createSupplier = async (req, res, next) => {
  try {
    const {
      supplierCode, name, contactPerson, email, phone,
      industry, country, city, address, yearsInOperation,
      annualContractValue, description,
    } = req.body;

    if (!supplierCode || !name) {
      return res.status(400).json({ message: 'Supplier code and name are required.' });
    }
    if (yearsInOperation !== undefined && yearsInOperation !== '' && isNaN(Number(yearsInOperation))) {
      return res.status(400).json({ message: 'Years in operation must be a number.' });
    }
    if (annualContractValue !== undefined && annualContractValue !== '' && isNaN(Number(annualContractValue))) {
      return res.status(400).json({ message: 'Annual contract value must be a number.' });
    }

    const supplier = await Supplier.create({
      supplierCode: supplierCode.trim().toUpperCase(),
      name: name.trim(),
      contactPerson: contactPerson?.trim(),
      email: email?.toLowerCase().trim(),
      phone: phone?.trim(),
      industry: industry?.trim(),
      country: country?.trim(),
      city: city?.trim(),
      address: address?.trim(),
      yearsInOperation: yearsInOperation !== '' ? Number(yearsInOperation) : undefined,
      annualContractValue: annualContractValue !== '' ? Number(annualContractValue) : undefined,
      description: description?.trim(),
      createdBy: req.user._id,
    });

    res.status(201).json({ data: supplier });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/:id
const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate('createdBy', 'name email');
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });

    const latestAssessment = await RiskAssessment.findOne({ supplier: supplier._id })
      .sort({ createdAt: -1 })
      .populate('assessedBy', 'name email');

    res.json({ data: { ...supplier.toObject(), latestAssessment } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/suppliers/:id
const updateSupplier = async (req, res, next) => {
  try {
    const {
      name, contactPerson, email, phone, industry, country, city,
      address, yearsInOperation, annualContractValue, description,
    } = req.body;

    if (yearsInOperation !== undefined && yearsInOperation !== '' && isNaN(Number(yearsInOperation))) {
      return res.status(400).json({ message: 'Years in operation must be a number.' });
    }
    if (annualContractValue !== undefined && annualContractValue !== '' && isNaN(Number(annualContractValue))) {
      return res.status(400).json({ message: 'Annual contract value must be a number.' });
    }

    const updates = {
      name: name?.trim(),
      contactPerson: contactPerson?.trim(),
      email: email?.toLowerCase().trim(),
      phone: phone?.trim(),
      industry: industry?.trim(),
      country: country?.trim(),
      city: city?.trim(),
      address: address?.trim(),
      yearsInOperation: yearsInOperation !== '' ? Number(yearsInOperation) : undefined,
      annualContractValue: annualContractValue !== '' ? Number(annualContractValue) : undefined,
      description: description?.trim(),
    };

    // Remove undefined keys so they don't overwrite existing values
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });

    res.json({ data: supplier });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/suppliers/:id/status
const updateSupplierStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Active or Inactive.' });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });

    res.json({ data: supplier });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSuppliers, createSupplier, getSupplier, updateSupplier, updateSupplierStatus };
