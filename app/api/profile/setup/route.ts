import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const profile = await request.json();
    
    const session = await getSession();
    session.userProfile = profile;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to save profile', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({ profile: session.userProfile || null });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get profile', details: error.message },
      { status: 500 }
    );
  }
}
