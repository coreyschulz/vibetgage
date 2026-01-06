/**
 * Amortization schedule generation and analysis
 */

import type {
  AmortizationPayment,
  AmortizationSchedule,
  YearlySummary,
  FrontLoadedInterestAnalysis,
} from '@/types/amortization';
import { calculateMonthlyPayment } from './mortgage';

/**
 * Generate full amortization schedule
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: Date = new Date()
): AmortizationSchedule {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const monthlyRate = annualRate / 100 / 12;

  let balance = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  const payments: AmortizationPayment[] = [];

  for (let i = 1; i <= termMonths; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;

    balance -= principalPayment;
    cumulativePrincipal += principalPayment;
    cumulativeInterest += interestPayment;

    // Calculate payment date
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + i);

    payments.push({
      paymentNumber: i,
      paymentDate,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      remainingBalance: Math.max(0, balance), // Avoid floating point negatives
      cumulativePrincipal,
      cumulativeInterest,
    });
  }

  return {
    payments,
    totalPrincipal: principal,
    totalInterest: cumulativeInterest,
    totalPayments: monthlyPayment * termMonths,
    monthlyPayment,
  };
}

/**
 * Generate amortization schedule with extra payments
 */
export function generateAmortizationWithExtraPayments(
  principal: number,
  annualRate: number,
  termMonths: number,
  extraMonthly: number = 0,
  extraYearly: number = 0,
  extraYearlyMonth: number = 12, // Which month to apply yearly extra (1-12)
  startDate: Date = new Date()
): AmortizationSchedule {
  const baseMonthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const monthlyRate = annualRate / 100 / 12;

  let balance = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  const payments: AmortizationPayment[] = [];

  let month = 0;
  while (balance > 0.01 && month < termMonths) {
    month++;

    const interestPayment = balance * monthlyRate;
    let principalPayment = baseMonthlyPayment - interestPayment + extraMonthly;

    // Add yearly extra payment in the specified month
    const currentMonth = ((startDate.getMonth() + month - 1) % 12) + 1;
    if (currentMonth === extraYearlyMonth && extraYearly > 0) {
      principalPayment += extraYearly;
    }

    // Don't overpay
    principalPayment = Math.min(principalPayment, balance);
    const totalPayment = interestPayment + principalPayment;

    balance -= principalPayment;
    cumulativePrincipal += principalPayment;
    cumulativeInterest += interestPayment;

    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + month);

    payments.push({
      paymentNumber: month,
      paymentDate,
      payment: totalPayment,
      principal: principalPayment,
      interest: interestPayment,
      remainingBalance: Math.max(0, balance),
      cumulativePrincipal,
      cumulativeInterest,
    });
  }

  return {
    payments,
    totalPrincipal: principal,
    totalInterest: cumulativeInterest,
    totalPayments: payments.reduce((sum, p) => sum + p.payment, 0),
    monthlyPayment: baseMonthlyPayment,
  };
}

/**
 * Aggregate amortization payments into yearly summaries
 */
export function generateYearlySummary(schedule: AmortizationSchedule): YearlySummary[] {
  const yearMap = new Map<number, AmortizationPayment[]>();

  schedule.payments.forEach((payment) => {
    const year = payment.paymentDate.getFullYear();
    if (!yearMap.has(year)) {
      yearMap.set(year, []);
    }
    yearMap.get(year)!.push(payment);
  });

  const summaries: YearlySummary[] = [];
  let yearIndex = 1;

  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a - b);

  for (const calendarYear of sortedYears) {
    const payments = yearMap.get(calendarYear)!;

    const principalPaid = payments.reduce((sum, p) => sum + p.principal, 0);
    const interestPaid = payments.reduce((sum, p) => sum + p.interest, 0);
    const totalPaid = principalPaid + interestPaid;

    summaries.push({
      year: yearIndex++,
      calendarYear,
      principalPaid,
      interestPaid,
      totalPaid,
      endingBalance: payments[payments.length - 1].remainingBalance,
      principalPercent: totalPaid > 0 ? (principalPaid / totalPaid) * 100 : 0,
      interestPercent: totalPaid > 0 ? (interestPaid / totalPaid) * 100 : 0,
    });
  }

  return summaries;
}

/**
 * Analyze front-loaded interest in the amortization schedule
 */
export function analyzeFrontLoadedInterest(
  schedule: AmortizationSchedule
): FrontLoadedInterestAnalysis {
  const midpoint = Math.floor(schedule.payments.length / 2);

  const firstHalfInterest = schedule.payments
    .slice(0, midpoint)
    .reduce((sum, p) => sum + p.interest, 0);

  const secondHalfInterest = schedule.payments
    .slice(midpoint)
    .reduce((sum, p) => sum + p.interest, 0);

  // Get yearly summaries for first/last year interest
  const yearlySummaries = generateYearlySummary(schedule);
  const firstYearInterest = yearlySummaries[0]?.interestPaid || 0;
  const lastYearInterest = yearlySummaries[yearlySummaries.length - 1]?.interestPaid || 0;

  return {
    firstHalfInterest,
    secondHalfInterest,
    ratio: secondHalfInterest > 0 ? firstHalfInterest / secondHalfInterest : Infinity,
    firstYearInterest,
    lastYearInterest,
  };
}

/**
 * Get interest paid for a specific year of the loan
 */
export function getYearlyInterest(
  schedule: AmortizationSchedule,
  year: number
): number {
  const yearlySummaries = generateYearlySummary(schedule);
  return yearlySummaries[year - 1]?.interestPaid || 0;
}

/**
 * Get all yearly interest amounts as an array
 */
export function getAllYearlyInterest(schedule: AmortizationSchedule): number[] {
  const yearlySummaries = generateYearlySummary(schedule);
  return yearlySummaries.map((s) => s.interestPaid);
}

/**
 * Compare two amortization schedules (e.g., with and without extra payments)
 */
export function compareSchedules(
  original: AmortizationSchedule,
  modified: AmortizationSchedule
): {
  monthsSaved: number;
  interestSaved: number;
  totalSaved: number;
} {
  return {
    monthsSaved: original.payments.length - modified.payments.length,
    interestSaved: original.totalInterest - modified.totalInterest,
    totalSaved: original.totalPayments - modified.totalPayments,
  };
}
