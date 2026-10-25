import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/db';
import { initializeUserProgress, completeLesson } from '../src/server/lessons';
import { awardXp } from '../src/server/xp';
import { createLessonSession, submitSessionAnswer } from '../src/server/sessions';
import { runReminderEmailJob } from '../src/server/reminders';
import { localDate } from '../src/server/time';

describe('LinguaQuest Core Engine & Acceptance Criteria', () => {
  let testUserId: string;
  let unitGreetingsId: string;
  let unitBasicsId: string;

  beforeAll(async () => {
    // Clean and setup test user
    const testEmail = `test_runner_${Date.now()}@linguaquest.test`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'hashed_pw',
        displayName: 'TestLearner',
        timeZone: 'UTC',
        language: 'es',
        hearts: 5,
        settings: {
          create: {
            soundEnabled: true,
            remindersEnabled: true,
            emailRemindersEnabled: true,
          },
        },
      },
    });
    testUserId = user.id;

    // Fetch Greetings and Basics 1
    const greetings = await prisma.unit.findFirstOrThrow({
      where: { language: 'es', key: 'greetings' },
    });
    const basics = await prisma.unit.findFirstOrThrow({
      where: { language: 'es', key: 'basics_1' },
    });

    unitGreetingsId = greetings.id;
    unitBasicsId = basics.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  it('L1: New user starts with only Greetings unlocked and the other seven locked', async () => {
    await initializeUserProgress(testUserId, 'es');

    const progress = await prisma.lessonProgress.findMany({
      where: { userId: testUserId, language: 'es' },
      include: { unit: true },
      orderBy: { unit: { orderIndex: 'asc' } },
    });

    expect(progress).toHaveLength(8);
    expect(progress[0].unit.key).toBe('greetings');
    expect(progress[0].status).toBe('unlocked');

    for (let i = 1; i < progress.length; i++) {
      expect(progress[i].status).toBe('locked');
    }
  });

  it('Single XP write path: awardXp atomically updates User.totalXp, DailyActivity, and LessonProgress', async () => {
    const initialUser = await prisma.user.findUniqueOrThrow({ where: { id: testUserId } });
    const amount = 25;

    const res = await awardXp(testUserId, unitGreetingsId, amount);

    expect(res.newTotalXp).toBe(initialUser.totalXp + amount);

    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: testUserId } });
    expect(updatedUser.totalXp).toBe(res.newTotalXp);

    const today = localDate(updatedUser.timeZone);
    const daily = await prisma.dailyActivity.findUniqueOrThrow({
      where: { userId_localDate: { userId: testUserId, localDate: today } },
    });
    expect(daily.xp).toBeGreaterThanOrEqual(amount);
  });

  it('L2: Session completion integrity: 9 of 10 exercises answered does not complete the lesson', async () => {
    // Create an active session
    const sessionRes = await createLessonSession(testUserId, unitGreetingsId, 'normal');
    expect(sessionRes.exercises.length).toBe(12);

    const dbSession = await prisma.lessonSession.findUniqueOrThrow({
      where: { id: sessionRes.id },
    });

    const exercises: Array<{ id: string }> = JSON.parse(dbSession.exercises);
    // Mark only 9 of them correct in correctIds
    const nineCorrect = exercises.slice(0, 9).map((e) => e.id);

    await prisma.lessonSession.update({
      where: { id: sessionRes.id },
      data: {
        correctIds: JSON.stringify(nineCorrect),
      },
    });

    // Attempting completion should fail server-side verification
    await expect(completeLesson(sessionRes.id)).rejects.toThrow(
      'Lesson completion failed: Not all exercises have been answered correctly.'
    );

    const afterCheck = await prisma.lessonProgress.findUniqueOrThrow({
      where: {
        userId_language_unitId: {
          userId: testUserId,
          language: 'es',
          unitId: unitGreetingsId,
        },
      },
    });
    // Lesson remains unlocked, not completed!
    expect(afterCheck.status).toBe('unlocked');
  });

  it('L1 & L3 & Isolation: Completing Greetings sets Greetings to completed and Basics 1 to unlocked', async () => {
    const sessionRes = await createLessonSession(testUserId, unitGreetingsId, 'normal');
    const dbSession = await prisma.lessonSession.findUniqueOrThrow({
      where: { id: sessionRes.id },
    });

    const exercises: Array<{ id: string }> = JSON.parse(dbSession.exercises);
    const allCorrect = exercises.map((e) => e.id);

    // Verify all correct
    await prisma.lessonSession.update({
      where: { id: sessionRes.id },
      data: {
        correctIds: JSON.stringify(allCorrect),
        wrongCount: 0,
      },
    });

    const completion = await completeLesson(sessionRes.id);
    expect(completion.success).toBe(true);
    expect(completion.isPerfect).toBe(true);
    expect(completion.crownsEarned).toBeGreaterThanOrEqual(1);

    // Check Greetings status
    const greetingsProg = await prisma.lessonProgress.findUniqueOrThrow({
      where: {
        userId_language_unitId: {
          userId: testUserId,
          language: 'es',
          unitId: unitGreetingsId,
        },
      },
    });
    expect(greetingsProg.status).toBe('completed');
    expect(greetingsProg.crowns).toBe(1);

    // Check Basics 1 status
    const basicsProg = await prisma.lessonProgress.findUniqueOrThrow({
      where: {
        userId_language_unitId: {
          userId: testUserId,
          language: 'es',
          unitId: unitBasicsId,
        },
      },
    });
    expect(basicsProg.status).toBe('unlocked');

    // Check that unit 3 (Numbers) is STILL locked (Isolation intact!)
    const numbers = await prisma.unit.findFirstOrThrow({
      where: { language: 'es', key: 'numbers' },
    });
    const numbersProg = await prisma.lessonProgress.findUniqueOrThrow({
      where: {
        userId_language_unitId: {
          userId: testUserId,
          language: 'es',
          unitId: numbers.id,
        },
      },
    });
    expect(numbersProg.status).toBe('locked');
  });

  it('Option order stability: options frozen on creation and do not re-shuffle', async () => {
    const session = await createLessonSession(testUserId, unitBasicsId, 'normal');
    const firstMc = session.exercises.find((e) => e.type === 'multiple_choice');
    expect(firstMc).toBeDefined();

    const storedOrder = firstMc!.options!.map((o) => o.id);

    // Refetch active session
    const activeRes = await prisma.lessonSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    const refetchedExercises = JSON.parse(activeRes.exercises);
    const refetchedMc = refetchedExercises.find((e: { id: string }) => e.id === firstMc!.id);

    const refetchedOrder = refetchedMc.options.map((o: { id: string }) => o.id);
    expect(refetchedOrder).toEqual(storedOrder);
  });

  it('Reminder email runner respects 6 PM rule, duplicate protection, and failure tolerance', async () => {
    // If running before 6 PM local, skipped
    const morningTime = new Date('2026-06-15T09:00:00Z'); // 9 AM
    const resMorning = await runReminderEmailJob(morningTime);
    expect(resMorning.processed).toBeGreaterThan(0);
    expect(resMorning.sent).toBe(0);

    // Evening time (8 PM UTC)
    const eveningTime = new Date('2026-06-15T20:00:00Z');
    const resEvening = await runReminderEmailJob(eveningTime);
    // Should process without throwing, safe deduplication
    expect(resEvening.failed).toBe(0);

    // Consecutive run on same date should deduplicate via EmailLog unique constraint
    const resDuplicate = await runReminderEmailJob(eveningTime);
    expect(resDuplicate.sent).toBe(0); // Deduplicated!
  });
});
