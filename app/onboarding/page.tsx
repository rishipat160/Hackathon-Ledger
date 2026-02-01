'use client';

/**
 * LEDGER - ONBOARDING FLOW
 * 
 * Multi-step profile setup for personalized insights
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'student' | 'freelancer' | 'salaried' | ''>('');
  const [monthlyIncome, setMonthlyIncome] = useState(3000);
  const [goalType, setGoalType] = useState('');
  const [targetAmount, setTargetAmount] = useState(5000);
  const [customGoalName, setCustomGoalName] = useState('');

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          monthlyIncome,
          savingsGoal: {
            type: goalType === 'other' ? customGoalName : goalType,
            targetAmount,
          },
          onboardingComplete: true,
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Onboarding failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-ledger-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 mx-1 rounded ${
                  s <= step ? 'bg-ledger-green' : 'bg-ledger-border'
                }`}
              />
            ))}
          </div>
          <p className="text-ledger-text-secondary text-sm text-center">
            Step {step} of 3
          </p>
        </div>

        {/* Step 1: User Type */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">Welcome to Ledger</h1>
            <p className="text-ledger-text-secondary mb-8">
              Let's personalize your financial insights
            </p>

            <div className="space-y-4">
              {[
                { value: 'student', label: 'Student', desc: 'Building financial habits' },
                { value: 'freelancer', label: 'Freelancer', desc: 'Variable income' },
                { value: 'salaried', label: 'Salaried', desc: 'Regular paycheck' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setUserType(option.value as any)}
                  className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                    userType === option.value
                      ? 'border-ledger-green bg-ledger-card'
                      : 'border-ledger-border bg-ledger-card hover:border-ledger-green/50'
                  }`}
                >
                  <div className="font-semibold text-lg">{option.label}</div>
                  <div className="text-ledger-text-secondary text-sm">{option.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => userType && setStep(2)}
              disabled={!userType}
              className="w-full mt-8 py-4 bg-ledger-green text-ledger-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ledger-green/90 transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Income */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">Monthly Income</h1>
            <p className="text-ledger-text-secondary mb-8">
              This helps us provide better insights (you can adjust later)
            </p>

            <div className="bg-ledger-card p-8 rounded-xl">
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-ledger-green mb-2">
                  ${monthlyIncome.toLocaleString()}
                </div>
                <div className="text-ledger-text-secondary">per month</div>
              </div>

              <input
                type="range"
                min="500"
                max="15000"
                step="100"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full h-2 bg-ledger-border rounded-lg appearance-none cursor-pointer accent-ledger-green"
              />

              <div className="flex justify-between mt-4 text-sm text-ledger-text-secondary">
                <span>$500</span>
                <span>$15,000+</span>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 border border-ledger-border text-ledger-text-primary font-semibold rounded-xl hover:border-ledger-green transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-ledger-green text-ledger-black font-semibold rounded-xl hover:bg-ledger-green/90 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Savings Goal */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">What are you saving for?</h1>
            <p className="text-ledger-text-secondary mb-8">
              Set a goal to stay motivated
            </p>

            <div className="space-y-4 mb-8">
              {[
                { value: 'emergency', label: 'Emergency Fund', amount: 5000 },
                { value: 'travel', label: 'Travel', amount: 3000 },
                { value: 'down_payment', label: 'Down Payment', amount: 10000 },
                { value: 'debt', label: 'Pay Off Debt', amount: 5000 },
                { value: 'other', label: 'Other', amount: 5000 },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setGoalType(option.value);
                    setTargetAmount(option.amount);
                  }}
                  className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                    goalType === option.value
                      ? 'border-ledger-purple bg-ledger-card'
                      : 'border-ledger-border bg-ledger-card hover:border-ledger-purple/50'
                  }`}
                >
                  <div className="font-semibold text-lg">{option.label}</div>
                  <div className="text-ledger-text-secondary text-sm">
                    {option.value === 'other' ? 'Custom goal' : `Target: $${option.amount.toLocaleString()}`}
                  </div>
                </button>
              ))}
            </div>

            {goalType === 'other' && (
              <div className="bg-ledger-card p-6 rounded-xl mb-6">
                <label className="text-sm text-ledger-text-secondary mb-2 block">
                  What are you saving for?
                </label>
                <input
                  type="text"
                  value={customGoalName}
                  onChange={(e) => setCustomGoalName(e.target.value)}
                  placeholder="e.g., New car, wedding, vacation"
                  className="w-full bg-ledger-dark border border-ledger-border rounded-lg px-4 py-3 text-ledger-text-primary focus:outline-none focus:border-ledger-purple"
                />
              </div>
            )}

            {goalType && (
              <div className="bg-ledger-card p-6 rounded-xl mb-8">
                <label className="text-sm text-ledger-text-secondary mb-2 block">
                  Target Amount
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="w-full bg-ledger-dark border border-ledger-border rounded-lg px-4 py-3 text-2xl font-bold text-ledger-green focus:outline-none focus:border-ledger-green"
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 border border-ledger-border text-ledger-text-primary font-semibold rounded-xl hover:border-ledger-green transition-all"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!goalType}
                className="flex-1 py-4 bg-ledger-green text-ledger-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ledger-green/90 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
