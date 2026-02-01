'use client';

interface GoalProgressProps {
  goalType: string;
  current: number;
  target: number;
}

export default function GoalProgress({ goalType, current, target }: GoalProgressProps) {
  const percentage = Math.min(100, (current / target) * 100);
  const remaining = Math.max(0, target - current);

  return (
    <div className="bg-ledger-card p-6 rounded-xl border border-ledger-border card-hover">
      <h3 className="text-lg font-semibold mb-4">Savings Goal</h3>
      
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#1A1A1A"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#B24BF3"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-ledger-purple">
              {percentage.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-sm text-ledger-text-secondary mb-1">{goalType}</div>
        <div className="text-2xl font-bold">${current.toLocaleString()}</div>
        <div className="text-sm text-ledger-text-secondary">
          of ${target.toLocaleString()}
        </div>
      </div>

      {percentage < 100 && (
        <div className="text-center text-sm text-ledger-text-secondary">
          ${remaining.toLocaleString()} to go
        </div>
      )}
    </div>
  );
}
