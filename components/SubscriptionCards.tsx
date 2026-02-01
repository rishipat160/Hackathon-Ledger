'use client';

import { SubscriptionPattern } from '@/lib/subscriptions';

interface SubscriptionCardsProps {
  subscriptions: SubscriptionPattern[];
}

export default function SubscriptionCards({ subscriptions }: SubscriptionCardsProps) {
  const totalMonthly = subscriptions.reduce((sum, sub) => 
    sum + (sub.frequency === 'monthly' ? sub.amount : sub.amount / 12), 0
  );

  const unusedSubs = subscriptions.filter(sub => {
    const daysSinceLastCharge = (Date.now() - new Date(sub.lastCharge).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastCharge > 30;
  });

  return (
    <div className="bg-ledger-card p-6 rounded-xl border border-ledger-border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Subscriptions</h3>
          <p className="text-sm text-ledger-text-secondary">
            {subscriptions.length} active • ${totalMonthly.toFixed(2)}/month
          </p>
        </div>
        {unusedSubs.length > 0 && (
          <div className="bg-ledger-yellow/20 text-ledger-yellow px-3 py-1 rounded-full text-xs font-medium">
            {unusedSubs.length} unused
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {subscriptions.map((sub, index) => {
          const isUnused = unusedSubs.includes(sub);
          
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                isUnused ? 'border-ledger-yellow/30 bg-ledger-yellow/5' : 'border-ledger-border bg-ledger-dark'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="font-medium">{sub.merchantName}</div>
                  <div className="text-xs text-ledger-text-secondary">
                    {sub.frequency} • Last charge: {new Date(sub.lastCharge).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${sub.amount.toFixed(2)}</div>
                  <div className="text-xs text-ledger-text-secondary">
                    ${sub.estimatedAnnualCost.toFixed(0)}/year
                  </div>
                </div>
              </div>
              {sub.driftScore > 15 && (
                <div className="text-xs text-ledger-yellow">
                  High price variation ({sub.driftScore.toFixed(0)}%)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
