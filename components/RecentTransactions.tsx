'use client';

import { useState } from 'react';
import { Transaction } from 'plaid';
import { mapPFCToFriendly } from '@/lib/categories';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Filter transactions from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTransactions = transactions.filter(txn => 
    new Date(txn.date) >= thirtyDaysAgo
  );

  const groupedByDate = recentTransactions.reduce((groups, txn) => {
    const date = txn.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(txn);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const getDateLabel = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (date === today) return 'Today';
    if (date === yesterday) return 'Yesterday';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-ledger-card p-6 rounded-xl border border-ledger-border">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <p className="text-xs text-ledger-text-secondary">Last 30 days</p>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sm text-ledger-cyan hover:text-ledger-cyan/80"
        >
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="text-sm text-ledger-text-secondary mb-2">
                {getDateLabel(date)}
              </div>
              <div className="space-y-2">
                {groupedByDate[date].map((txn) => (
                  <div key={txn.transaction_id} className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{txn.name}</div>
                      <div className="text-xs text-ledger-text-secondary">
                        {mapPFCToFriendly((txn as any).personal_finance_category)}
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      txn.amount < 0 ? 'text-ledger-green' : 'text-ledger-text-primary'
                    }`}>
                      {txn.amount < 0 ? '+' : '-'}${Math.abs(txn.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
