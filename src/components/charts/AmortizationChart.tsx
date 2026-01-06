import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { YearlySummary } from '@/types/amortization';
import { formatCurrency } from '@/lib/formatters';

interface AmortizationChartProps {
  yearlySummaries: YearlySummary[];
  showBalance?: boolean;
}

export function AmortizationChart({ yearlySummaries, showBalance = false }: AmortizationChartProps) {
  // Build cumulative data
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  const data = yearlySummaries.map((summary) => {
    cumulativePrincipal += summary.principalPaid;
    cumulativeInterest += summary.interestPaid;

    return {
      year: summary.year,
      calendarYear: summary.calendarYear,
      principal: cumulativePrincipal,
      interest: cumulativeInterest,
      balance: summary.endingBalance,
      yearlyPrincipal: summary.principalPaid,
      yearlyInterest: summary.interestPaid,
    };
  });

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
            labelFormatter={(year) => `Year ${year}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="principal"
            stackId="1"
            stroke="#22c55e"
            fill="#dcfce7"
            name="Principal Paid"
          />
          <Area
            type="monotone"
            dataKey="interest"
            stackId="1"
            stroke="#f59e0b"
            fill="#fef3c7"
            name="Interest Paid"
          />
          {showBalance && (
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              fill="none"
              strokeDasharray="5 5"
              name="Remaining Balance"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface YearlyBreakdownChartProps {
  yearlySummaries: YearlySummary[];
}

export function YearlyBreakdownChart({ yearlySummaries }: YearlyBreakdownChartProps) {
  const data = yearlySummaries.map((summary) => ({
    year: summary.year,
    principal: summary.principalPaid,
    interest: summary.interestPaid,
    principalPct: summary.principalPercent,
    interestPct: summary.interestPercent,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'principal' ? 'Principal' : 'Interest',
            ]}
            labelFormatter={(year) => `Year ${year}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="principal"
            stackId="1"
            stroke="#22c55e"
            fill="#dcfce7"
            name="Principal"
          />
          <Area
            type="monotone"
            dataKey="interest"
            stackId="1"
            stroke="#f59e0b"
            fill="#fef3c7"
            name="Interest"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
