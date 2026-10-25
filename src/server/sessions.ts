import { prisma } from '@/lib/db';
import { compareAnswers } from '@/lib/normalize';
import { computeHearts, loseHeart } from './hearts';
import { isDifficultyUnlocked, Difficulty } from './crowns';
import { completeLesson, CompleteLessonResult } from './lessons';

export interface ExerciseOption {
  id: string;
  text: string;
}

export interface PairCard {
  id: string;
  text: string;
  pairId: string;
}

export interface BaseExercise {
  id: string;
  type: 'multiple_choice' | 'translate' | 'tap_pairs' | 'listen_type';
  instruction: string;
  prompt?: string;
  options?: ExerciseOption[];
  correctOptionId?: string;
  targetAnswer?: string;
  leftCards?: PairCard[];
  rightCards?: PairCard[];
  pairs?: Array<{ id: string; spanish: string; english: string }>;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function createLessonSession(
  userId: string,
  unitId: string,
  difficulty: Difficulty = 'normal'
) {
  // 1. Fetch user and check hearts
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, hearts: true, heartsUpdatedAt: true, language: true },
  });

  const heartsStatus = computeHearts(user.hearts, user.heartsUpdatedAt);
  if (heartsStatus.hearts <= 0) {
    throw new Error('Out of hearts. Refill hearts or watch an ad to continue.');
  }

  // 2. Check lesson progress status and crowns
  const progress = await prisma.lessonProgress.findUnique({
    where: {
      userId_language_unitId: {
        userId,
        language: user.language,
        unitId,
      },
    },
    include: { unit: true },
  });

  if (!progress || progress.status === 'locked') {
    throw new Error('This lesson is locked.');
  }

  if (!isDifficultyUnlocked(difficulty, progress.crowns)) {
    throw new Error(`Difficulty '${difficulty}' is locked. Earn more crowns first.`);
  }

  // 3. Fetch vocabulary for this unit
  const vocabList = await prisma.vocabulary.findMany({
    where: { unitId },
    orderBy: { position: 'asc' },
  });

  if (vocabList.length < 5) {
    throw new Error('Insufficient vocabulary items for lesson generation.');
  }

  // 4. Generate exercises
  // Normal lesson: 4 multiple choice, 3 translate, 2 pair rounds (5 pairs each), 3 listen-and-type = 12 exercises total
  const exercises: BaseExercise[] = [];
  let exIdCounter = 1;

  // Exercise type 1: 4 Multiple Choice
  const mcVocab = vocabList.slice(0, 4);
  for (const item of mcVocab) {
    const correctOpt: ExerciseOption = { id: `opt_${exIdCounter}_c`, text: item.english };
    const distractors = vocabList
      .filter((v) => v.id !== item.id && v.english !== item.english)
      .slice(0, 3)
      .map((d, idx) => ({ id: `opt_${exIdCounter}_d${idx}`, text: d.english }));

    const options = shuffleArray([correctOpt, ...distractors]);

    exercises.push({
      id: `ex_${exIdCounter++}`,
      type: 'multiple_choice',
      instruction: 'Select the correct translation',
      prompt: item.spanish,
      options,
      correctOptionId: correctOpt.id,
    });
  }

  // Exercise type 2: 3 Translate the sentence
  const transVocab = vocabList.slice(4, 7);
  for (const item of transVocab) {
    exercises.push({
      id: `ex_${exIdCounter++}`,
      type: 'translate',
      instruction: 'Translate this sentence to English',
      prompt: item.sentenceEs,
      targetAnswer: item.sentenceEn,
    });
  }

  // Exercise type 3: 2 Pair rounds (5 pairs each)
  const round1Items = vocabList.slice(0, 5);
  const round2Items = vocabList.slice(5, 10);

  for (const roundItems of [round1Items, round2Items]) {
    const pairs = roundItems.map((v, idx) => ({
      id: `pair_${exIdCounter}_${idx}`,
      spanish: v.spanish,
      english: v.english,
    }));

    const leftCards: PairCard[] = shuffleArray(
      pairs.map((p) => ({ id: `l_${p.id}`, text: p.spanish, pairId: p.id }))
    );
    const rightCards: PairCard[] = shuffleArray(
      pairs.map((p) => ({ id: `r_${p.id}`, text: p.english, pairId: p.id }))
    );

    exercises.push({
      id: `ex_${exIdCounter++}`,
      type: 'tap_pairs',
      instruction: 'Tap the matching pairs',
      pairs,
      leftCards,
      rightCards,
    });
  }

  // Exercise type 4: 3 Listen and type
  const listenVocab = vocabList.slice(7, 10);
  for (const item of listenVocab) {
    exercises.push({
      id: `ex_${exIdCounter++}`,
      type: 'listen_type',
      instruction: 'Listen and type what you hear in Spanish',
      prompt: item.spanish,
      targetAnswer: item.spanish,
    });
  }

  // 5. Create active session row in DB
  const session = await prisma.lessonSession.create({
    data: {
      userId,
      unitId,
      difficulty,
      status: 'active',
      exercises: JSON.stringify(exercises),
      currentIndex: 0,
      correctIds: JSON.stringify([]),
      wrongCount: 0,
      xpSoFar: 0,
      secondsActive: 0,
    },
    include: {
      unit: true,
    },
  });

  return sanitizeSessionForClient(session, heartsStatus.hearts);
}

