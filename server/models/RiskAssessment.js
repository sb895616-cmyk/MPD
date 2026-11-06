const mongoose = require('mongoose');

/**
 * Scoring version lets us track which formula produced a given result.
 * Bump this string if the weights or formula ever change.
 */
const SCORING_VERSION = 'v1.0';

const riskAssessmentSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required'],
    },
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assessor reference is required'],
    },

    // Five risk factor ratings — each from 1 (very low) to 5 (very high)
    financialStabilityRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    deliveryPerformanceRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    qualityRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    complianceRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    dependencyRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Backend-calculated results — never trusted from frontend
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },

    // Records which scoring formula version was used
    scoringVersion: {
      type: String,
      default: SCORING_VERSION,
    },
  },
  { timestamps: true }
);

// Index to efficiently fetch assessments for a supplier sorted by date
riskAssessmentSchema.index({ supplier: 1, createdAt: -1 });

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
