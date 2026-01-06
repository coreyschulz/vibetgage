/**
 * Filing status for tax calculations
 */
export type FilingStatus =
  | 'single'
  | 'married_filing_jointly'
  | 'married_filing_separately'
  | 'head_of_household';

/**
 * Tax bracket definition
 */
export interface TaxBracket {
  min: number;
  max: number | null; // null means no upper limit
  rate: number; // As decimal (e.g., 0.24 for 24%)
}

/**
 * Tax year configuration
 */
export interface TaxYearConfig {
  year: number;
  standardDeductions: Record<FilingStatus, number>;
  mortgageDebtLimit: number;
  saltCap: number;
  brackets: Record<FilingStatus, TaxBracket[]>;
}

/**
 * User's tax profile for calculations
 */
export interface TaxProfile {
  filingStatus: FilingStatus;
  annualIncome: number;
  marginalTaxRateOverride?: number; // Optional manual override
  stateTaxRate: number; // State income tax rate as decimal
  stateAndLocalTaxes: number; // Total SALT (property tax + state income tax)
  charitableContributions: number;
  otherItemizedDeductions: number;
  mortgageOriginationDate: Date; // Affects $750K vs $1M limit
}

/**
 * Results for a single year's tax benefit analysis
 */
export interface YearlyTaxBenefit {
  year: number;
  calendarYear: number;

  // Interest analysis
  interestPaid: number;
  deductibleInterest: number; // After loan limit adjustment

  // Itemization breakdown
  totalItemizedDeductions: number;
  standardDeduction: number;
  shouldItemize: boolean;
  itemizationBenefit: number; // How much more than standard deduction

  // Tax savings
  marginalTaxRate: number;
  federalTaxSavings: number;
  stateTaxSavings: number;
  totalTaxSavings: number;

  // Effective cost
  grossPayments: number;
  netCostAfterTaxBenefit: number;
  effectiveMonthlyPayment: number;
  effectiveInterestRate: number;
}

/**
 * Summary of all tax benefits over loan life
 */
export interface TaxBenefitSummary {
  yearlyBreakdown: YearlyTaxBenefit[];

  // Lifetime totals
  totalInterestPaid: number;
  totalTaxSavings: number;
  totalNetInterestCost: number;

  // Key metrics
  breakEvenYear: number | null; // When itemizing stops making sense
  yearsOfItemization: number;
  averageYearlyTaxSavings: number;

  // Effective rates
  overallEffectiveRate: number;
  firstYearEffectiveRate: number;
}

/**
 * Comparison of itemized vs standard deduction
 */
export interface ItemizationComparison {
  standardDeduction: number;
  itemizedTotal: number;
  mortgageInterest: number;
  saltDeduction: number; // After cap
  charitableContributions: number;
  otherDeductions: number;
  difference: number;
  recommendation: 'itemize' | 'standard';
}

/**
 * Default tax profile values
 */
export const DEFAULT_TAX_PROFILE: TaxProfile = {
  filingStatus: 'married_filing_jointly',
  annualIncome: 150000,
  stateTaxRate: 0.05,
  stateAndLocalTaxes: 15000,
  charitableContributions: 2000,
  otherItemizedDeductions: 0,
  mortgageOriginationDate: new Date(),
};

/**
 * Filing status display labels
 */
export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  married_filing_jointly: 'Married Filing Jointly',
  married_filing_separately: 'Married Filing Separately',
  head_of_household: 'Head of Household',
};
