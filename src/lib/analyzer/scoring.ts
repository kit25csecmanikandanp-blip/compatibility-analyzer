/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiFinding, CompatibilitySummary } from '../../types/api';

/**
 * Calculates a standard, consistent compatibility score from 0 to 100 based on the detected findings:
 * - Starting Base: 100 points
 * - Each BREAKING change: -15 points (Immediate high severity client breakage)
 * - Each POTENTIALLY_BREAKING change: -5 points (May break specific client usage or edge flows)
 * - Each INFORMATIONAL change: -1 point (Specification difference / best practice note)
 * - Each NON_BREAKING change: 0 points deducted (Safe additive evolution)
 * - Lower bound is strictly 0, upper bound is 100.
 */
export function calculateCompatibilityScore(findings: ApiFinding[]): CompatibilitySummary {
  let breaking = 0;
  let potentiallyBreaking = 0;
  let nonBreaking = 0;
  let informational = 0;

  for (const f of findings) {
    if (f.severity === 'BREAKING') breaking++;
    else if (f.severity === 'POTENTIALLY_BREAKING') potentiallyBreaking++;
    else if (f.severity === 'NON_BREAKING') nonBreaking++;
    else if (f.severity === 'INFORMATIONAL') informational++;
  }

  const breakingDeduction = breaking * 15;
  const potentialDeduction = potentiallyBreaking * 5;
  const infoDeduction = informational * 1;
  const totalDeductions = breakingDeduction + potentialDeduction + infoDeduction;

  const score = Math.max(0, Math.min(100, 100 - totalDeductions));

  let status: CompatibilitySummary['status'] = 'COMPATIBLE';
  if (breaking > 0) {
    status = score < 50 ? 'CRITICAL' : 'BREAKING_DETECTED';
  } else if (potentiallyBreaking > 0) {
    status = 'WARNING';
  } else {
    status = 'COMPATIBLE';
  }

  return {
    overallScore: score,
    status,
    totalBreaking: breaking,
    totalPotentiallyBreaking: potentiallyBreaking,
    totalNonBreaking: nonBreaking,
    totalInformational: informational,
    deductionBreakdown: {
      breakingDeductions: breakingDeduction,
      potentialDeductions: potentialDeduction,
      infoDeductions: infoDeduction
    }
  };
}
