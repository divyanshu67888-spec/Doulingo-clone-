import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getUserNotifications } from '@/server/notifications';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await getUserNotifications(userId);
  return NextResponse.json(result);
}
