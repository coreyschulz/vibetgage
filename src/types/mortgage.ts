/**
 * Core mortgage input parameters
 */
export interface MortgageInputs {
  homePrice: number;
  downPayment: number;
  downPaymentPercent: number;
  loanAmount: number;
  interestRate: number; // Annual rate as percentage (e.g., 6.5 for 6.5%)
  loanTermMonths: number;
  propertyTaxRate: number; // Annual as percentage (e.g., 1.2 for 1.2%)
  homeInsurance: number; // Annual amount in dollars
  hoaFees: number; // Monthly HOA fees
  pmiRate: number; // Annual PMI rate as percentage
  startDate: Date;
}

/**
 * Calculated mortgage results
 */
export interface MortgageResults {
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  monthlyPMI: number;
  totalMonthlyPayment: number;
  totalInterestPaid: number;
  totalCostOfLoan: number;
  loanToValueRatio: number;
  pmiDropOffMonth: number | null; // Month when PMI drops off (at 78% LTV)
  totalPMIPaid: number;
}

/**
 * Breakdown of a single monthly payment
 */
export interface PaymentBreakdown {
  principal: number;
  interest: number;
  taxes: number;
  insurance: number;
  hoa: number;
  pmi: number;
  total: number;
}

/**
 * Default values for mortgage calculator
 */
export const DEFAULT_MORTGAGE_INPUTS: MortgageInputs = {
  homePrice: 400000,
  downPayment: 80000,
  downPaymentPercent: 20,
  loanAmount: 320000,
  interestRate: 6.5,
  loanTermMonths: 360, // 30 years
  propertyTaxRate: 1.2,
  homeInsurance: 1800,
  hoaFees: 0,
  pmiRate: 0.5,
  startDate: new Date(),
};

/**
 * Common loan term options
 */
export const LOAN_TERM_OPTIONS = [
  { label: '15 years', months: 180 },
  { label: '20 years', months: 240 },
  { label: '30 years', months: 360 },
] as const;
