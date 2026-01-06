import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { PaymentBreakdown } from '@/types/mortgage';
import { formatCurrency } from '@/lib/formatters';

interface PaymentPieChartProps {
  breakdown: PaymentBreakdown;
}

const COLORS = {
  principal: '#22c55e', // green
  interest: '#f59e0b', // amber
  taxes: '#3b82f6', // blue
  insurance: '#8b5cf6', // purple
  hoa: '#ec4899', // pink
  pmi: '#ef4444', // red
};

export function PaymentPieChart({ breakdown }: PaymentPieChartProps) {
  const data = [
    { name: 'Principal', value: breakdown.principal, color: COLORS.principal },
    { name: 'Interest', value: breakdown.interest, color: COLORS.interest },
    { name: 'Taxes', value: breakdown.taxes, color: COLORS.taxes },
    { name: 'Insurance', value: breakdown.insurance, color: COLORS.insurance },
    ...(breakdown.hoa > 0
      ? [{ name: 'HOA', value: breakdown.hoa, color: COLORS.hoa }]
      : []),
    ...(breakdown.pmi > 0
      ? [{ name: 'PMI', value: breakdown.pmi, color: COLORS.pmi }]
      : []),
  ].filter((d) => d.value > 0);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value, { decimals: 2 })}
          />
          <Legend
            formatter={(value, entry: any) => (
              <span className="text-sm text-gray-600">
                {value}: {formatCurrency(entry.payload.value, { decimals: 0 })}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
