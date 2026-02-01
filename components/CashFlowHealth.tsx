'use client';

import { CashFlowHealth as CashFlowHealthType } from '@/lib/analyzer';

interface CashFlowHealthProps {
  health: CashFlowHealthType;
}

export default function CashFlowHealth({ health }: CashFlowHealthProps) {
  const { score, status, message } = health;

  const getColor = () => {
    if (status === 'healthy') return 'ledger-green';
    if (status === 'warning') return 'ledger-yellow';
    return 'ledger-red';
  };

  return (
    <div className="bg-ledger-card p-6 rounded-xl border border-ledger-border">
      <h3 className="text-lg font-semibold mb-4">Cash Flow Health</h3>
      
      <div className="text-center mb-4">
        <div className="text-5xl font-bold mb-2">
          <span className={`text-${getColor()}`}>{Math.round(score)}</span>
          <span className="text-2xl text-ledger-text-secondary">/100</span>
        </div>
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-${getColor()}/20 text-${getColor()}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      <p className="text-sm text-ledger-text-secondary text-center">
        {message}
      </p>
    </div>
  );
}
