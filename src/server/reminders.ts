import { prisma } from '@/lib/db';
import { sendEmail } from './email';
import { localDate, localHour } from './time';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'linguaquest_secret_key_default');

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function generateUnsubscribeToken(userId: string): Promise<string> {
  return await new SignJWT({ userId, action: 'unsubscribe' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.action === 'unsubscribe' && typeof payload.userId === 'string') {
      return payload.userId;
    }
    return null;
  } catch {
    return null;
  }
}

export async function runReminderEmailJob(now: Date = new Date()) {
  const users = await prisma.user.findMany({
    where: {
      isSeed: false,
      settings: {
        emailRemindersEnabled: true,
      },
    },
    include: {
      settings: true,
    },
  });

  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  for (const user of users) {
    results.processed++;
    const today = localDate(user.timeZone, now);
    const hour = localHour(user.timeZone, now);

    // Only send after 6 PM local time (18:00)
    if (hour < 18) {
      results.skipped++;
      continue;
    }

    // Only if no lesson completed today
    if (user.lastLessonLocalDate === today) {
      results.skipped++;
      continue;
    }

    // Insert-before-send concurrency safe deduplication via unique (userId, localDate)
    let emailLogId: string;
    try {
      const emailLog = await prisma.emailLog.create({
        data: {
          userId: user.id,
          localDate: today,
          status: 'sending',
          attempts: 1,
        },
      });
      emailLogId = emailLog.id;
    } catch {
      // Already attempted or sent today
      results.skipped++;
      continue;
    }

    try {
      const safeName = escapeHtml(user.displayName);
      const streakLine =
        user.currentStreak > 0
          ? `You have a <strong>${user.currentStreak}-day streak</strong> waiting for you! Don't let it slip away.`
          : `Today is the perfect day to start a brand new streak and master Spanish!`;

      const subject = `Don't break your streak, ${user.displayName}! 🔥`;
      const unsubToken = await generateUnsubscribeToken(user.id);
      const unsubUrl = `${appUrl}/api/auth/unsubscribe?token=${unsubToken}`;
      const settingsUrl = `${appUrl}/settings`;

      const html = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #262626;">
          <h2 style="color: #58CC02; margin-bottom: 16px;">LinguaQuest</h2>
          <p style="font-size: 16px; line-height: 1.5;">Hi ${safeName},</p>
          <p style="font-size: 16px; line-height: 1.5;">${streakLine}</p>
          <p style="font-size: 16px; line-height: 1.5;">Your daily goal is <strong>${user.dailyGoal} XP</strong>. Take just 5 minutes now to keep your learning momentum going strong.</p>
          
          <div style="margin: 28px 0;">
            <a href="${appUrl}/home" style="display: inline-block; background-color: #58CC02; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 0 #46A302;">Open LinguaQuest</a>
          </div>

          <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 24px 0;" />
          <p style="font-size: 12px; color: #777777;">
            You received this email because daily reminder emails are enabled in your <a href="${settingsUrl}" style="color: #1CB0F6;">LinguaQuest Settings</a>.<br />
            <a href="${unsubUrl}" style="color: #777777; text-decoration: underline;">One-click unsubscribe</a>
          </p>
        </div>
      `;

      const res = await sendEmail({
        to: user.email,
        subject,
        html,
      });

      if (res.success) {
        await prisma.emailLog.updateMany({
          where: { id: emailLogId },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });
        results.sent++;
      } else {
        await prisma.emailLog.updateMany({
          where: { id: emailLogId },
          data: {
            status: 'failed',
          },
        });
        results.failed++;
      }
    } catch (err) {
      console.error(`Error sending email to user ${user.id}:`, err);
      await prisma.emailLog.updateMany({
        where: { id: emailLogId },
        data: { status: 'failed' },
      });
      results.failed++;
    }
  }

  return results;
}
