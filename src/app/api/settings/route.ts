import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

const settingsSchema = z.object({
  soundEnabled: z.boolean().optional(),
  remindersEnabled: z.boolean().optional(),
  emailRemindersEnabled: z.boolean().optional(),
  language: z.string().optional(),
  dailyGoal: z.number().int().min(10).max(100).optional(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });

  return NextResponse.json({
    settings: user?.settings,
    language: user?.language,
    dailyGoal: user?.dailyGoal,
  });
}

export async function PATCH(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = settingsSchema.parse(body);

    const userUpdates: { language?: string; dailyGoal?: number } = {};
    if (data.language !== undefined) userUpdates.language = data.language;
    if (data.dailyGoal !== undefined) userUpdates.dailyGoal = data.dailyGoal;

    const settingsUpdates: {
      soundEnabled?: boolean;
      remindersEnabled?: boolean;
      emailRemindersEnabled?: boolean;
    } = {};
    if (data.soundEnabled !== undefined) settingsUpdates.soundEnabled = data.soundEnabled;
    if (data.remindersEnabled !== undefined) settingsUpdates.remindersEnabled = data.remindersEnabled;
    if (data.emailRemindersEnabled !== undefined) settingsUpdates.emailRemindersEnabled = data.emailRemindersEnabled;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdates,
        });
      }

      if (Object.keys(settingsUpdates).length > 0) {
        await tx.settings.upsert({
          where: { userId },
          update: settingsUpdates,
          create: {
            userId,
            ...settingsUpdates,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update settings';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
