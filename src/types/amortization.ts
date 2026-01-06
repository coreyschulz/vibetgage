/**
 * Single payment in the amortization schedule
 */
export interface AmortizationPayment {
  paymentNumber: number;
  paymentDate: Date;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
}

/**
 * Full amortization schedule
 */
export interface AmortizationSchedule {
  payments: AmortizationPayment[];
  totalPrincipal: number;
  totalInterest: number;
  totalPayments: number;
  monthlyPayment: number;
}

/**
 * Yearly summary for amortization display
 */
export interface YearlySummary {
  year: number;
  calendarYear: number;
  principalPaid: number;
  interestPaid: number;
  totalPaid: number;
  endingBalance: number;
  principalPercent: number; // What % of that year's payments went to principal
  interestPercent: number; // What % of that year's payments went to interest
}

/**
 * Analysis of front-loaded interest
 */
export interface FrontLoadedInterestAnalysis {
  firstHalfInterest: number;
  secondHalfInterest: number;
  ratio: number; // How much more interest is paid in first half
  firstYearInterest: number;
  lastYearInterest: number;
}
