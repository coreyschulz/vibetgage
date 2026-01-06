/**
 * Input parameters for buydown calculation
 */
export interface BuydownInputs {
  loanAmount: number;
  baseInterestRate: number; // Annual rate as percentage
  loanTermMonths: number;
  numberOfPoints: number; // e.g., 1 for 1 point
  rateReductionPerPoint: number; // Typically 0.25 (meaning 0.25%)
  isRefinance: boolean; // Affects tax treatment of points
  expectedOwnershipYears: number;
  marginalTaxRate: number; // For tax benefit of points
}

/**
 * Results for a single buydown scenario
 */
export interface BuydownScenario {
  // Points configuration
  numberOfPoints: number;

  // Costs
  pointsCostDollars: number;
  pointsCostPercent: number;

  // Rates
  originalRate: number;
  boughtDownRate: number;
  rateReduction: number;

  // Monthly payments
  originalMonthlyPayment: number;
  boughtDownMonthlyPayment: number;
  monthlySavings: number;

  // Break-even analysis
  breakEvenMonths: number;
  breakEvenYears: number;

  // Total cost comparison
  totalInterestWithoutPoints: number;
  totalInterestWithPoints: number;
  interestSavings: number;

  totalCostWithoutPoints: number; // Principal + Interest
  totalCostWithPoints: number; // Principal + Interest + Points
  netSavingsOverLife: number;

  // Tax implications
  taxDeductibleAmount: number;
  effectiveCostAfterTax: number;
  adjustedBreakEvenMonths: number;
}

/**
 * Comparison across multiple buydown scenarios
 */
export interface BuydownComparison {
  scenarios: BuydownScenario[];
  optimalScenario: BuydownScenario;
  recommendation: string;
}

/**
 * Default buydown configuration
 */
export const DEFAULT_BUYDOWN_INPUTS: Partial<BuydownInputs> = {
  numberOfPoints: 1,
  rateReductionPerPoint: 0.25, // 0.25% reduction per point
  isRefinance: false,
  expectedOwnershipYears: 7,
  marginalTaxRate: 0.24,
};

/**
 * Common points options for quick selection
 */
export const POINTS_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3] as const;
