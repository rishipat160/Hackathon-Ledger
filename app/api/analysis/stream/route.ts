/**
 * LEDGER - AI COACH STREAMING
 * 
 * Friendly financial coach with personalized insights
 * Security: PII sanitization before sending to OpenAI
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { plaidClient, sanitizeForAI } from '@/lib/plaid';
import { getSession } from '@/lib/session';
import { analyzeFinances } from '@/lib/analyzer';
import { detectSubscriptionDrift } from '@/lib/subscriptions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Friendly financial coach prompt
const SYSTEM_PROMPT = `You are Ledger's AI financial coach helping students and freelancers build better money habits.

TONE: Friendly, supportive, specific, actionable. Like talking to a knowledgeable friend.

USER CONTEXT:
You will receive the user's complete financial data including:
- User type (student, freelancer, or salaried worker)
- Current balance (their actual account balance right now)
- Savings goal progress (target amount, current progress, remaining amount, percentage complete)
- Monthly income and spending patterns
- Transaction history and categories

CRITICAL: Use the "balance.current" field as their ACTUAL current balance. Use "goalProgress" to see how close they are to their savings goal. Do NOT try to calculate these from scratch.

Tailor your advice to their situation:
- Students: Focus on budgeting basics, part-time income management, student discounts
- Freelancers: Address variable income, estimated tax savings, irregular cash flow
- Salaried: Optimize benefits, retirement contributions, consistent budgeting

AVOID:
- Emojis
- Judgment or shame
- Generic advice
- Financial jargon
- Markdown formatting (no **, ##, -, bullets, etc.)
- Use plain text only
- Incorrect math or calculations

PROVIDE:
- Specific insights with numbers from their actual data
- Actionable steps (3 max)
- Positive reinforcement for good habits
- Context-aware suggestions based on their profile
- ACCURATE progress toward their specific savings goal using the goalProgress data

FORMAT:
Write in PLAIN TEXT ONLY with clear sections separated by blank lines. Use CAPS for section headers. Do NOT use any markdown, bold, italics, or special formatting.

EXAMPLE OUTPUT (plain text, no markdown):
"KEY INSIGHTS

Great news! Your current balance is $2,097 and you're 95% of the way to your $2,200 bike savings goal. You only need $103 more!

Your monthly income averages $2,200 with spending around $1,800, giving you a healthy savings rate of about 18%. Your income-to-spending ratio of 1.22 shows you're living within your means.

RECOMMENDATIONS

1. You're so close to your goal! At your current savings rate of about $400/month, you'll hit your bike goal in just a few weeks. Consider setting aside your next $103 in income specifically for this.

2. Your Bills & Utilities make up 71% of your spending. Once you hit your bike goal, review these bills to see if you can negotiate lower rates or find better plans.

3. Your subscriptions total about $40/month. After you get your bike, consider if you're using all of them or if you can share a family plan to save.

YOUR PROGRESS

Excellent work! You've saved $2,097 toward your bike goal and you're just $103 away from making it happen. Keep up the great momentum!"

CRITICAL: Output ONLY plain text. Do NOT use asterisks, hashtags, underscores, or any markdown syntax."`;


export async function GET(request: Request) {
  const encoder = new TextEncoder();

  try {
    // Step 1: Validate session
    const session = await getSession();
    
    if (!session.plaidAccessToken) {
      return NextResponse.json(
        { error: 'Unauthorized: No active Plaid session' },
        { status: 401 }
      );
    }

    // Step 2: Fetch transactions and accounts
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || getDefaultStartDate();
    const endDate = searchParams.get('end_date') || getTodayDate();

    const [transactionsResponse, accountsResponse] = await Promise.all([
      plaidClient.transactionsGet({
        access_token: session.plaidAccessToken,
        start_date: startDate,
        end_date: endDate,
        options: { 
          count: 500, 
          offset: 0,
          include_personal_finance_category: true, // Request modern PFC taxonomy
        },
      }),
      plaidClient.accountsGet({
        access_token: session.plaidAccessToken,
      }),
    ]);

    const transactions = transactionsResponse.data.transactions;
    const accounts = accountsResponse.data.accounts;

    // Step 3: Run friendly financial analysis
    const analysis = analyzeFinances(transactions, accounts);
    const subscriptions = detectSubscriptionDrift(transactions);

    // Get user profile for personalized insights
    const userProfile = session.userProfile;

    // Step 4: Sanitize data for OpenAI (remove PII)
    const savingsGoalTarget = userProfile?.savingsGoal?.targetAmount || 5000;
    const currentBalance = analysis.balance.current;
    const remaining = Math.max(0, savingsGoalTarget - currentBalance);
    const percentComplete = ((currentBalance / savingsGoalTarget) * 100);
    
    const sanitizedData = {
      userProfile: {
        type: userProfile?.userType || 'unknown',
        savingsGoal: {
          type: userProfile?.savingsGoal?.type || 'general savings',
          targetAmount: savingsGoalTarget,
        },
      },
      balance: {
        current: currentBalance,
        trend: analysis.balance.trend,
      },
      goalProgress: {
        target: savingsGoalTarget,
        current: currentBalance,
        remaining: remaining,
        percentComplete: percentComplete.toFixed(1),
        isCloseToGoal: percentComplete >= 90,
      },
      income: {
        total: analysis.income.totalIncome,
        monthly: analysis.income.averageMonthly,
        pattern: analysis.income.pattern,
        isVariable: analysis.income.isVariable,
      },
      spending: {
        total: analysis.spending.total,
        topCategories: analysis.spending.topCategories.map(cat => ({
          category: cat.category,
          total: cat.total,
          percentage: cat.percentage,
        })),
        dailyAverage: analysis.spending.dailyAverage,
      },
      spendingByPeriod: {
        '1M': calculatePeriodSpending(transactions, 1),
        '3M': calculatePeriodSpending(transactions, 3),
        '6M': calculatePeriodSpending(transactions, 6),
        '12M': calculatePeriodSpending(transactions, 12),
      },
      monthlyBreakdown: calculateMonthlyBreakdown(transactions),
      cashFlowHealth: analysis.cashFlowHealth,
      savingsRate: analysis.savingsRate,
      subscriptions: subscriptions.slice(0, 10).map(sub => ({
        merchantName: sub.merchantName,
        amount: sub.amount,
        frequency: sub.frequency,
        lastCharge: sub.lastCharge,
        estimatedAnnualCost: sub.estimatedAnnualCost,
        driftScore: sub.driftScore,
      })),
      recentTransactions: transactions.slice(0, 15).map(sanitizeForAI),
    };


    // Step 5: Stream OpenAI analysis
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { 
                role: 'user', 
                content: `Analyze this financial data and provide friendly, actionable insights:\n\n${JSON.stringify(sanitizedData, null, 2)}`,
              },
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 2000,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              // Send as Server-Sent Events format
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          console.error('[ERROR] OpenAI streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[ERROR] Analysis failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper functions
function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 365);
  return date.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function calculatePeriodSpending(transactions: any[], months: number) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  
  const filtered = transactions.filter((t: any) => new Date(t.date) >= cutoff && t.amount > 0);
  const total = filtered.reduce((sum: number, t: any) => sum + t.amount, 0);
  
  const categoryTotals: Record<string, number> = {};
  filtered.forEach((t: any) => {
    const cat = t.personal_finance_category?.primary || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
  });
  
  return {
    totalSpending: total,
    periodLabel: `Last ${months} month${months > 1 ? 's' : ''}`,
    categories: Object.entries(categoryTotals)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: ((amt / total) * 100).toFixed(1)
      }))
      .sort((a, b) => (b.amount as number) - (a.amount as number))
      .slice(0, 5)
  };
}

function calculateMonthlyBreakdown(transactions: any[]) {
  const monthly: Record<string, { income: number; spending: number }> = {};
  
  transactions.forEach((t: any) => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!monthly[month]) monthly[month] = { income: 0, spending: 0 };
    
    if (t.amount < 0) monthly[month].income += Math.abs(t.amount);
    else monthly[month].spending += t.amount;
  });
  
  return Object.keys(monthly).sort().slice(-12).map(m => ({
    month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    income: Math.round(monthly[m].income),
    spending: Math.round(monthly[m].spending),
    net: Math.round(monthly[m].income - monthly[m].spending)
  }));
}
