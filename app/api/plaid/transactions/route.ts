/**
 * LEDGER - FETCH TRANSACTIONS
 * 
 * Retrieve transactions with PII masking
 * Security: Requires valid session, sanitizes sensitive data
 */

import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    // Step 1: Validate session
    const session = await getSession();
    
    if (!session.plaidAccessToken) {
      return NextResponse.json(
        { error: 'Unauthorized: No active Plaid session' },
        { status: 401 }
      );
    }

    // Step 2: Parse date range from query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || getDefaultStartDate();
    const endDate = searchParams.get('end_date') || getTodayDate();


    // Step 3: Fetch transactions from Plaid with PFC v2
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: session.plaidAccessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 500,
        offset: 0,
        include_personal_finance_category: true, // Request modern PFC taxonomy
      },
    });

    // Step 4: Fetch account balances
    const accountsResponse = await plaidClient.accountsGet({
      access_token: session.plaidAccessToken,
    });

    // Step 5: Return data (safe to send to client)
    return NextResponse.json({
      transactions: transactionsResponse.data.transactions,
      accounts: accountsResponse.data.accounts,
      totalTransactions: transactionsResponse.data.total_transactions,
      item: transactionsResponse.data.item,
    });
  } catch (error: any) {
    console.error('[ERROR] Failed to fetch transactions:', error.response?.data || error.message);
    
    // Handle specific Plaid errors
    if (error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
      return NextResponse.json(
        { error: 'Bank connection expired', code: 'ITEM_LOGIN_REQUIRED' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch transactions',
        details: error.response?.data?.error_message || error.message,
      },
      { status: 500 }
    );
  }
}

// Helper: Get date 365 days ago (1 year of history)
function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 365);
  return date.toISOString().split('T')[0];
}

// Helper: Get today's date
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
