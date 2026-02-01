/**
 * LEDGER - CREATE LINK TOKEN
 * 
 * Generate Plaid Link token for client-side bank connection
 * Security: Link tokens are safe to expose to client (short-lived, single-use)
 */

import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products } from 'plaid';

export async function POST() {
  try {
    const request = {
      user: {
        // Unique user identifier - in production, use actual user ID
        client_user_id: 'ledger-demo-user',
      },
      client_name: 'Ledger',
      products: (process.env.PLAID_PRODUCTS?.split(',') || ['auth', 'transactions']) as Products[],
      country_codes: (process.env.PLAID_COUNTRY_CODES?.split(',') || ['US']) as CountryCode[],
      language: 'en',
      webhook: process.env.PLAID_WEBHOOK_URL,
      transactions: {
        days_requested: 365, // Request 1 year of transaction history
      },
    };

    const response = await plaidClient.linkTokenCreate(request);
    
    return NextResponse.json({ 
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error: any) {
    console.error('Error creating link token:', error.response?.data || error.message);
    
    return NextResponse.json(
      { error: 'Failed to create link token', details: error.message },
      { status: 500 }
    );
  }
}
