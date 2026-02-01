/**
 * LEDGER - DISCONNECT ENDPOINT
 * 
 * Clears session and removes all Plaid data
 */

import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';

export async function POST() {
  try {
    // Clear the entire session (removes Plaid tokens, user profile, everything)
    await clearSession();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ERROR] Failed to clear session:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect', details: error.message },
      { status: 500 }
    );
  }
}
