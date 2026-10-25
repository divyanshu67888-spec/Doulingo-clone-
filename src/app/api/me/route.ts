import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    photoUrl: user.photoUrl,
    language: user.language,
    levelPref: user.levelPref,
    dailyGoal: user.dailyGoal,
    timeZone: user.timeZone,
    totalSeconds: user.totalSeconds,
    settings: user.settings,
  });
}
