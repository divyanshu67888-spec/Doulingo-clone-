import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { refillAllHearts } from '@/server/hearts';

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hearts = await refillAllHearts(userId);
  return NextResponse.json({
    success: true,
    hearts,
    message: 'Hearts refilled to 5!',
  });
}
