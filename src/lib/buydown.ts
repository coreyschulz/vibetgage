/**
 * Rate buydown (discount points) calculation engine
 */

import type { BuydownInputs, BuydownScenario, BuydownComparison } from '@/types/buydown';
import { calculateMonthlyPayment, calculateTotalInterest } from './mortgage';

/**
 * Calculate points cost in dollars
 * 1 point = 1% of loan amount
 */
export function calculatePointsCost(
  loanAmount: number,
  numberOfPoints: number
): number {
  return loanAmount * (numberOfPoints / 100);
}

/**
 * Calculate bought-down interest rate
 */
export function calculateBoughtDownRate(
  baseRate: number,
  numberOfPoints: number,
  rateReductionPerPoint: number = 0.25
): number {
  const reduction = numberOfPoints * rateReductionPerPoint;
  return Math.max(0, baseRate - reduction);
}

/**
 * Calculate break-even period in months
 */
export function calculateBreakEvenMonths(
  pointsCost: number,
  monthlySavings: number
): number {
  if (monthlySavings <= 0) {
    return Infinity;
  }
  return pointsCost / monthlySavings;
}

/**
 * Calculate tax-deductible amount for points
 * - Purchase loans: fully deductible in year of purchase
 * - Refinance: must be amortized over loan term
 */
export function calculatePointsTaxDeduction(
  pointsCost: number,
  isRefinance: boolean,
  loanTermYears: number
): {
  firstYearDeduction: number;
  totalDeduction: number;
  deductionPerYear: number;
} {
  if (!isRefinance) {
    // Purchase: fully deductible in year 1
    return {
      firstYearDeduction: pointsCost,
      totalDeduction: pointsCost,
      deductionPerYear: pointsCost, // All in year 1
    };
  }

  // Refinance: amortize over loan term
  const deductionPerYear = pointsCost / loanTermYears;
  return {
    firstYearDeduction: deductionPerYear,
    totalDeduction: pointsCost,
    deductionPerYear,
  };
}

/**
 * Calculate effective cost of points after tax benefit
 */
export function calculateEffectivePointsCost(
  pointsCost: number,
  taxDeductibleAmount: number,
  marginalTaxRate: number
): number {
  const taxSavings = taxDeductibleAmount * marginalTaxRate;
  return pointsCost - taxSavings;
}

/**
 * Build a complete buydown scenario with all calculations
 */
export function buildBuydownScenario(inputs: BuydownInputs): BuydownScenario {
  const {
    loanAmount,
    baseInterestRate,
    loanTermMonths,
    numberOfPoints,
    rateReductionPerPoint,
    isRefinance,
    marginalTaxRate,
  } = inputs;

  // Calculate points cost
  const pointsCostDollars = calculatePointsCost(loanAmount, numberOfPoints);
  const pointsCostPercent = numberOfPoints;

  // Calculate rates
  const boughtDownRate = calculateBoughtDownRate(
    baseInterestRate,
    numberOfPoints,
    rateReductionPerPoint
  );
  const rateReduction = baseInterestRate - boughtDownRate;

  // Calculate monthly payments
  const originalMonthlyPayment = calculateMonthlyPayment(
    loanAmount,
    baseInterestRate,
    loanTermMonths
  );
  const boughtDownMonthlyPayment = calculateMonthlyPayment(
    loanAmount,
    boughtDownRate,
    loanTermMonths
  );
  const monthlySavings = originalMonthlyPayment - boughtDownMonthlyPayment;

  // Break-even analysis
  const breakEvenMonths = calculateBreakEvenMonths(pointsCostDollars, monthlySavings);
  const breakEvenYears = breakEvenMonths / 12;

  // Total cost comparison
  const totalInterestWithoutPoints = calculateTotalInterest(
    loanAmount,
    originalMonthlyPayment,
    loanTermMonths
  );
  const totalInterestWithPoints = calculateTotalInterest(
    loanAmount,
    boughtDownMonthlyPayment,
    loanTermMonths
  );
  const interestSavings = totalInterestWithoutPoints - totalInterestWithPoints;

  const totalCostWithoutPoints = loanAmount + totalInterestWithoutPoints;
  const totalCostWithPoints = loanAmount + totalInterestWithPoints + pointsCostDollars;
  const netSavingsOverLife = totalCostWithoutPoints - totalCostWithPoints;

  // Tax implications
  const loanTermYears = loanTermMonths / 12;
  const { firstYearDeduction } = calculatePointsTaxDeduction(
    pointsCostDollars,
    isRefinance,
    loanTermYears
  );
  const taxDeductibleAmount = firstYearDeduction;
  const effectiveCostAfterTax = calculateEffectivePointsCost(
    pointsCostDollars,
    taxDeductibleAmount,
    marginalTaxRate
  );
  const adjustedBreakEvenMonths = calculateBreakEvenMonths(
    effectiveCostAfterTax,
    monthlySavings
  );

  return {
    numberOfPoints,
    pointsCostDollars,
    pointsCostPercent,
    originalRate: baseInterestRate,
    boughtDownRate,
    rateReduction,
    originalMonthlyPayment,
    boughtDownMonthlyPayment,
    monthlySavings,
    breakEvenMonths,
    breakEvenYears,
    totalInterestWithoutPoints,
    totalInterestWithPoints,
    interestSavings,
    totalCostWithoutPoints,
    totalCostWithPoints,
    netSavingsOverLife,
    taxDeductibleAmount,
    effectiveCostAfterTax,
    adjustedBreakEvenMonths,
  };
}

