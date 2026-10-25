import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { computeHearts } from '@/server/hearts';
import { sanitizeSessionForClient } from '@/server/sessions';

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unitId = searchParams.get('unitId');

  const whereClause: { userId: string; status: string; unitId?: string } = {
    userId,
    status: 'active',
  };
  if (unitId) {
    whereClause.unitId = unitId;
  }

  const session = await prisma.lessonSession.findFirst({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    include: { unit: true, user: true },
  });

  if (!session) {
    return NextResponse.json({ session: null });
  }

  const heartsStatus = computeHearts(session.user.hearts, session.user.heartsUpdatedAt);
  return NextResponse.json({
    session: sanitizeSessionForClient(session, heartsStatus.hearts),
  });
}
