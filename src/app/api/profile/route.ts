import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

const profileUpdateSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(30, 'Display name cannot exceed 30 characters').trim().optional(),
  photoUrl: z.string().nullable().optional(),
  dailyGoal: z.number().int().min(10).max(100).optional(),
});

export async function PATCH(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = profileUpdateSchema.parse(body);

    const updateData: { displayName?: string; photoUrl?: string | null; dailyGoal?: number } = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.dailyGoal !== undefined) updateData.dailyGoal = data.dailyGoal;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        displayName: updated.displayName,
        photoUrl: updated.photoUrl,
        dailyGoal: updated.dailyGoal,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