/**
 * Build comparison across multiple point scenarios
 */
export function buildBuydownComparison(
  baseInputs: Omit<BuydownInputs, 'numberOfPoints'>,
  pointsOptions: number[] = [0, 0.5, 1, 1.5, 2, 2.5, 3]
): BuydownComparison {
  const scenarios = pointsOptions.map((points) =>
    buildBuydownScenario({
      ...baseInputs,
      numberOfPoints: points,
    })
  );

  // Find optimal scenario based on expected ownership
  const { expectedOwnershipYears } = baseInputs;
  const optimalScenario = findOptimalScenario(
    scenarios,
    expectedOwnershipYears
  );

  const recommendation = generateRecommendation(
    optimalScenario,
    expectedOwnershipYears
  );

  return {
    scenarios,
    optimalScenario,
    recommendation,
  };
}

/**
 * Find the optimal scenario for a given ownership duration
 */
export function findOptimalScenario(
  scenarios: BuydownScenario[],
  ownershipYears: number
): BuydownScenario {
  const ownershipMonths = ownershipYears * 12;
  let bestScenario = scenarios[0];
  let bestNetValue = -Infinity;

  for (const scenario of scenarios) {
    // Calculate net value at this duration
    // Net value = (monthly savings × months owned) - points cost
    const savingsAtDuration = scenario.monthlySavings * ownershipMonths;
    const netValue = savingsAtDuration - scenario.pointsCostDollars;

    if (netValue > bestNetValue) {
      bestNetValue = netValue;
      bestScenario = scenario;
    }
  }

  return bestScenario;
}

/**
 * Generate a recommendation string based on the analysis
 */
export function generateRecommendation(
  optimalScenario: BuydownScenario,
  ownershipYears: number
): string {
  if (optimalScenario.numberOfPoints === 0) {
    return `Based on your ${ownershipYears}-year ownership plan, paying no points is optimal. ` +
      `The break-even period for buying points exceeds your expected stay.`;
  }

  const breakEvenYears = optimalScenario.breakEvenYears;
  const yearsOfSavings = ownershipYears - breakEvenYears;
  const projectedSavings = optimalScenario.monthlySavings * yearsOfSavings * 12;

  return `Buying ${optimalScenario.numberOfPoints} point${optimalScenario.numberOfPoints !== 1 ? 's' : ''} ` +
    `is optimal for your ${ownershipYears}-year plan. You'll break even in ` +
    `${breakEvenYears.toFixed(1)} years and save approximately $${Math.round(projectedSavings).toLocaleString()} ` +
    `beyond that.`;
}

/**
 * Calculate net value at a specific point in time
 */
export function calculateNetValueAtMonth(
  scenario: BuydownScenario,
  month: number
): number {
  return scenario.monthlySavings * month - scenario.pointsCostDollars;
}

/**
 * Get chart data for comparing scenarios over time
 */
export function getScenarioChartData(
  scenarios: BuydownScenario[],
  maxYears: number = 30
): Array<{ year: number; [key: string]: number }> {
  const data: Array<{ year: number; [key: string]: number }> = [];

  for (let year = 0; year <= maxYears; year++) {
    const months = year * 12;
    const dataPoint: { year: number; [key: string]: number } = { year };

    for (const scenario of scenarios) {
      const points = scenario.numberOfPoints;
      const cumulativeSavings = calculateNetValueAtMonth(scenario, months);
      dataPoint[`${points} points`] = cumulativeSavings;
    }

    data.push(dataPoint);
  }

  return data;
}
