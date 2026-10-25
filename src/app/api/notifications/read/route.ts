import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { markNotificationsAsRead } from '@/server/notifications';

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await markNotificationsAsRead(userId);
  return NextResponse.json({ success: true });
}
