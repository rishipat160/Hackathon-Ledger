'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TrendData {
  month: string;
  savings: number;
}

interface SavingsTrendProps {
  data: TrendData[];
  goalAmount?: number;
}

export default function SavingsTrend({ data, goalAmount }: SavingsTrendProps) {
  return (
    <div className="bg-ledger-card p-6 rounded-xl border border-ledger-border card-hover">
      <h3 className="text-lg font-semibold mb-6">Savings Trend</h3>
      
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B24BF3" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#B24BF3" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
          <XAxis dataKey="month" stroke="#8E8E93" />
          <YAxis stroke="#8E8E93" />
          <Tooltip 
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Savings']}
            contentStyle={{ 
              backgroundColor: '#111111', 
              border: '1px solid #1A1A1A',
              borderRadius: '8px',
              color: '#FFFFFF'
            }}
          />
          {goalAmount && (
            <ReferenceLine 
              y={goalAmount} 
              stroke="#00FF88" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: `Goal: $${goalAmount.toLocaleString()}`, position: 'right', fill: '#00FF88', fontSize: 12 }}
            />
          )}
          <Line 
            type="monotone" 
            dataKey="savings" 
            stroke="#B24BF3" 
            strokeWidth={3}
            fill="url(#savingsGradient)"
            dot={{ fill: '#B24BF3', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
