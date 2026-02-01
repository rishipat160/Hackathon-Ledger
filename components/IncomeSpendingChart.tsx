'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  month: string;
  income: number;
  spending: number;
  spendingByCategory?: Record<string, number>;
  incomeCount?: number;
}

interface IncomeSpendingChartProps {
  data: ChartData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drink': '#00FF88',
  'Groceries': '#00FF88',
  'Dining': '#00E5FF',
  'Entertainment': '#B24BF3',
  'Shopping': '#FFD93D',
  'Transportation': '#FF4757',
  'Bills & Utilities': '#8E8E93',
  'Services': '#00E5FF',
  'Loan Payments': '#B24BF3',
  'Home & Garden': '#FFD93D',
  'Government & Non-Profit': '#48484A',
  'Transfers': '#48484A',
  'Healthcare': '#8E8E93',
  'Personal Care': '#48484A',
  'Fees': '#FF4757',
  'Travel': '#B24BF3',
  'Income': '#00FF88',
  'Other': '#8E8E93',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  
  return (
    <div className="bg-ledger-card p-4 rounded-lg border border-ledger-border shadow-xl min-w-[220px]">
      {/* Income */}
      <div className="mb-3 pb-3 border-b border-ledger-border">
        <p className="font-semibold text-ledger-green">
          Income: ${data.income.toLocaleString()}
        </p>
        <p className="text-xs text-ledger-text-secondary">
          {data.incomeCount || 0} deposit{data.incomeCount !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Spending Breakdown */}
      <div>
        <p className="font-semibold text-ledger-red mb-2">
          Spending: ${data.spending.toLocaleString()}
        </p>
        {data.spendingByCategory && Object.keys(data.spendingByCategory).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(data.spendingByCategory)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 4)
              .map(([cat, amt]) => {
                const pct = ((amt as number) / data.spending * 100).toFixed(0);
                // Use fixed color from global mapping (matches pie chart)
                const color = data.categoryColors?.[cat] || '#8E8E93';
                
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <p className="text-xs text-ledger-text-secondary flex-1">
                      {cat}: {pct}%
                    </p>
                  </div>
                );
              })
            }
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default function IncomeSpendingChart({ data }: IncomeSpendingChartProps) {
  const [period, setPeriod] = useState<'3M' | '6M' | '12M'>('3M');

  const filteredData = data.slice(-(period === '3M' ? 3 : period === '6M' ? 6 : 12));

  return (
    <div className="bg-ledger-card p-6 rounded-xl border border-ledger-border card-hover">
      {/* Period Tabs */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Income vs Spending</h3>
        <div className="flex gap-2">
          {(['3M', '6M', '12M'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
          <XAxis dataKey="month" stroke="#8E8E93" />
          <YAxis stroke="#8E8E93" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="income" fill="#00FF88" radius={[8, 8, 0, 0]} name="Income" />
          <Bar dataKey="spending" fill="#FF4757" radius={[8, 8, 0, 0]} name="Spending" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
