import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getLeaderboard } from '@/server/leaderboard';

export async function GET() {
  const userId = await getCurrentUserId();
  const data = await getLeaderboard(userId || undefined);
  return NextResponse.json(data);
}
