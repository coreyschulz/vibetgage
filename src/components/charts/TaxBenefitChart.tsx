import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts';
import type { YearlyTaxBenefit } from '@/types/tax';
import { formatCurrency } from '@/lib/formatters';

interface TaxBenefitChartProps {
  yearlyData: YearlyTaxBenefit[];
  breakEvenYear: number | null;
}

export function TaxBenefitChart({ yearlyData, breakEvenYear }: TaxBenefitChartProps) {
  const data = yearlyData.map((year) => ({
    year: year.year,
    calendarYear: year.calendarYear,
    grossInterest: year.interestPaid,
    taxSavings: year.totalTaxSavings,
    netInterest: year.interestPaid - year.totalTaxSavings,
    itemizedDeductions: year.totalItemizedDeductions,
    standardDeduction: year.standardDeduction,
    shouldItemize: year.shouldItemize,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
            labelFormatter={(year) => `Year ${year}`}
          />
          <Legend />
          {breakEvenYear && (
            <ReferenceLine
              x={breakEvenYear}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: 'Stop Itemizing', position: 'top', fontSize: 11 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="grossInterest"
            stroke="#ef4444"
            fill="#fee2e2"
            name="Gross Interest"
          />
          <Area
            type="monotone"
            dataKey="taxSavings"
            stroke="#22c55e"
            fill="#dcfce7"
            name="Tax Savings"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ItemizationComparisonChartProps {
  yearlyData: YearlyTaxBenefit[];
}

export function ItemizationComparisonChart({ yearlyData }: ItemizationComparisonChartProps) {
  const data = yearlyData.map((year) => ({
    year: year.year,
    itemized: year.totalItemizedDeductions,
    standard: year.standardDeduction,
    benefit: Math.max(0, year.totalItemizedDeductions - year.standardDeduction),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
            labelFormatter={(year) => `Year ${year}`}
          />
          <Legend />
          <Bar dataKey="itemized" fill="#3b82f6" name="Itemized Deductions" />
          <Bar dataKey="standard" fill="#9ca3af" name="Standard Deduction" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
