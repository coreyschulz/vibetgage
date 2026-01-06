/**
 * Tax benefit calculation engine
 * Calculates the true cost of a mortgage after tax deductions
 */

import type {
  TaxProfile,
  YearlyTaxBenefit,
  TaxBenefitSummary,
  ItemizationComparison,
} from '@/types/tax';
import type { AmortizationSchedule } from '@/types/amortization';
import {
  getTaxYearConfig,
  getMortgageDeductionLimit,
  getMarginalTaxRate,
} from '@/constants/taxRules';
import { generateYearlySummary } from './amortization';

/**
 * Calculate deductible interest considering loan limits
 * For loans over $750K (post-2017), only proportional interest is deductible
 */
export function calculateDeductibleInterest(
  interestPaid: number,
  loanAmount: number,
  loanLimit: number
): number {
  if (loanAmount <= loanLimit) {
    return interestPaid;
  }

  // Pro-rate based on proportion of debt that qualifies
  const qualifyingRatio = loanLimit / loanAmount;
  return interestPaid * qualifyingRatio;
}

/**
 * Calculate SALT deduction with cap applied
 */
export function calculateSaltDeduction(
  stateAndLocalTaxes: number,
  saltCap: number
): number {
  return Math.min(stateAndLocalTaxes, saltCap);
}

/**
 * Calculate total itemized deductions for a given year
 */
export function calculateTotalItemizedDeductions(
  deductibleInterest: number,
  stateAndLocalTaxes: number,
  charitableContributions: number,
  otherDeductions: number,
  saltCap: number
): { total: number; breakdown: ItemizationComparison } {
  const cappedSalt = calculateSaltDeduction(stateAndLocalTaxes, saltCap);

  const total = deductibleInterest + cappedSalt + charitableContributions + otherDeductions;

  const breakdown: ItemizationComparison = {
    standardDeduction: 0, // Will be set later
    itemizedTotal: total,
    mortgageInterest: deductibleInterest,
    saltDeduction: cappedSalt,
    charitableContributions,
    otherDeductions,
    difference: 0, // Will be calculated later
    recommendation: 'standard',
  };

  return { total, breakdown };
}

/**
 * Compare itemizing vs standard deduction
 */
export function compareDeductionMethods(
  itemizedTotal: number,
  standardDeduction: number,
  breakdown: Omit<ItemizationComparison, 'standardDeduction' | 'difference' | 'recommendation'>
): ItemizationComparison {
  const difference = itemizedTotal - standardDeduction;

  return {
    ...breakdown,
    standardDeduction,
    itemizedTotal,
    difference,
    recommendation: difference > 0 ? 'itemize' : 'standard',
  };
}

/**
 * Calculate tax savings from deduction
 * Only counts savings ABOVE standard deduction
 */
export function calculateTaxSavings(
  itemizedTotal: number,
  standardDeduction: number,
  marginalRate: number
): number {
  const benefit = Math.max(0, itemizedTotal - standardDeduction);
  return benefit * marginalRate;
}

/**
 * Calculate effective interest rate after tax benefits
 */
export function calculateEffectiveRate(
  grossInterest: number,
  taxSavings: number,
  averageBalance: number
): number {
  if (averageBalance <= 0) return 0;
  const netInterest = grossInterest - taxSavings;
  return (netInterest / averageBalance) * 100;
}

/**
 * Main function: Calculate complete tax benefit analysis
 */
