/**
 * LEDGER - FINANCIAL ANALYZER
 * 
 * Friendly insights engine for students and freelancers
 * Focuses on actionable advice, not just detection
 */

import { Transaction, AccountBase } from 'plaid';
import { mapPFCToFriendly } from './categories';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IncomeAnalysis {
  totalIncome: number;
  averageMonthly: number;
  isVariable: boolean;
  variability: number; // 0-1, higher = more variable
  pattern: 'biweekly' | 'monthly' | 'irregular' | 'weekly';
  lastPaycheck?: {
    amount: number;
    date: string;
  };
  incomeTransactions: Transaction[];
}

export interface CategorySpending {
  category: string;
  total: number;
  count: number;
  average: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  transactions: Transaction[];
}

export interface CashFlowHealth {
  score: number; // 0-100
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  incomeToSpendingRatio: number;
}

export interface SpendingInsight {
  type: 'high_spending' | 'subscription' | 'cash_flow' | 'positive' | 'goal';
  title: string;
  description: string;
  impact: string;
  actionable: string[];
  severity: 'info' | 'warning' | 'critical';
}

export interface FinancialAnalysis {
  income: IncomeAnalysis;
  spending: {
    total: number;
    byCategory: CategorySpending[];
    topCategories: CategorySpending[];
    dailyAverage: number;
  };
  balance: {
    current: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  cashFlowHealth: CashFlowHealth;
  insights: SpendingInsight[];
  savingsRate: number;
}

// ============================================================================
// INCOME DETECTION
// ============================================================================

export function detectIncome(transactions: Transaction[]): IncomeAnalysis {
  // Income = ALL negative transactions (money in: paychecks, refunds, transfers, credits)
  const incomeTransactions = transactions.filter(t => t.amount < 0);

  if (incomeTransactions.length === 0) {
    return {
      totalIncome: 0,
      averageMonthly: 0,
      isVariable: false,
      variability: 0,
      pattern: 'irregular',
      incomeTransactions: [],
    };
  }

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  // Calculate monthly average
  const dates = incomeTransactions.map(t => new Date(t.date).getTime());
  const dayRange = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24);
  const monthRange = Math.max(1, dayRange / 30);
  const averageMonthly = totalIncome / monthRange;

  // Calculate variability
  const amounts = incomeTransactions.map(t => Math.abs(t.amount));
  const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const variability = mean > 0 ? stdDev / mean : 0;

  // Detect pattern
  const pattern = detectPaymentPattern(incomeTransactions);

  // Last paycheck
  const lastPaycheck = incomeTransactions.length > 0 ? {
    amount: Math.abs(incomeTransactions[0].amount),
    date: incomeTransactions[0].date,
  } : undefined;

  return {
    totalIncome,
    averageMonthly,
    isVariable: variability > 0.2, // >20% variation
    variability,
    pattern,
    lastPaycheck,
    incomeTransactions,
  };
}

function detectPaymentPattern(transactions: Transaction[]): 'biweekly' | 'monthly' | 'irregular' | 'weekly' {
  if (transactions.length < 2) return 'irregular';

  const sorted = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = (new Date(sorted[i].date).getTime() - new Date(sorted[i-1].date).getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(days);
  }

  const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

  if (avgInterval >= 25 && avgInterval <= 35) return 'monthly';
  if (avgInterval >= 12 && avgInterval <= 16) return 'biweekly';
  if (avgInterval >= 5 && avgInterval <= 9) return 'weekly';
  return 'irregular';
}

// ============================================================================
// CATEGORY SPENDING ANALYSIS
// ============================================================================

export function analyzeCategorySpending(transactions: Transaction[]): CategorySpending[] {
  const spendingTxns = transactions.filter(t => t.amount > 0);
  
  const categoryMap = new Map<string, Transaction[]>();
  
  for (const txn of spendingTxns) {
    const category = mapPFCToFriendly(
      (txn as any).personal_finance_category
    );
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(txn);
  }

  const totalSpending = spendingTxns.reduce((sum, t) => sum + t.amount, 0);

  const categories: CategorySpending[] = [];
  for (const [category, txns] of categoryMap.entries()) {
    const total = txns.reduce((sum, t) => sum + t.amount, 0);
    const count = txns.length;
    const average = total / count;
    const percentage = totalSpending > 0 ? (total / totalSpending) * 100 : 0;

    categories.push({
      category,
      total,
      count,
      average,
      percentage,
      trend: 'stable',
      transactions: txns,
    });
  }

  return categories.sort((a, b) => b.total - a.total);
}

// ============================================================================
// CASH FLOW HEALTH SCORE
// ============================================================================

