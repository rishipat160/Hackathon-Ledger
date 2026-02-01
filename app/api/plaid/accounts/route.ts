/**
 * LEDGER - FETCH ACCOUNTS
 * 
 * Retrieve account information with balances
 * Security: Requires valid session
 */

import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session.plaidAccessToken) {
      return NextResponse.json(
        { error: 'Unauthorized: No active Plaid session' },
        { status: 401 }
      );
    }

    const accountsResponse = await plaidClient.accountsGet({
      access_token: session.plaidAccessToken,
    });

    return NextResponse.json({
      accounts: accountsResponse.data.accounts,
      item: accountsResponse.data.item,
    });
  } catch (error: any) {
    console.error('[ERROR] Failed to fetch accounts:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch accounts',
        details: error.response?.data?.error_message || error.message,
      },
      { status: 500 }
    );
  }
}
