import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

const recommendQuerySchema = z.object({
  unitId: z.string().min(1, 'unitId is required'),
  // Optional overrides for manual demo/testing purposes
  accuracy: z.number().min(0).max(1).optional(),
  avg_response_time_sec: z.number().positive().optional(),
  previous_attempts: z.number().int().min(0).optional(),
  topic: z.string().min(1).optional(),
});

// Map unit keys from Prisma seed to model topic names
const TOPIC_KEY_MAP: Record<string, string> = {
  greetings: 'Greetings',
  basics_1: 'Basics',
  numbers: 'Numbers',
  colors: 'Colors',
  food_drink: 'Food',
  travel: 'Travel',
  family: 'Family',
  animals: 'Animals',
};

export async function POST(req: Request) {
  // 1. Authenticate session user
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate request body with Zod
  let body: z.infer<typeof recommendQuerySchema>;
  try {
    const rawBody = await req.json();
    body = recommendQuerySchema.parse(rawBody);
  } catch (err: unknown) {
    const msg = err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Invalid request body';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 3. Look up unit in database
  const unit = await prisma.unit.findUnique({
    where: { id: body.unitId },
    select: { id: true, key: true, title: true },
  });

  if (!unit) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
  }

  // Feature 1: Topic
  // Derived from unit.key (mapped) or fallback to unit title / Basics
  const computedTopic = TOPIC_KEY_MAP[unit.key] || unit.title || 'Basics';

  // Feature 2: Previous Attempts
  // Accurately computed by counting historical LessonSession rows for this user and unit
  const computedAttempts = await prisma.lessonSession.count({
    where: {
      userId,
      unitId: unit.id,
    },
  });

  // Feature 3: Accuracy
  // Real data: aggregated from SessionAnswer records across sessions for this unit (or user overall)
  // Fallback: 0.80 if no answers exist yet
  let computedAccuracy = 0.8;
  const userSessions = await prisma.lessonSession.findMany({
    where: { userId, unitId: unit.id },
    select: { id: true },
  });
  const sessionIds = userSessions.map((s) => s.id);

  if (sessionIds.length > 0) {
    const [totalAnswers, correctAnswers] = await Promise.all([
      prisma.sessionAnswer.count({ where: { sessionId: { in: sessionIds } } }),
      prisma.sessionAnswer.count({ where: { sessionId: { in: sessionIds }, isCorrect: true } }),
    ]);
    if (totalAnswers > 0) {
      computedAccuracy = Math.round((correctAnswers / totalAnswers) * 100) / 100;
    }
  }

  // Feature 4: Average Response Time (seconds)
  // Schema does NOT store per-answer response timestamps.
  // Approximation: divide session secondsActive by completed exercises if available.
  // Fallback: 10.0 seconds default.
  let computedResponseTime = 10.0;
  if (sessionIds.length > 0) {
    const sessionsWithStats = await prisma.lessonSession.findMany({
      where: { id: { in: sessionIds } },
      select: { secondsActive: true, currentIndex: true },
    });
    const totalSeconds = sessionsWithStats.reduce((sum, s) => sum + s.secondsActive, 0);
    const totalExercises = sessionsWithStats.reduce((sum, s) => sum + Math.max(1, s.currentIndex), 0);
    if (totalSeconds > 0 && totalExercises > 0) {
      computedResponseTime = Math.max(1.0, Math.round((totalSeconds / totalExercises) * 10) / 10);
    }
  }

  // Compile final 4 features (allow demo overrides if provided in body)
  const finalFeatures = {
    accuracy: body.accuracy !== undefined ? body.accuracy : computedAccuracy,
    avg_response_time_sec: body.avg_response_time_sec !== undefined ? body.avg_response_time_sec : computedResponseTime,
    previous_attempts: body.previous_attempts !== undefined ? body.previous_attempts : computedAttempts,
    topic: body.topic !== undefined ? body.topic : computedTopic,
  };

  // 4. Call external ML Service
  const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

  try {
    const response = await fetch(`${mlServiceUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalFeatures),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ available: false });
    }

    const mlData = await response.json();

    // Map Easy -> normal, Medium -> medium, Hard -> hard for LinguaQuest difficulty levels
    const difficultyMap: Record<string, 'normal' | 'medium' | 'hard'> = {
      Easy: 'normal',
      Medium: 'medium',
      Hard: 'hard',
    };
    const recommendedDifficulty = difficultyMap[mlData.recommended_difficulty] || 'normal';

    return NextResponse.json({
      available: true,
      recommendedDifficulty, // 'normal' | 'medium' | 'hard'
      modelRecommendation: mlData.recommended_difficulty, // 'Easy' | 'Medium' | 'Hard'
      probabilities: mlData.probabilities,
      syntheticModel: true,
      featuresUsed: finalFeatures,
    });
  } catch {
    clearTimeout(timeoutId);
    // Graceful fallback when ML service is down or unreachable
    return NextResponse.json({ available: false });
  }
}
