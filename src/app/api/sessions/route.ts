import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth';
import { createLessonSession } from '@/server/sessions';
import { Difficulty } from '@/server/crowns';

const sessionCreateSchema = z.object({
  unitId: z.string().min(1),
  difficulty: z.enum(['normal', 'medium', 'hard']).default('normal'),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { unitId, difficulty } = sessionCreateSchema.parse(body);

    const session = await createLessonSession(userId, unitId, difficulty as Difficulty);
    return NextResponse.json(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create lesson session';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
