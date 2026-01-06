/**
 * Core mortgage calculation functions
 */

import type { MortgageInputs, MortgageResults, PaymentBreakdown } from '@/types/mortgage';

/**
 * Calculate monthly mortgage payment (Principal & Interest only)
 * Formula: M = P × [r(1+r)^n] / [(1+r)^n - 1]
 *
 * @param principal - Loan amount (P)
 * @param annualRate - Annual interest rate as percentage (e.g., 6.5 for 6.5%)
 * @param termMonths - Total number of payments (n)
 * @returns Monthly payment amount (M)
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  // Convert annual rate to monthly decimal
  const monthlyRate = annualRate / 100 / 12;

  // Handle edge case of 0% interest
  if (monthlyRate === 0) {
    return principal / termMonths;
  }

  const factor = Math.pow(1 + monthlyRate, termMonths);
  const payment = principal * (monthlyRate * factor) / (factor - 1);

  return payment;
}

/**
 * Calculate total interest paid over the life of the loan
 */
export function calculateTotalInterest(
  principal: number,
  monthlyPayment: number,
  termMonths: number
): number {
  return monthlyPayment * termMonths - principal;
}

/**
 * Calculate PMI (Private Mortgage Insurance) monthly amount
 * PMI is required when LTV > 80%
 *
 * @param loanAmount - Current loan balance
 * @param homeValue - Home value
 * @param annualPMIRate - Annual PMI rate as percentage (e.g., 0.5 for 0.5%)
 * @returns Monthly PMI amount, or 0 if LTV <= 80%
 */
export function calculateMonthlyPMI(
  loanAmount: number,
  homeValue: number,
  annualPMIRate: number
): number {
  const ltv = loanAmount / homeValue;
  if (ltv <= 0.8) return 0;

  return (loanAmount * (annualPMIRate / 100)) / 12;
}

/**
 * Calculate the month when PMI automatically drops off (at 78% LTV)
 * Returns null if no PMI is required from the start
 */
export function calculatePMIDropOffMonth(
  loanAmount: number,
  homeValue: number,
  monthlyPayment: number,
  annualRate: number
): number | null {
  const initialLTV = loanAmount / homeValue;
  if (initialLTV <= 0.8) return null;

  const targetBalance = homeValue * 0.78;
  const monthlyRate = annualRate / 100 / 12;

  let balance = loanAmount;
  let month = 0;

  while (balance > targetBalance && month < 360) {
    month++;
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
  }

  return month;
}

/**
 * Calculate total PMI paid until it drops off
 */
export function calculateTotalPMI(
  loanAmount: number,
  homeValue: number,
  annualPMIRate: number,
  pmiDropOffMonth: number | null
): number {
  if (pmiDropOffMonth === null) return 0;

  const monthlyPMI = calculateMonthlyPMI(loanAmount, homeValue, annualPMIRate);
  return monthlyPMI * pmiDropOffMonth;
}

/**
 * Calculate Loan-to-Value ratio
 */
export function calculateLTV(loanAmount: number, homeValue: number): number {
  return loanAmount / homeValue;
}

/**
 * Calculate full mortgage results including all components
 */
export function calculateMortgageResults(inputs: MortgageInputs): MortgageResults {
  const monthlyPI = calculateMonthlyPayment(
    inputs.loanAmount,
    inputs.interestRate,
    inputs.loanTermMonths
  );

  const monthlyPropertyTax = (inputs.homePrice * inputs.propertyTaxRate / 100) / 12;
  const monthlyInsurance = inputs.homeInsurance / 12;
  const monthlyHOA = inputs.hoaFees;
  const monthlyPMI = calculateMonthlyPMI(
    inputs.loanAmount,
    inputs.homePrice,
    inputs.pmiRate
  );

  const pmiDropOffMonth = calculatePMIDropOffMonth(
    inputs.loanAmount,
    inputs.homePrice,
    monthlyPI,
    inputs.interestRate
  );

  const totalPMIPaid = calculateTotalPMI(
    inputs.loanAmount,
    inputs.homePrice,
    inputs.pmiRate,
    pmiDropOffMonth
  );

  const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyHOA + monthlyPMI;

  const totalInterest = calculateTotalInterest(
    inputs.loanAmount,
    monthlyPI,
    inputs.loanTermMonths
  );

  return {
    monthlyPrincipalAndInterest: monthlyPI,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyHOA,
    monthlyPMI,
    totalMonthlyPayment,
    totalInterestPaid: totalInterest,
    totalCostOfLoan: inputs.loanAmount + totalInterest,
    loanToValueRatio: calculateLTV(inputs.loanAmount, inputs.homePrice),
    pmiDropOffMonth,
    totalPMIPaid,
  };
}

/**
 * Get breakdown of a monthly payment
 */
export function getPaymentBreakdown(inputs: MortgageInputs): PaymentBreakdown {
  const results = calculateMortgageResults(inputs);

  // For the first payment, calculate principal vs interest split
  const monthlyRate = inputs.interestRate / 100 / 12;
  const firstMonthInterest = inputs.loanAmount * monthlyRate;
  const firstMonthPrincipal = results.monthlyPrincipalAndInterest - firstMonthInterest;

  return {
    principal: firstMonthPrincipal,
    interest: firstMonthInterest,
    taxes: results.monthlyPropertyTax,
    insurance: results.monthlyInsurance,
    hoa: results.monthlyHOA,
    pmi: results.monthlyPMI,
    total: results.totalMonthlyPayment,
  };
}

/**
 * Sync loan amount with home price and down payment
 */
export function syncMortgageInputs(
  inputs: Partial<MortgageInputs>,
  changed: 'homePrice' | 'downPayment' | 'downPaymentPercent'
): Partial<MortgageInputs> {
  const { homePrice = 0, downPayment = 0, downPaymentPercent = 0 } = inputs;

  switch (changed) {
    case 'homePrice':
      return {
        ...inputs,
        downPayment: homePrice * (downPaymentPercent / 100),
        loanAmount: homePrice * (1 - downPaymentPercent / 100),
      };
    case 'downPayment':
      return {
        ...inputs,
        downPaymentPercent: homePrice > 0 ? (downPayment / homePrice) * 100 : 0,
        loanAmount: homePrice - downPayment,
      };
    case 'downPaymentPercent':
      return {
        ...inputs,
        downPayment: homePrice * (downPaymentPercent / 100),
        loanAmount: homePrice * (1 - downPaymentPercent / 100),
      };
    default:
      return inputs;
  }
}
