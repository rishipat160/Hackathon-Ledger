/**
 * LEDGER - PLAID CLIENT
 * 
 * Server-side only Plaid client initialization
 * Security: NEVER expose this client or access tokens to the browser
 */

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

if (!process.env.PLAID_CLIENT_ID) {
  throw new Error('PLAID_CLIENT_ID is not set in environment variables');
}

if (!process.env.PLAID_SECRET) {
  throw new Error('PLAID_SECRET is not set in environment variables');
}

if (!process.env.PLAID_ENV) {
  throw new Error('PLAID_ENV is not set in environment variables');
}

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Helper to mask account numbers for logging (security)
export function maskAccountNumber(accountNumber: string | null | undefined): string {
  if (!accountNumber) return 'N/A';
  if (accountNumber.length <= 4) return '****';
  return '****' + accountNumber.slice(-4);
}

// Helper to sanitize transaction data before sending to OpenAI
export function sanitizeForAI(transaction: any): any {
  const pfc = transaction.personal_finance_category;
  
  return {
    transaction_id: transaction.transaction_id,
    date: transaction.date,
    amount: transaction.amount,
    merchant: transaction.name,
    category: pfc?.primary || 'Other',
    // EXPLICITLY OMIT: account_id, account_owner, payment details
  };
}
