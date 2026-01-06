/**
 * 2025 Federal Tax Rules
 * Source: IRS Publication 936 and tax bracket updates
 */

import type { TaxYearConfig, FilingStatus, TaxBracket } from '@/types/tax';

/**
 * 2025 Tax Year Configuration
 */
export const TAX_YEAR_2025: TaxYearConfig = {
  year: 2025,

  // Standard deductions for 2025
  standardDeductions: {
    single: 15000,
    married_filing_jointly: 30000,
    married_filing_separately: 15000,
    head_of_household: 22500,
  },

  // Mortgage interest deduction limit (for loans originated after Dec 15, 2017)
  mortgageDebtLimit: 750000,

  // SALT (State and Local Tax) deduction cap for 2025-2029
  saltCap: 40000,

  // Federal tax brackets by filing status
  brackets: {
    single: [
      { min: 0, max: 11925, rate: 0.10 },
      { min: 11925, max: 48475, rate: 0.12 },
      { min: 48475, max: 103350, rate: 0.22 },
      { min: 103350, max: 197300, rate: 0.24 },
      { min: 197300, max: 250500, rate: 0.32 },
      { min: 250500, max: 626350, rate: 0.35 },
      { min: 626350, max: null, rate: 0.37 },
    ],
    married_filing_jointly: [
      { min: 0, max: 23850, rate: 0.10 },
      { min: 23850, max: 96950, rate: 0.12 },
      { min: 96950, max: 206700, rate: 0.22 },
      { min: 206700, max: 394600, rate: 0.24 },
      { min: 394600, max: 501050, rate: 0.32 },
      { min: 501050, max: 751600, rate: 0.35 },
      { min: 751600, max: null, rate: 0.37 },
    ],
    married_filing_separately: [
      { min: 0, max: 11925, rate: 0.10 },
      { min: 11925, max: 48475, rate: 0.12 },
      { min: 48475, max: 103350, rate: 0.22 },
      { min: 103350, max: 197300, rate: 0.24 },
      { min: 197300, max: 250500, rate: 0.32 },
      { min: 250500, max: 375800, rate: 0.35 },
      { min: 375800, max: null, rate: 0.37 },
    ],
    head_of_household: [
      { min: 0, max: 17000, rate: 0.10 },
      { min: 17000, max: 64850, rate: 0.12 },
      { min: 64850, max: 103350, rate: 0.22 },
      { min: 103350, max: 197300, rate: 0.24 },
      { min: 197300, max: 250500, rate: 0.32 },
      { min: 250500, max: 626350, rate: 0.35 },
      { min: 626350, max: null, rate: 0.37 },
    ],
  },
};

/**
 * Pre-Dec 2017 mortgage debt limit
 */
export const PRE_2017_MORTGAGE_LIMIT = 1000000;

/**
 * Date cutoff for mortgage interest deduction limits
 */
export const MORTGAGE_LIMIT_CUTOFF_DATE = new Date('2017-12-15');

/**
 * Get tax configuration for a specific year
 * For years beyond what we have, apply inflation adjustment
 */
export function getTaxYearConfig(year: number): TaxYearConfig {
  if (year === 2025) {
    return TAX_YEAR_2025;
  }

  // For future years, apply ~2.5% inflation adjustment
  const baseYear = 2025;
  const yearsDiff = year - baseYear;
  const inflationFactor = Math.pow(1.025, yearsDiff);

  const adjustedConfig: TaxYearConfig = {
    year,
    standardDeductions: {
      single: Math.round(TAX_YEAR_2025.standardDeductions.single * inflationFactor / 50) * 50,
      married_filing_jointly: Math.round(TAX_YEAR_2025.standardDeductions.married_filing_jointly * inflationFactor / 50) * 50,
      married_filing_separately: Math.round(TAX_YEAR_2025.standardDeductions.married_filing_separately * inflationFactor / 50) * 50,
      head_of_household: Math.round(TAX_YEAR_2025.standardDeductions.head_of_household * inflationFactor / 50) * 50,
    },
    mortgageDebtLimit: TAX_YEAR_2025.mortgageDebtLimit, // This doesn't change
    saltCap: TAX_YEAR_2025.saltCap, // SALT cap stays the same 2025-2029
    brackets: Object.fromEntries(
      Object.entries(TAX_YEAR_2025.brackets).map(([status, brackets]) => [
        status,
        brackets.map((bracket) => ({
          ...bracket,
          min: Math.round(bracket.min * inflationFactor / 25) * 25,
          max: bracket.max !== null
            ? Math.round(bracket.max * inflationFactor / 25) * 25
            : null,
        })),
      ])
    ) as Record<FilingStatus, TaxBracket[]>,
  };

  return adjustedConfig;
}

/**
 * Get mortgage interest deduction limit based on loan origination date
 */
export function getMortgageDeductionLimit(originationDate: Date): number {
  return originationDate <= MORTGAGE_LIMIT_CUTOFF_DATE
    ? PRE_2017_MORTGAGE_LIMIT
    : TAX_YEAR_2025.mortgageDebtLimit;
}

/**
 * Get marginal tax rate for a given income and filing status
 */
export function getMarginalTaxRate(
  income: number,
  filingStatus: FilingStatus,
  year: number = 2025
): number {
  const config = getTaxYearConfig(year);
  const brackets = config.brackets[filingStatus];

  // Find the bracket that contains this income
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (income >= brackets[i].min) {
      return brackets[i].rate;
    }
  }

  return brackets[0].rate;
}

/**
 * Common marginal tax rates for quick selection
 */
export const COMMON_TAX_RATES = [
  { rate: 0.10, label: '10%' },
  { rate: 0.12, label: '12%' },
  { rate: 0.22, label: '22%' },
  { rate: 0.24, label: '24% (Most common)' },
  { rate: 0.32, label: '32%' },
  { rate: 0.35, label: '35%' },
  { rate: 0.37, label: '37%' },
] as const;
