/**
 * LEDGER - SUBSCRIPTION DETECTION
 * 
 * Smart subscription detection using Plaid PFC categories and recurring patterns
 * Filters out groceries, restaurants, and variable spending
 */

import { Transaction } from 'plaid';
import { isSubscriptionCategory, isNonSubscriptionCategory } from './categories';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SubscriptionPattern {
  merchantName: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'annual' | 'irregular';
  transactionIds: string[];
  lastCharge: string;
  estimatedAnnualCost: number;
  driftScore: number; // 0-100, higher = more drift
  averageAmount: number;
  standardDeviation: number;
}

// ============================================================================
// SUBSCRIPTION DETECTION
// ============================================================================

/**
 * Detect subscription patterns and calculate drift scores
 * 
 * Algorithm:
 * 1. Group transactions by merchant using fuzzy matching
 * 2. Detect recurring patterns (monthly/annual intervals)
 * 3. Filter out groceries, restaurants, and variable spending
 * 4. Calculate drift = std_dev(amounts) / mean(amounts)
 * 5. Only flag subscriptions with drift < 30% (consistent pricing)
 */
export function detectSubscriptionDrift(
  transactions: Transaction[]
): SubscriptionPattern[] {
  if (!transactions.length) {
    return [];
  }

  // Step 1: Group by merchant
  const merchantGroups = new Map<string, Transaction[]>();
  
  for (const transaction of transactions) {
    if (transaction.amount > 0) { // Only debits
      const merchant = normalizeMerchantName(transaction.name);
      if (!merchantGroups.has(merchant)) {
        merchantGroups.set(merchant, []);
      }
      merchantGroups.get(merchant)!.push(transaction);
    }
  }

  // Step 2: Analyze each merchant for recurring patterns
  const subscriptions: SubscriptionPattern[] = [];

  for (const [merchant, txns] of merchantGroups.entries()) {
    if (txns.length < 2) continue; // Need at least 2 transactions

    // Sort by date
    const sorted = [...txns].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Check if transaction has PFC data
    const pfc = (sorted[0] as any).personal_finance_category;
    
    // Skip if this is clearly NOT a subscription category
    if (isNonSubscriptionCategory(pfc)) {
      continue; // Skip groceries, restaurants, gas, retail
    }

    // Skip common non-subscription merchants by name
    const nonSubscriptionMerchants = [
      'mcdonalds', 'starbucks', 'dunkin', 'chipotle', 'subway',
      'walmart', 'target', 'costco', 'amazon', 'uber', 'lyft',
      'shell', 'chevron', 'exxon', 'bp', '7 eleven', 'cvs', 'walgreens'
    ];
    
    if (nonSubscriptionMerchants.some(name => merchant.includes(name))) {
      continue;
    }

    // Detect frequency pattern
    const pattern = detectFrequencyPattern(sorted);
    
    // Only flag as subscription if:
    // 1. Monthly or annual frequency (NOT weekly - weekly = groceries)
    // 2. Is in subscription-related categories OR has Plaid recurring flag
    const isMonthlyOrAnnual = pattern.frequency === 'monthly' || pattern.frequency === 'annual';
    const hasRecurringFlag = (sorted[0] as any).recurring === true;
    const inSubscriptionCategory = isSubscriptionCategory(pfc);
    
    if (pattern.frequency !== 'irregular' && (isMonthlyOrAnnual || hasRecurringFlag || inSubscriptionCategory)) {
      // Step 3: Calculate drift
      const amounts = sorted.map(t => t.amount);
      const { mean, stdDev } = calculateStatistics(amounts);
      const driftScore = mean > 0 ? (stdDev / mean) * 100 : 0;

      // Only include if drift is reasonable (<30% variance)
      // High drift (50%+) means it's variable spending, not a subscription
      if (driftScore > 30) continue;

      // Step 4: Calculate annual cost
      const annualCost = calculateAnnualCost(mean, pattern.frequency);

      subscriptions.push({
        merchantName: merchant,
        amount: mean,
        frequency: pattern.frequency,
        transactionIds: sorted.map(t => t.transaction_id),
        lastCharge: sorted[sorted.length - 1].date,
        estimatedAnnualCost: annualCost,
        driftScore: Math.round(driftScore * 100) / 100,
        averageAmount: mean,
        standardDeviation: stdDev,
      });
    }
  }

  // Sort by drift score (highest first)
  return subscriptions.sort((a, b) => b.driftScore - a.driftScore);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize merchant names for better grouping
 */
function normalizeMerchantName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 2) // Take first 2 words
    .join(' ');
}

/**
 * Detect frequency pattern from transaction intervals
 */
function detectFrequencyPattern(transactions: Transaction[]): {
  frequency: 'weekly' | 'monthly' | 'annual' | 'irregular';
  averageAmount: number;
} {
  if (transactions.length < 2) {
    return { frequency: 'irregular', averageAmount: 0 };
  }

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate intervals in days
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = Math.round(
      (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    intervals.push(days);
  }

  const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  const amounts = sorted.map(t => t.amount);
  const avgAmount = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;

  // Classify frequency
  let frequency: 'weekly' | 'monthly' | 'annual' | 'irregular';
  if (avgInterval >= 340 && avgInterval <= 390) {
    frequency = 'annual';
  } else if (avgInterval >= 25 && avgInterval <= 35) {
    frequency = 'monthly';
  } else if (avgInterval >= 5 && avgInterval <= 9) {
    frequency = 'weekly';
  } else {
    frequency = 'irregular';
  }

  return { frequency, averageAmount: avgAmount };
}

/**
 * Calculate mean and standard deviation
 */
function calculateStatistics(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0 };
  }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

/**
 * Calculate estimated annual cost based on frequency
 */
function calculateAnnualCost(
  averageAmount: number,
  frequency: 'weekly' | 'monthly' | 'annual' | 'irregular'
): number {
  switch (frequency) {
    case 'weekly':
      return averageAmount * 52;
    case 'monthly':
      return averageAmount * 12;
    case 'annual':
      return averageAmount;
    case 'irregular':
      return 0;
  }
}
