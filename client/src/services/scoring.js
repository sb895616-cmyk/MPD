/**
 * Client-side scoring preview — mirrors the backend formula exactly.
 * Used only for the "live preview" on the assessment form.
 * The backend always recalculates the authoritative score before saving.
 */

const WEIGHTS = {
  financialStability: 0.25,
  deliveryPerformance: 0.25,
  quality: 0.20,
  compliance: 0.20,
  dependency: 0.10,
};

export function previewScore(ratings) {
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

  let total = 0;
  for (const f of factors) {
    const r = Number(f.rating);
    if (!r || r < 1 || r > 5) return null; // incomplete
    total += ((r - 1) / 4) * f.weight * 100;
  }

  const score = parseFloat(total.toFixed(2));
  let level;
  if (score <= 33.33) level = 'Low';
  else if (score < 66.67) level = 'Medium';
  else level = 'High';

  return { score, level };
}