export interface AnswerSubmission {
  exerciseId: string;
  optionId?: string;
  text?: string;
  matchedPairIds?: string[];
  activeSecondsDelta?: number;
}

export interface AnswerResult {
  isCorrect: boolean;
  isLessonCompleted: boolean;
  isFailed: boolean;
  correctAnswer?: string;
  hearts: number;
  session: ReturnType<typeof sanitizeSessionForClient>;
  completionResult?: CompleteLessonResult;
}

export async function submitSessionAnswer(
  sessionId: string,
  userId: string,
  submission: AnswerSubmission
): Promise<AnswerResult> {
  const session = await prisma.lessonSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { unit: true, user: true },
  });

  if (session.userId !== userId) {
    throw new Error('Unauthorized');
  }

  if (session.status !== 'active') {
    throw new Error(`Session is not active (current status: ${session.status})`);
  }

  const exercises: BaseExercise[] = JSON.parse(session.exercises);
  const correctIds: string[] = JSON.parse(session.correctIds || '[]');
  const currentExercise = exercises.find((e) => e.id === submission.exerciseId);

  if (!currentExercise) {
    throw new Error('Invalid exercise ID');
  }

  let isCorrect = false;
  let expectedDisplayAnswer = '';

  // Grade server-side
  if (currentExercise.type === 'multiple_choice') {
    isCorrect = submission.optionId === currentExercise.correctOptionId;
    const correctOpt = currentExercise.options?.find((o) => o.id === currentExercise.correctOptionId);
    expectedDisplayAnswer = correctOpt?.text ?? '';
  } else if (currentExercise.type === 'translate') {
    isCorrect = compareAnswers(submission.text || '', currentExercise.targetAnswer || '');
    expectedDisplayAnswer = currentExercise.targetAnswer || '';
  } else if (currentExercise.type === 'tap_pairs') {
    // Check all 5 pair IDs are present
    const pairIds = currentExercise.pairs?.map((p) => p.id) ?? [];
    const submittedPairs = submission.matchedPairIds ?? [];
    isCorrect = pairIds.every((pid) => submittedPairs.includes(pid));
    expectedDisplayAnswer = 'All pairs matched correctly';
  } else if (currentExercise.type === 'listen_type') {
    isCorrect = compareAnswers(submission.text || '', currentExercise.targetAnswer || '');
    expectedDisplayAnswer = currentExercise.targetAnswer || '';
  }

  // Record Answer
  await prisma.sessionAnswer.create({
    data: {
      sessionId,
      exerciseId: submission.exerciseId,
      payload: JSON.stringify(submission),
      isCorrect,
    },
  });

  const deltaSeconds = Math.min(300, Math.max(0, submission.activeSecondsDelta || 5)); // Cap idle gaps at 5 min (300s)

  if (isCorrect) {
    if (!correctIds.includes(currentExercise.id)) {
      correctIds.push(currentExercise.id);
    }

    const nextIndex = session.currentIndex + 1;
    const isCompleted = correctIds.length >= exercises.length;

    const updatedSession = await prisma.lessonSession.update({
      where: { id: sessionId },
      data: {
        correctIds: JSON.stringify(correctIds),
        currentIndex: nextIndex,
        typedDraft: null,
        secondsActive: { increment: deltaSeconds },
      },
      include: { unit: true },
    });

    const heartsStatus = computeHearts(session.user.hearts, session.user.heartsUpdatedAt);

    let completionResult: CompleteLessonResult | undefined;
    if (isCompleted) {
      completionResult = await completeLesson(sessionId);
    }

    return {
      isCorrect: true,
      isLessonCompleted: isCompleted,
      isFailed: false,
      hearts: heartsStatus.hearts,
      session: sanitizeSessionForClient(updatedSession, heartsStatus.hearts),
      completionResult,
    };
  } else {
    // Wrong answer: deduct heart, increment wrongCount, requeue exercise at end of list
    const { hearts } = await loseHeart(userId);
    const updatedWrongCount = session.wrongCount + 1;

    // Requeue exercise at the end of the session exercise list so learner must complete it
    const requeuedExercise: BaseExercise = {
      ...currentExercise,
      id: `${currentExercise.id}_retry_${updatedWrongCount}`,
    };
    exercises.push(requeuedExercise);

    const isFailed = hearts <= 0;

    const updatedSession = await prisma.lessonSession.update({
      where: { id: sessionId },
      data: {
        exercises: JSON.stringify(exercises),
        currentIndex: session.currentIndex + 1,
        wrongCount: updatedWrongCount,
        status: isFailed ? 'failed' : 'active',
        typedDraft: null,
        secondsActive: { increment: deltaSeconds },
      },
      include: { unit: true },
    });

    return {
      isCorrect: false,
      isLessonCompleted: false,
      isFailed,
      correctAnswer: expectedDisplayAnswer,
      hearts,
      session: sanitizeSessionForClient(updatedSession, hearts),
    };
  }
}

