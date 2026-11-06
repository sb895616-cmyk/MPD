/**
 * Seed Script: Sample Suppliers and Assessments
 * Creates realistic fictional data for demonstration.
 * Safe to run multiple times — skips existing records.
 *
 * Usage: npm run seed:data
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const RiskAssessment = require('../models/RiskAssessment');
const { calculateRiskScore } = require('../services/scoringService');

const SAMPLE_SUPPLIERS = [
  {
    supplierCode: 'SUP-001',
    name: 'Apex Industrial Components',
    contactPerson: 'Robert Chen',
    email: 'robert.chen@apex-ind.com',
    phone: '+1-555-0101',
    industry: 'Manufacturing',
    country: 'USA',
    city: 'Detroit',
    yearsInOperation: 22,
    annualContractValue: 850000,
    description: 'Supplier of precision machined components for automotive assembly.',
    // Low risk
    assessment: { financialStabilityRating: 1, deliveryPerformanceRating: 2, qualityRating: 1, complianceRating: 1, dependencyRating: 2 },
  },
  {
    supplierCode: 'SUP-002',
    name: 'GlobalTech Semiconductors',
    contactPerson: 'Priya Sharma',
    email: 'priya.sharma@globaltech-semi.com',
    phone: '+91-98765-43210',
    industry: 'Electronics',
    country: 'India',
    city: 'Bangalore',
    yearsInOperation: 15,
    annualContractValue: 2100000,
    description: 'Semiconductor chip manufacturer for embedded systems and IoT devices.',
    // Medium risk
    assessment: { financialStabilityRating: 3, deliveryPerformanceRating: 3, qualityRating: 2, complianceRating: 3, dependencyRating: 4 },
  },
  {
    supplierCode: 'SUP-003',
    name: 'Nordic Logistics GmbH',
    contactPerson: 'Erik Lindqvist',
    email: 'e.lindqvist@nordic-logistics.de',
    phone: '+49-30-123456',
    industry: 'Logistics',
    country: 'Germany',
    city: 'Hamburg',
    yearsInOperation: 30,
    annualContractValue: 470000,
    description: 'Third-party logistics provider specialising in cold-chain and fragile goods.',
    // Low risk
    assessment: { financialStabilityRating: 1, deliveryPerformanceRating: 1, qualityRating: 2, complianceRating: 1, dependencyRating: 3 },
  },
  {
    supplierCode: 'SUP-004',
    name: 'Eastbridge Chemical Supplies',
    contactPerson: 'Ana Ferreira',
    email: 'ana.ferreira@eastbridge-chem.com',
    phone: '+55-11-99887-7665',
    industry: 'Chemicals',
    country: 'Brazil',
    city: 'Sao Paulo',
    yearsInOperation: 8,
    annualContractValue: 390000,
    description: 'Supplier of industrial-grade solvents and cleaning agents.',
    // High risk
    assessment: { financialStabilityRating: 5, deliveryPerformanceRating: 4, qualityRating: 4, complianceRating: 5, dependencyRating: 3 },
  },
  {
    supplierCode: 'SUP-005',
    name: 'SilkRoute Textiles Pvt Ltd',
    contactPerson: 'Meera Nair',
    email: 'meera@silkroute-textiles.in',
    phone: '+91-44-6543-2100',
    industry: 'Textiles',
    country: 'India',
    city: 'Chennai',
    yearsInOperation: 12,
    annualContractValue: 125000,
    description: 'Manufacturer of cotton and blended fabrics for garment exports.',
    // Medium risk
    assessment: { financialStabilityRating: 3, deliveryPerformanceRating: 4, qualityRating: 3, complianceRating: 2, dependencyRating: 2 },
  },
  {
    supplierCode: 'SUP-006',
    name: 'Titan Steel Works',
    contactPerson: 'James O\'Reilly',
    email: 'j.oreilly@titansteel.co.uk',
    phone: '+44-121-555-0200',
    industry: 'Steel & Metals',
    country: 'UK',
    city: 'Birmingham',
    yearsInOperation: 45,
    annualContractValue: 1800000,
    description: 'Structural steel sections and custom fabrications for construction.',
    // Low risk
    assessment: { financialStabilityRating: 1, deliveryPerformanceRating: 2, qualityRating: 1, complianceRating: 2, dependencyRating: 3 },
  },
  {
    supplierCode: 'SUP-007',
    name: 'Meridian Pharma Ingredients',
    contactPerson: 'Dr. Sophia Tan',
    email: 'sophia.tan@meridian-pharma.sg',
    phone: '+65-6789-0123',
    industry: 'Pharmaceuticals',
    country: 'Singapore',
    city: 'Singapore',
    yearsInOperation: 18,
    annualContractValue: 3200000,
    description: 'Active pharmaceutical ingredient (API) supplier for generic drug manufacturers.',
    // High risk — high dependency and compliance issues
    assessment: { financialStabilityRating: 4, deliveryPerformanceRating: 3, qualityRating: 3, complianceRating: 5, dependencyRating: 5 },
  },
  {
    supplierCode: 'SUP-008',
    name: 'PacificEdge Packaging Co.',
    contactPerson: 'Li Wei',
    email: 'liwei@pacificedge-pkg.cn',
    phone: '+86-20-8765-4321',
    industry: 'Packaging',
    country: 'China',
    city: 'Guangzhou',
    yearsInOperation: 10,
    annualContractValue: 220000,
    description: 'Custom corrugated and biodegradable packaging solutions.',
    // No assessment — for the "awaiting first assessment" stat
    assessment: null,
  },
  {
    supplierCode: 'SUP-009',
    name: 'AgriSource Trading LLC',
    contactPerson: 'Fatima Al-Rashid',
    email: 'fatima@agrisource-uae.ae',
    phone: '+971-4-234-5678',
    industry: 'Agriculture',
    country: 'UAE',
    city: 'Dubai',
    yearsInOperation: 6,
    annualContractValue: 560000,
    description: 'Import and distribution of bulk agricultural commodities.',
    // Medium risk
    assessment: { financialStabilityRating: 3, deliveryPerformanceRating: 2, qualityRating: 3, complianceRating: 3, dependencyRating: 3 },
  },
  {
    supplierCode: 'SUP-010',
    name: 'Volcanica Software Services',
    contactPerson: 'Carlos Mendez',
    email: 'carlos@volcanica-software.mx',
    phone: '+52-55-1234-5678',
    industry: 'IT Services',
    country: 'Mexico',
    city: 'Mexico City',
    yearsInOperation: 7,
    annualContractValue: 95000,
    description: 'Offshore software development and QA testing services.',
    // Another no-assessment supplier
    assessment: null,
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find any active admin to use as creator/assessor
    const admin = await User.findOne({ role: 'Admin', isActive: true });
    if (!admin) {
      console.error('No active admin found. Run npm run seed:admin first.');
      process.exit(1);
    }

    let created = 0, skipped = 0;

    for (const data of SAMPLE_SUPPLIERS) {
      const { assessment: assessmentData, ...supplierData } = data;

      // Check if supplier already exists
      const existing = await Supplier.findOne({ supplierCode: supplierData.supplierCode });
      if (existing) {
        console.log(`Skipping existing supplier: ${supplierData.supplierCode}`);
        skipped++;
        continue;
      }

      const supplier = await Supplier.create({ ...supplierData, createdBy: admin._id });
      console.log(`Created supplier: ${supplier.supplierCode} - ${supplier.name}`);

      if (assessmentData) {
        const { score, level } = calculateRiskScore({
          financialStabilityRating: assessmentData.financialStabilityRating,
          deliveryPerformanceRating: assessmentData.deliveryPerformanceRating,
          qualityRating: assessmentData.qualityRating,
          complianceRating: assessmentData.complianceRating,
          dependencyRating: assessmentData.dependencyRating,
        });

        await RiskAssessment.create({
          supplier: supplier._id,
          assessedBy: admin._id,
          ...assessmentData,
          riskScore: score,
          riskLevel: level,
          notes: 'Initial assessment created by seed script for demonstration purposes.',
        });
        console.log(`  → Assessment created: Score ${score} (${level})`);
      } else {
        console.log(`  → No assessment (awaiting first assessment)`);
      }

      created++;
    }

    console.log(`\nSeeding complete: ${created} suppliers created, ${skipped} skipped.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
})();
