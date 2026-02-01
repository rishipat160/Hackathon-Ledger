'use client';

import { useCountUp } from '@/lib/hooks/useCountUp';

interface HeroStatsProps {
  balance: number;
  income: number;
  spent: number;
}

export default function HeroStats({ balance, income, spent }: HeroStatsProps) {
  const animatedBalance = useCountUp(Math.round(balance));
  const animatedIncome = useCountUp(Math.round(income));
  const animatedSpent = useCountUp(Math.round(spent));

  return (
    <div className="bg-gradient-to-br from-ledger-dark via-ledger-card to-ledger-dark p-8 rounded-2xl border border-ledger-border mb-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Current Balance */}
        <div className="text-center">
          <div className="text-ledger-text-secondary text-sm mb-2">Current Balance</div>
          <div className="text-4xl font-bold text-ledger-text-primary animate-count-up">
            ${animatedBalance.toLocaleString()}
          </div>
        </div>

        {/* Total Income */}
        <div className="text-center">
          <div className="text-ledger-text-secondary text-sm mb-2">Total Income</div>
          <div className="text-4xl font-bold text-ledger-green animate-count-up">
            ${animatedIncome.toLocaleString()}
          </div>
        </div>

        {/* Spent */}
        <div className="text-center">
          <div className="text-ledger-text-secondary text-sm mb-2">Total Spent</div>
          <div className="text-4xl font-bold text-ledger-red animate-count-up">
            ${animatedSpent.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
