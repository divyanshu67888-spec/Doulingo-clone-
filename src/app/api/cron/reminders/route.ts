import { NextResponse } from 'next/server';
import { runReminderEmailJob } from '@/server/reminders';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secretHeader = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET || 'linguaquest_cron_secret_key_12345';

  const isAuthorized =
    secretHeader === expectedSecret ||
    authHeader === `Bearer ${expectedSecret}`;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runReminderEmailJob();
  return NextResponse.json({ success: true, ...result });
}

// Allow GET for quick webhook invocation with secret query param
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET || 'linguaquest_cron_secret_key_12345';

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runReminderEmailJob();
  return NextResponse.json({ success: true, ...result });
}