export function calculateTaxBenefits(
  schedule: AmortizationSchedule,
  loanAmount: number,
  profile: TaxProfile
): TaxBenefitSummary {
  const yearlySummaries = generateYearlySummary(schedule);
  const loanLimit = getMortgageDeductionLimit(profile.mortgageOriginationDate);

  const yearlyBreakdown: YearlyTaxBenefit[] = [];
  let breakEvenYear: number | null = null;
  let yearsOfItemization = 0;

  for (let i = 0; i < yearlySummaries.length; i++) {
    const yearSummary = yearlySummaries[i];
    const taxYear = yearSummary.calendarYear;
    const taxConfig = getTaxYearConfig(taxYear);

    // Calculate deductible interest (considering loan limit)
    const deductibleInterest = calculateDeductibleInterest(
      yearSummary.interestPaid,
      loanAmount,
      loanLimit
    );

    // Get marginal rate
    const marginalRate = profile.marginalTaxRateOverride ??
      getMarginalTaxRate(profile.annualIncome, profile.filingStatus, taxYear);

    // Calculate total itemized deductions
    const { total: itemizedTotal } = calculateTotalItemizedDeductions(
      deductibleInterest,
      profile.stateAndLocalTaxes,
      profile.charitableContributions,
      profile.otherItemizedDeductions,
      taxConfig.saltCap
    );

    // Get standard deduction
    const standardDeduction = taxConfig.standardDeductions[profile.filingStatus];

    // Determine if itemizing makes sense
    const shouldItemize = itemizedTotal > standardDeduction;
    const itemizationBenefit = Math.max(0, itemizedTotal - standardDeduction);

    // Calculate tax savings (only the amount above standard deduction)
    const federalTaxSavings = calculateTaxSavings(
      itemizedTotal,
      standardDeduction,
      marginalRate
    );

    // State tax savings on mortgage interest (most states allow full deduction)
    const stateTaxSavings = shouldItemize
      ? deductibleInterest * profile.stateTaxRate
      : 0;

    const totalTaxSavings = federalTaxSavings + stateTaxSavings;

    // Track itemization
    if (shouldItemize) {
      yearsOfItemization++;
    } else if (breakEvenYear === null && yearsOfItemization > 0) {
      breakEvenYear = i + 1;
    }

    // Calculate effective costs
    const netCost = yearSummary.totalPaid - totalTaxSavings;

    // Calculate average balance for effective rate
    const startBalance = i === 0
      ? loanAmount
      : yearlySummaries[i - 1].endingBalance;
    const avgBalance = (startBalance + yearSummary.endingBalance) / 2;

    // Count months in this year (handle partial first/last years)
    const paymentsInYear = schedule.payments.filter(
      (p) => p.paymentDate.getFullYear() === taxYear
    ).length;

    yearlyBreakdown.push({
      year: yearSummary.year,
      calendarYear: taxYear,
      interestPaid: yearSummary.interestPaid,
      deductibleInterest,
      totalItemizedDeductions: itemizedTotal,
      standardDeduction,
      shouldItemize,
      itemizationBenefit,
      marginalTaxRate: marginalRate,
      federalTaxSavings,
      stateTaxSavings,
      totalTaxSavings,
      grossPayments: yearSummary.totalPaid,
      netCostAfterTaxBenefit: netCost,
      effectiveMonthlyPayment: paymentsInYear > 0 ? netCost / paymentsInYear : 0,
      effectiveInterestRate: calculateEffectiveRate(
        yearSummary.interestPaid,
        shouldItemize ? federalTaxSavings : 0,
        avgBalance
      ),
    });
  }

  // Calculate summary metrics
  const totalInterestPaid = yearlyBreakdown.reduce(
    (sum, y) => sum + y.interestPaid,
    0
  );
  const totalTaxSavings = yearlyBreakdown.reduce(
    (sum, y) => sum + y.totalTaxSavings,
    0
  );

  // Calculate overall effective rate
  const overallEffectiveRate = calculateOverallEffectiveRate(
    yearlyBreakdown,
    loanAmount
  );

  return {
    yearlyBreakdown,
    totalInterestPaid,
    totalTaxSavings,
    totalNetInterestCost: totalInterestPaid - totalTaxSavings,
    breakEvenYear,
    yearsOfItemization,
    averageYearlyTaxSavings: yearlyBreakdown.length > 0
      ? totalTaxSavings / yearlyBreakdown.length
      : 0,
    overallEffectiveRate,
    firstYearEffectiveRate: yearlyBreakdown[0]?.effectiveInterestRate || 0,
  };
}

/**
 * Calculate overall effective interest rate across the loan
 */
function calculateOverallEffectiveRate(
  yearlyBreakdown: YearlyTaxBenefit[],
  loanAmount: number
): number {
  if (yearlyBreakdown.length === 0) return 0;

  const totalInterest = yearlyBreakdown.reduce((sum, y) => sum + y.interestPaid, 0);
  const totalSavings = yearlyBreakdown.reduce((sum, y) => sum + y.totalTaxSavings, 0);
  const netInterest = totalInterest - totalSavings;

  // Average balance over loan life (simplified approximation)
  const avgBalance = loanAmount / 2;
  const years = yearlyBreakdown.length;

  return years > 0 ? (netInterest / avgBalance / years) * 100 : 0;
}

/**
 * Get itemization comparison for a specific year
 */
export function getItemizationComparison(
  taxBenefits: TaxBenefitSummary,
  year: number
): ItemizationComparison | null {
  const yearData = taxBenefits.yearlyBreakdown.find((y) => y.year === year);
  if (!yearData) return null;

  return {
    standardDeduction: yearData.standardDeduction,
    itemizedTotal: yearData.totalItemizedDeductions,
    mortgageInterest: yearData.deductibleInterest,
    saltDeduction: 0,
    charitableContributions: 0,
    otherDeductions: 0,
    difference: yearData.itemizationBenefit,
    recommendation: yearData.shouldItemize ? 'itemize' : 'standard',
  };
}
