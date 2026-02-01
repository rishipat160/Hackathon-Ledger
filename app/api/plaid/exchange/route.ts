/**
 * LEDGER - TOKEN EXCHANGE
 * 
 * CRITICAL SECURITY: Exchange public token for access token SERVER-SIDE ONLY
 * NEVER expose access tokens to the client
 */

import { NextResponse } from 'next/server';
import { plaidClient, maskAccountNumber } from '@/lib/plaid';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { public_token } = await request.json();

    if (!public_token) {
      return NextResponse.json(
        { error: 'Missing public_token' },
        { status: 400 }
      );
    }

    // Step 1: Exchange public token for access token (SERVER-SIDE ONLY)
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Step 2: Get account details for logging (with PII masking)
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Log with masked account numbers
    console.log('[SECURITY] Token exchange successful', {
      itemId,
      accountCount: accountsResponse.data.accounts.length,
      accounts: accountsResponse.data.accounts.map(acc => ({
        id: acc.account_id,
        name: acc.name,
        type: acc.type,
        masked_number: maskAccountNumber(acc.mask),
      })),
    });

    // Step 3: Store access token in encrypted session (NEVER send to client)
    // Support multiple bank accounts
    const session = await getSession();
    
    if (!session.plaidAccessTokens || !session.plaidItemIds) {
      session.plaidAccessTokens = [];
      session.plaidItemIds = [];
    }
    
    // Add new token to array
    session.plaidAccessTokens.push(accessToken);
    session.plaidItemIds.push(itemId);
    
    // Legacy support
    if (!session.plaidAccessToken) {
      session.plaidAccessToken = accessToken;
      session.plaidItemId = itemId;
    }
    
    await session.save();

    // Step 4: Return success WITHOUT access token
    return NextResponse.json({
      success: true,
      itemId, // Safe to return
      accountCount: accountsResponse.data.accounts.length,
      totalBanks: session.plaidAccessTokens.length,
      // CRITICAL: Do NOT return accessToken
    });
  } catch (error: any) {
    console.error('[ERROR] Token exchange failed:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to exchange token',
        details: error.response?.data?.error_message || error.message,
      },
      { status: 500 }
    );
  }
}
