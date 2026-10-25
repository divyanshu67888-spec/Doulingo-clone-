import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUnsubscribeToken } from '@/server/reminders';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Invalid or missing unsubscribe token', { status: 400 });
  }

  const userId = await verifyUnsubscribeToken(token);
  if (!userId) {
    return new NextResponse('Invalid or expired unsubscribe token', { status: 400 });
  }

  await prisma.settings.update({
    where: { userId },
    data: { emailRemindersEnabled: false },
  });

  return new NextResponse(
    `<html><body style="font-family: sans-serif; text-align: center; padding: 48px;">
      <h1 style="color: #58CC02;">LinguaQuest</h1>
      <p style="font-size: 18px;">You have been unsubscribed from daily reminder emails.</p>
      <a href="/settings" style="color: #1CB0F6; text-decoration: underline;">Return to Settings</a>
    </body></html>`,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
}
