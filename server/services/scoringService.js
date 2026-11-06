/**
 * Risk Scoring Service — single source of truth for the scoring formula.
 *
 * Formula:
 *   Per-factor contribution = ((rating - 1) / 4) * weight * 100
 *   Overall score           = sum of all five contributions  (range: 0–100)
 *
 * Weights must sum to 1.0.
 */

const WEIGHTS = {
  financialStability: 0.25,
  deliveryPerformance: 0.25,
  quality: 0.20,
  compliance: 0.20,
  dependency: 0.10,
};

const RATING_LABELS = {
  1: 'Very Low Risk',
  2: 'Low Risk',
  3: 'Moderate Risk',
  4: 'High Risk',
  5: 'Very High Risk',
};

/**
 * Calculate the overall risk score and level from five factor ratings.
 * @param {Object} ratings - { financialStabilityRating, deliveryPerformanceRating,
 *                             qualityRating, complianceRating, dependencyRating }
 * @returns {{ score: number, level: string, breakdown: Object }}
 */
function calculateRiskScore(ratings) {
  const {
    financialStabilityRating,
    deliveryPerformanceRating,
    qualityRating,
    complianceRating,
    dependencyRating,
  } = ratings;

  const factors = [
    { key: 'financialStability', rating: financialStabilityRating, weight: WEIGHTS.financialStability },
    { key: 'deliveryPerformance', rating: deliveryPerformanceRating, weight: WEIGHTS.deliveryPerformance },
    { key: 'quality', rating: qualityRating, weight: WEIGHTS.quality },
    { key: 'compliance', rating: complianceRating, weight: WEIGHTS.compliance },
    { key: 'dependency', rating: dependencyRating, weight: WEIGHTS.dependency },
  ];

  // Validate all ratings are integers 1–5
  for (const f of factors) {
    const r = Number(f.rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      throw new Error(`Invalid rating for ${f.key}: must be an integer between 1 and 5`);
    }
  }

  const breakdown = {};
  let totalScore = 0;

  for (const f of factors) {
    const contribution = ((Number(f.rating) - 1) / 4) * f.weight * 100;
    breakdown[f.key] = {
      rating: Number(f.rating),
      weight: f.weight,
      weightPercent: f.weight * 100,
      contribution: parseFloat(contribution.toFixed(4)),
      label: RATING_LABELS[Number(f.rating)],
    };
    totalScore += contribution;
  }

  const score = parseFloat(totalScore.toFixed(2));
  const level = classifyRisk(score);

  return { score, level, breakdown };
}

/**
 * Classify a numeric score into a risk level string.
 */
function classifyRisk(score) {
  if (score <= 33.33) return 'Low';
  if (score < 66.67) return 'Medium';
  return 'High';
}

/**
 * Generate plain-English explanations for the highest-contributing factors.
 * These are rule-based — no AI involved.
 */
function generateInsights(breakdown) {
  const EXPLANATIONS = {
    financialStability: {
      high: 'The supplier shows signs of financial instability, which may affect its ability to fulfil contracts.',
      medium: 'The supplier has moderate financial health. Monitor for changes.',
      low: 'The supplier demonstrates strong financial stability.',
    },
    deliveryPerformance: {
      high: 'Delivery performance is poor — expect delays and reliability issues.',
      medium: 'Delivery performance is average. Some delays may occur.',
      low: 'Delivery performance is reliable and consistent.',
    },
    quality: {
      high: 'Product or service quality is inconsistent or below standard.',
      medium: 'Quality meets basic requirements but has room for improvement.',
      low: 'High-quality products or services are consistently delivered.',
    },
    compliance: {
      high: 'Significant regulatory or compliance gaps have been identified.',
      medium: 'Minor compliance issues exist. Corrective action is recommended.',
      low: 'The supplier maintains strong regulatory and compliance standards.',
    },
    dependency: {
      high: 'Heavy dependency on this supplier creates supply chain vulnerability.',
      medium: 'Moderate dependency — consider diversifying sourcing.',
      low: 'Supplier dependency is well managed.',
    },
  };

  const insights = [];
  for (const [key, data] of Object.entries(breakdown)) {
    let tier;
    if (data.rating >= 4) tier = 'high';
    else if (data.rating === 3) tier = 'medium';
    else tier = 'low';
    insights.push({ factor: key, insight: EXPLANATIONS[key][tier] });
  }

  // Sort by contribution descending to highlight biggest drivers first
  insights.sort((a, b) => breakdown[b.factor].contribution - breakdown[a.factor].contribution);
  return insights;
}

module.exports = { calculateRiskScore, classifyRisk, generateInsights, WEIGHTS };