export function calculateCashFlowHealth(
  income: IncomeAnalysis,
  spending: number,
  balance: number
): CashFlowHealth {
  const monthlyIncome = income.averageMonthly;
  
  // Calculate monthly spending (spending is total, need to divide by time period)
  const monthRange = income.incomeTransactions.length > 0 
    ? (Math.max(...income.incomeTransactions.map(t => new Date(t.date).getTime())) - 
       Math.min(...income.incomeTransactions.map(t => new Date(t.date).getTime()))) / (1000 * 60 * 60 * 24 * 30)
    : 1;
  const monthlySpending = spending / Math.max(1, monthRange);
  
  const incomeToSpendingRatio = monthlyIncome > 0 ? monthlyIncome / monthlySpending : 0;
  
  // CRITICAL: If balance is negative, automatically mark as critical
  if (balance < 0) {
    return {
      score: Math.round(Math.max(0, Math.min(35, 35 - Math.abs(balance) / 100))), // Scale down based on debt amount
      status: 'critical',
      message: `You're currently in the red with a negative balance of $${Math.abs(balance).toFixed(2)}. Focus on reducing spending and increasing income immediately.`,
      incomeToSpendingRatio,
    };
  }
  
  let score = 50; // Base score

  // Income vs Spending (40 points)
  if (incomeToSpendingRatio >= 1.5) score += 40;
  else if (incomeToSpendingRatio >= 1.2) score += 30;
  else if (incomeToSpendingRatio >= 1.0) score += 20;
  else if (incomeToSpendingRatio >= 0.8) score += 10;
  else score += 0;

  // Balance relative to monthly spending (30 points)
  const balanceToSpending = balance / monthlySpending;
  if (balanceToSpending >= 2) score += 30;
  else if (balanceToSpending >= 1) score += 20;
  else if (balanceToSpending >= 0.5) score += 10;
  else score += 0;

  // Income variability (20 points - penalize high variability)
  if (!income.isVariable) score += 20;
  else if (income.variability < 0.3) score += 15;
  else if (income.variability < 0.5) score += 10;
  else score += 5;

  score = Math.min(100, Math.max(0, score));

  let status: 'healthy' | 'warning' | 'critical';
  let message: string;

  if (score >= 75) {
    status = 'healthy';
    message = 'Your finances are in good shape. Keep up the good habits!';
  } else if (score >= 50) {
    status = 'warning';
    message = 'Your cash flow needs attention. Consider building a buffer and reducing expenses.';
  } else {
    status = 'critical';
    message = 'Your finances need immediate attention. Focus on increasing income and reducing expenses.';
  }

  return {
    score,
    status,
    message,
    incomeToSpendingRatio,
  };
}

// ============================================================================
// INSIGHT GENERATION
// ============================================================================

export function generateInsights(
  transactions: Transaction[],
  income: IncomeAnalysis,
  categories: CategorySpending[],
  balance: number
): SpendingInsight[] {
  const insights: SpendingInsight[] = [];

  // High spending category insight
  const topCategory = categories[0];
  if (topCategory && topCategory.percentage > 30) {
    insights.push({
      type: 'high_spending',
      title: `High ${topCategory.category} Spending`,
      description: `You spent $${topCategory.total.toFixed(2)} on ${topCategory.category} (${topCategory.percentage.toFixed(0)}% of total spending).`,
      impact: `Reducing this by 20% could save you $${(topCategory.total * 0.2).toFixed(2)} per month.`,
      actionable: [
        'Review recent transactions in this category',
        'Look for patterns or unnecessary expenses',
        'Set a monthly budget for this category',
      ],
      severity: 'warning',
    });
  }

  // Income timing insight
  if (income.lastPaycheck && balance < income.averageMonthly * 0.5) {
    const daysSincePaycheck = (Date.now() - new Date(income.lastPaycheck.date).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSincePaycheck > 7) {
      insights.push({
        type: 'cash_flow',
        title: 'Cash Flow Timing Gap',
        description: `Your balance is low relative to your monthly income pattern.`,
        impact: `Building a buffer equal to one paycheck ($${income.lastPaycheck.amount.toFixed(2)}) would eliminate timing stress.`,
        actionable: [
          'Transfer a small amount each week to a buffer account',
          'Adjust bill due dates if possible',
          'Consider income-based spending tracking',
        ],
        severity: 'warning',
      });
    }
  }

  // Positive reinforcement
  if (income.averageMonthly > 0) {
    const spendingTotal = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = ((income.totalIncome - spendingTotal) / income.totalIncome) * 100;
    
    if (savingsRate > 10) {
      insights.push({
        type: 'positive',
        title: 'Great Savings Rate!',
        description: `You're saving ${savingsRate.toFixed(0)}% of your income. That's excellent!`,
        impact: `At this rate, you'll save $${(income.averageMonthly * (savingsRate / 100) * 12).toFixed(2)} this year.`,
        actionable: [
          'Keep up this momentum',
          'Consider automating savings',
          'Set a specific savings goal to stay motivated',
        ],
        severity: 'info',
      });
    }
  }

  return insights;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function analyzeFinances(
  transactions: Transaction[],
  _accounts: AccountBase[]
): FinancialAnalysis {
  const income = detectIncome(transactions);
  const categories = analyzeCategorySpending(transactions);
  
  const spendingTotal = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate balance from transactions only (not Plaid's reported balance)
  const currentBalance = income.totalIncome - spendingTotal;
  
  const cashFlowHealth = calculateCashFlowHealth(income, spendingTotal, currentBalance);
  
  const topCategories = categories.slice(0, 7);
  
  const insights = generateInsights(transactions, income, categories, currentBalance);
  
  const savingsRate = income.totalIncome > 0 
    ? ((income.totalIncome - spendingTotal) / income.totalIncome) * 100 
    : 0;

  const dayRange = transactions.length > 0
    ? (new Date(transactions[0].date).getTime() - new Date(transactions[transactions.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)
    : 1;
  const dailyAverage = spendingTotal / Math.max(1, dayRange);

  return {
    income,
    spending: {
      total: spendingTotal,
      byCategory: categories,
      topCategories,
      dailyAverage,
    },
    balance: {
      current: currentBalance,
      trend: 'stable', // Could calculate from historical data
    },
    cashFlowHealth,
    insights,
    savingsRate,
  };
}
