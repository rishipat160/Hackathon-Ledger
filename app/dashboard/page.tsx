'use client';

/**
 * LEDGER - DASHBOARD
 * 
 * Redesigned with 3-column layout and friendly insights
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeroStats from '@/components/HeroStats';
import GoalProgress from '@/components/GoalProgress';
import CashFlowHealth from '@/components/CashFlowHealth';
import IncomeSpendingChart from '@/components/IncomeSpendingChart';
import SpendingBreakdown from '@/components/SpendingBreakdown';
import SavingsTrend from '@/components/SavingsTrend';
import AICoach from '@/components/AICoach';
import RecentTransactions from '@/components/RecentTransactions';
import SubscriptionCards from '@/components/SubscriptionCards';

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState('5000');

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch both profile and analysis data in parallel
      const [profileResponse, analysisResponse] = await Promise.all([
        fetch('/api/profile/setup'),
        fetch(`/api/analysis/comprehensive?t=${Date.now()}`)
      ]);
      
      if (analysisResponse.status === 401) {
        router.push('/');
        return;
      }

      if (!analysisResponse.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const profile = await profileResponse.json();
      const result = await analysisResponse.json();
      
      // Merge profile data into result
      setData({ ...result, userProfile: profile.profile });
    } catch (err: any) {
      console.error('Error fetching analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    
    try {
      // Call disconnect endpoint to clear session
      const response = await fetch('/api/disconnect', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      // Clear local state
      setData(null);
      
      // Redirect to home
      router.push('/');
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      alert('Failed to disconnect. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  const updateGoal = async () => {
    try {
      const goalAmount = parseInt(newGoal);
      if (isNaN(goalAmount) || goalAmount <= 0) {
        alert('Please enter a valid goal amount');
        return;
      }

      // Fetch current profile first to merge
      const profileRes = await fetch('/api/profile/setup');
      const { profile } = await profileRes.json();

      // Merge with existing profile data
      const response = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          savingsGoal: {
            ...(profile?.savingsGoal || {}),
            type: profile?.savingsGoal?.type || 'savings',
            targetAmount: goalAmount
          }
        })
      });

      if (response.ok) {
        setShowGoalModal(false);
        fetchAnalysis(); // Refresh dashboard with new goal
      }
    } catch (err: any) {
      console.error('Error updating goal:', err);
      alert('Failed to update goal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ledger-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ledger-green mx-auto mb-4"></div>
          <p className="text-ledger-text-secondary">Analyzing your finances...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-ledger-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-ledger-red mb-4">{error || 'No data available'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-ledger-green text-ledger-black font-semibold rounded-lg hover:bg-ledger-green/90"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { analysis, chartData, subscriptions, transactions, spendingByPeriod } = data;

  return (
    <div className="min-h-screen bg-ledger-black">
      {/* Header */}
      <div className="bg-ledger-dark border-b border-ledger-border py-6 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Ledger</h1>
            <p className="text-ledger-text-secondary text-sm">Financial clarity</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 border border-ledger-border rounded-lg text-sm hover:border-ledger-cyan transition-all"
            >
              Update Goal
            </button>
            
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 border border-ledger-border rounded-lg text-sm hover:border-ledger-red transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Stats */}
        <HeroStats
          balance={analysis.balance.current}
          income={analysis.income.totalIncome}
          spent={analysis.spending.total}
        />

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* LEFT COLUMN (1/4 width) */}
          <div className="space-y-6">
            <SpendingBreakdown periodData={spendingByPeriod} />
            
            <CashFlowHealth health={analysis.cashFlowHealth} />
          </div>

          {/* MIDDLE COLUMN (2/4 width) */}
          <div className="lg:col-span-2 space-y-6">
            <IncomeSpendingChart data={chartData.incomeSpending} />
            
            <div className="grid grid-cols-2 gap-6">
              <GoalProgress
                goalType="Savings Goal"
                current={analysis.balance.current}
                target={data.userProfile?.savingsGoal?.targetAmount || 5000}
              />
              <SavingsTrend 
                data={chartData.savingsTrend}
                goalAmount={data.userProfile?.savingsGoal?.targetAmount || 5000}
              />
            </div>
          </div>

          {/* RIGHT COLUMN (1/4 width) */}
          <div>
            <AICoach />
          </div>
        </div>

        {/* Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTransactions transactions={transactions} />
          <SubscriptionCards subscriptions={subscriptions} />
        </div>
      </div>

      {/* Savings Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowGoalModal(false)}>
          <div className="bg-ledger-card p-8 rounded-xl border border-ledger-border max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4">Update Savings Goal</h3>
            <p className="text-ledger-text-secondary text-sm mb-6">
              Set a new target amount for your savings goal
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Target Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ledger-text-secondary">$</span>
                <input
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-ledger-dark border border-ledger-border rounded-lg text-ledger-text-primary focus:border-ledger-cyan focus:outline-none"
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 px-4 py-2 border border-ledger-border rounded-lg hover:border-ledger-text-secondary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={updateGoal}
                className="flex-1 px-4 py-2 bg-ledger-cyan text-ledger-black font-semibold rounded-lg hover:bg-ledger-cyan/90 transition-all"
              >
                Update Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
