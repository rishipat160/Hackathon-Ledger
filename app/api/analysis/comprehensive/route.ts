/**
 * LEDGER - COMPREHENSIVE ANALYSIS API
 * 
 * Uses new analyzer for friendly insights
 */

import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { getSession } from '@/lib/session';
import { analyzeFinances } from '@/lib/analyzer';
import { detectSubscriptionDrift } from '@/lib/subscriptions';
import { mapPFCToFriendly } from '@/lib/categories';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    // Support both legacy single token and new array format
    const accessTokens = session.plaidAccessTokens || (session.plaidAccessToken ? [session.plaidAccessToken] : []);
    
    if (accessTokens.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized: No active Plaid session' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || getDefaultStartDate();
    const endDate = searchParams.get('end_date') || getTodayDate();

    // Fetch from all connected accounts
    let allTransactions: any[] = [];
    let allAccounts: any[] = [];

    for (const token of accessTokens) {
      const [transactionsResponse, accountsResponse] = await Promise.all([
        plaidClient.transactionsGet({
          access_token: token,
          start_date: startDate,
          end_date: endDate,
          options: { 
            count: 500, 
            offset: 0,
            include_personal_finance_category: true, // Request modern PFC taxonomy
          },
        }),
        plaidClient.accountsGet({
          access_token: token,
        }),
      ]);

      allTransactions.push(...transactionsResponse.data.transactions);
      allAccounts.push(...accountsResponse.data.accounts);
    }


    // Run financial analysis
    const analysis = analyzeFinances(allTransactions, allAccounts);
    const subscriptions = detectSubscriptionDrift(allTransactions);

    // Prepare chart data with category color mapping
    const chartData = prepareChartData(allTransactions, analysis);
    
    // Pre-calculate spending breakdown for all periods
    const spendingByPeriod = {
      '3M': calculateSpendingByPeriod(analysis.spending.byCategory, 3),
      '6M': calculateSpendingByPeriod(analysis.spending.byCategory, 6),
      '12M': analysis.spending.topCategories.slice(0, 6),
    };

    return NextResponse.json({
      analysis,
      subscriptions,
      transactions: allTransactions.slice(0, 20),
      chartData,
      spendingByPeriod,
    });
  } catch (error: any) {
    console.error('[ERROR] Comprehensive analysis failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

function prepareChartData(transactions: any[], analysis: any) {
  // Create global category-to-color mapping based on overall spending rank
  const globalCategoryColors: Record<string, string> = {};
  const colors = ['#00FF88', '#00E5FF', '#B24BF3', '#FFD93D', '#FF4757', '#8E8E93', '#48484A'];
  
  analysis.spending.topCategories.forEach((cat: any, index: number) => {
    globalCategoryColors[cat.category] = colors[index % colors.length];
  });
  
  // Group by month
  const monthlyData: any = {};
  
  transactions.forEach(txn => {
    const month = txn.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { 
        income: 0, 
        spending: 0,
        spendingByCategory: {},
        incomeCount: 0 
      };
    }
    
    if (txn.amount < 0) {
      monthlyData[month].income += Math.abs(txn.amount);
      monthlyData[month].incomeCount++;
    } else {
      const friendlyCategory = mapPFCToFriendly(txn.personal_finance_category);
      
      monthlyData[month].spending += txn.amount;
      monthlyData[month].spendingByCategory[friendlyCategory] = 
        (monthlyData[month].spendingByCategory[friendlyCategory] || 0) + txn.amount;
    }
  });

  const months = Object.keys(monthlyData).sort();
  const incomeSpending = months.map(month => ({
    month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    income: monthlyData[month].income,
    spending: monthlyData[month].spending,
    spendingByCategory: monthlyData[month].spendingByCategory,
    incomeCount: monthlyData[month].incomeCount,
    categoryColors: globalCategoryColors, // Pass color mapping to tooltip
  }));

  // Savings trend
  let cumulativeSavings = 0;
  const savingsTrend = months.map(month => {
    cumulativeSavings += monthlyData[month].income - monthlyData[month].spending;
    return {
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      savings: Math.max(0, cumulativeSavings),
    };
  });

  return {
    incomeSpending,
    savingsTrend,
  };
}

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 365);
  return date.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateSpendingByPeriod(categories: any[], months: number) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  
  const filtered = categories.map(cat => {
    const recentTxns = cat.transactions.filter((t: any) => 
      new Date(t.date) >= cutoffDate
    );
    const total = recentTxns.reduce((sum: number, t: any) => sum + t.amount, 0);
    return { ...cat, total };
  }).filter(cat => cat.total > 0);
  
  const totalSpending = filtered.reduce((sum, cat) => sum + cat.total, 0);
  
  return filtered
    .map(cat => ({
      category: cat.category,
      total: cat.total,
      percentage: (cat.total / totalSpending) * 100,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}
