/**
 * Default values used throughout the application
 */

export const DEFAULT_VALUES = {
  // Mortgage defaults
  homePrice: 400000,
  downPaymentPercent: 20,
  interestRate: 6.5,
  loanTermYears: 30,
  propertyTaxRate: 1.2,
  homeInsurance: 1800,
  pmiRate: 0.5,

  // Buydown defaults
  rateReductionPerPoint: 0.25, // 0.25% reduction per point
  expectedOwnershipYears: 7,

  // Tax defaults
  marginalTaxRate: 0.24,
  filingStatus: 'married_filing_jointly' as const,
  stateTaxRate: 0.05,
  stateAndLocalTaxes: 15000,
  charitableContributions: 2000,
} as const;
