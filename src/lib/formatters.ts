/**
 * Formatting utilities for currency, percentages, and dates
 */

interface FormatCurrencyOptions {
  compact?: boolean;
  decimals?: number;
  showSign?: boolean;
}

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  const { compact = false, decimals = 0, showSign = false } = options;

  if (compact) {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) {
      return `${showSign && amount > 0 ? '+' : ''}$${(amount / 1000000).toFixed(1)}M`;
    }
    if (absAmount >= 1000) {
      return `${showSign && amount > 0 ? '+' : ''}$${(amount / 1000).toFixed(0)}K`;
    }
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount));

  if (amount < 0) {
    return `-${formatted}`;
  }
  if (showSign && amount > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

/**
 * Format a number as a percentage
 * @param value - Value as decimal (0.065) or percentage (6.5) depending on isDecimal
 * @param decimals - Number of decimal places
 * @param isDecimal - If true, value is treated as decimal (0.065 = 6.5%)
 */
export function formatPercent(
  value: number,
  decimals: number = 2,
  isDecimal: boolean = false
): string {
  const percentValue = isDecimal ? value * 100 : value;
  return `${percentValue.toFixed(decimals)}%`;
}

/**
 * Format months as a human-readable duration
 */
export function formatMonthsDuration(months: number): string {
  if (months === Infinity || months < 0) return 'Never';
  if (months === 0) return '0 months';

  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);

  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }
  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  return `${years}y ${remainingMonths}m`;
}

/**
 * Format a date as MM/YYYY
 */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a number with commas
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Parse a currency string back to a number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse a percentage string back to a number (returns the percentage value, not decimal)
 */
export function parsePercent(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
