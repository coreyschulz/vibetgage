import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { BuydownScenario } from '@/types/buydown';
import { formatCurrency } from '@/lib/formatters';
import { getScenarioChartData } from '@/lib/buydown';

interface BuydownChartProps {
  scenarios: BuydownScenario[];
  expectedOwnershipYears: number;
  highlightedPoints?: number;
}

const COLORS = ['#6b7280', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function BuydownChart({
  scenarios,
  expectedOwnershipYears,
  highlightedPoints,
}: BuydownChartProps) {
  const data = getScenarioChartData(scenarios, Math.max(30, expectedOwnershipYears + 5));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            label={{ value: 'Years', position: 'bottom', offset: -5 }}
          />
          <YAxis
            tickFormatter={(value) =>
              value >= 0 ? `$${(value / 1000).toFixed(0)}k` : `-$${(Math.abs(value) / 1000).toFixed(0)}k`
            }
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name,
            ]}
            labelFormatter={(year) => `Year ${year}`}
          />
          <Legend />
          <ReferenceLine
            x={expectedOwnershipYears}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{ value: 'Your Stay', position: 'top', fontSize: 11 }}
          />
          <ReferenceLine y={0} stroke="#374151" />
          {scenarios.map((scenario, index) => {
            const points = scenario.numberOfPoints;
            const isHighlighted = points === highlightedPoints;

            return (
              <Line
                key={points}
                type="monotone"
                dataKey={`${points} points`}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={isHighlighted ? 3 : 1.5}
                dot={false}
                opacity={highlightedPoints !== undefined ? (isHighlighted ? 1 : 0.4) : 1}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
