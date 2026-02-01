'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryData {
  category: string;
  total: number;
  percentage: number;
}

interface SpendingBreakdownProps {
  periodData: {
    '3M': CategoryData[];
    '6M': CategoryData[];
    '12M': CategoryData[];
  };
}

const COLORS = [
  '#00FF88', // Green - Food & Dining
  '#00E5FF', // Cyan - Bills & Utilities
  '#B24BF3', // Purple - Entertainment
  '#FFD93D', // Yellow - Shopping
  '#FF4757', // Red - Transportation
  '#8E8E93', // Gray - Other
  '#48484A', // Dark Gray
];

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0];
  // Find the category index to get the matching color
  const categoryIndex = payload[0].payload?.index || 0;
  const color = COLORS[categoryIndex % COLORS.length];
  
  return (
    <div className="bg-ledger-black p-3 rounded-lg border border-ledger-border">
      <p className="font-semibold mb-1" style={{ color }}>
        {data.name}
      </p>
      <p className="text-sm text-ledger-text-primary">
        ${data.value.toFixed(2)}
      </p>
    </div>
  );
};

export default function SpendingBreakdown({ periodData }: SpendingBreakdownProps) {
  const [period, setPeriod] = useState<'3M' | '6M' | '12M'>('12M');
  
  // Get pre-calculated data for selected period
  const categories = periodData[period];
  
  const chartData = categories.map((cat, index) => ({
    name: cat.category,
    value: cat.total,
    percentage: cat.percentage,
    index,
  }));

  return (
    <div className="bg-ledger-card p-6 rounded-xl border border-ledger-border card-hover">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Spending Breakdown</h3>
        <div className="flex gap-2">
          {(['3M', '6M', '12M'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                period === p
                  ? 'bg-ledger-green text-ledger-black'
                  : 'bg-ledger-dark text-ledger-text-secondary hover:text-ledger-text-primary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ percentage }) => `${percentage.toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={false}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Category List */}
      <div className="mt-6 space-y-3">
        {categories.map((cat, index) => (
          <div key={cat.category} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm">{cat.category}</span>
            </div>
            <div className="text-sm font-semibold">${cat.total.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
