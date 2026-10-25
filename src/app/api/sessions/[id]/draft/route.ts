import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: sessionId } = await params;
  const body = await req.json();

  await prisma.lessonSession.updateMany({
    where: { id: sessionId, userId, status: 'active' },
    data: { typedDraft: body.draft ?? null },
  });

  return NextResponse.json({ success: true });
}