export function sanitizeSessionForClient(
  session: {
    id: string;
    unitId: string;
    difficulty: string;
    status: string;
    exercises: string;
    currentIndex: number;
    correctIds: string;
    wrongCount: number;
    typedDraft: string | null;
    xpSoFar: number;
    secondsActive: number;
    unit?: { id: string; title: string; description: string; xpReward: number; key: string };
  },
  hearts: number
) {
  const exercises: BaseExercise[] = JSON.parse(session.exercises);
  const correctIds: string[] = JSON.parse(session.correctIds || '[]');

  // Strip correct answer keys from client view for multiple choice & target answers during active play
  const sanitizedExercises = exercises.map((ex) => {
    return {
      id: ex.id,
      type: ex.type,
      instruction: ex.instruction,
      prompt: ex.prompt,
      options: ex.options,
      leftCards: ex.leftCards,
      rightCards: ex.rightCards,
      pairs: ex.pairs?.map((p) => ({ id: p.id })), // only expose pair IDs
    };
  });

  return {
    id: session.id,
    unitId: session.unitId,
    unitTitle: session.unit?.title ?? '',
    unitDescription: session.unit?.description ?? '',
    difficulty: session.difficulty,
    status: session.status,
    exercises: sanitizedExercises,
    currentIndex: session.currentIndex,
    totalExercises: exercises.length,
    completedCount: correctIds.length,
    wrongCount: session.wrongCount,
    typedDraft: session.typedDraft,
    hearts,
  };
}
