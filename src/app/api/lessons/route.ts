import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const language = searchParams.get('language') || 'es';

  const units = await prisma.unit.findMany({
    where: { language },
    orderBy: { orderIndex: 'asc' },
    include: {
      progress: {
        where: { userId, language },
      },
    },
  });

  const formatted = units.map((u) => {
    const prog = u.progress[0];
    return {
      id: u.id,
      key: u.key,
      title: u.title,
      description: u.description,
      orderIndex: u.orderIndex,
      xpReward: u.xpReward,
      exerciseCount: u.exerciseCount,
      status: prog?.status ?? 'locked',
      crowns: prog?.crowns ?? 0,
      xpEarned: prog?.xpEarned ?? 0,
    };
  });

  return NextResponse.json({ units: formatted });
}
