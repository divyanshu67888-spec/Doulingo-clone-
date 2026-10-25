import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth';
import { submitSessionAnswer } from '@/server/sessions';

const answerSchema = z.object({
  exerciseId: z.string().min(1),
  optionId: z.string().optional(),
  text: z.string().optional(),
  matchedPairIds: z.array(z.string()).optional(),
  activeSecondsDelta: z.number().optional().default(5),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: sessionId } = await params;

  try {
    const body = await req.json();
    const submission = answerSchema.parse(body);

    const result = await submitSessionAnswer(sessionId, userId, submission);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit answer';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
