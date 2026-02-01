/**
 * LEDGER - SESSION MANAGEMENT
 * 
 * Secure session handling using iron-session
 * Security: HTTP-only cookies with encryption
 */

import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface UserProfile {
  userType: 'student' | 'freelancer' | 'salaried';
  monthlyIncome: number;
  savingsGoal?: {
    type: string;
    targetAmount: number;
    deadline?: string;
  };
  onboardingComplete: boolean;
}

export interface SessionData {
  plaidAccessTokens?: string[];
  plaidItemIds?: string[];
  userProfile?: UserProfile;
  plaidAccessToken?: string;
  plaidItemId?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_security',
  cookieName: 'ledger_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
