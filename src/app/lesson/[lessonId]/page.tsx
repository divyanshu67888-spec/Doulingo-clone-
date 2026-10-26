'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStats } from '@/hooks/useUserStats';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { soundManager } from '@/lib/sounds';
import { X, Heart, CheckCircle2, XCircle } from 'lucide-react';

// Exercise components
import { MultipleChoice } from '@/components/exercises/MultipleChoice';
import { TranslateSentence } from '@/components/exercises/TranslateSentence';
import { TapPairs } from '@/components/exercises/TapPairs';
import { ListenType } from '@/components/exercises/ListenType';
import { OutOfHearts } from '@/components/exercises/OutOfHearts';
import { CompletionScreen } from '@/components/exercises/CompletionScreen';
import { CompleteLessonResult } from '@/server/lessons';

interface SanitizedExercise {
  id: string;
  type: 'multiple_choice' | 'translate' | 'tap_pairs' | 'listen_type';
  instruction: string;
  prompt?: string;
  options?: Array<{ id: string; text: string }>;
  leftCards?: Array<{ id: string; text: string; pairId: string }>;
  rightCards?: Array<{ id: string; text: string; pairId: string }>;
  pairs?: Array<{ id: string }>;
}

interface ActiveSessionData {
  id: string;
  unitId: string;
  unitTitle: string;
  difficulty: string;
  status: string;
  exercises: SanitizedExercise[];
  currentIndex: number;
  totalExercises: number;
  completedCount: number;
  wrongCount: number;
  typedDraft: string | null;
  hearts: number;
}

export default function LessonScreen({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const router = useRouter();
  const { lessonId } = use(params);
  const { stats, invalidateStats } = useUserStats();

  const [session, setSession] = useState<ActiveSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Leave confirm modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Exercise interaction states
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [typedValue, setTypedValue] = useState<string>('');
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer?: string;
  } | null>(null);

  // Completion state
  const [completionResult, setCompletionResult] = useState<CompleteLessonResult | null>(null);

  // Time active tracking
  const lastActiveTimestamp = useRef<number | null>(null);

  useEffect(() => {
    lastActiveTimestamp.current = Date.now();
  }, []);

  const soundEnabled = stats?.settings?.soundEnabled ?? true;

  // 1. Load active session or resume
  useEffect(() => {
    async function loadSession() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/sessions/active?unitId=${lessonId}`);
        const data = await res.json();

        if (data.session) {
          setSession(data.session);
          if (data.session.typedDraft) {
            setTypedValue(data.session.typedDraft);
          }
        } else {
          // Create new session
          const createRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unitId: lessonId, difficulty: 'normal' }),
          });
          const createData = await createRes.json();
          if (!createRes.ok) {
            throw new Error(createData.error || 'Failed to start lesson');
          }
          setSession(createData);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading lesson');
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [lessonId]);

  // Debounced draft save
  useEffect(() => {
    if (!session || !typedValue || isSubmitted) return;
    const timer = setTimeout(() => {
      fetch(`/api/sessions/${session.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: typedValue }),
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [typedValue, session, isSubmitted]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#121212]">
        <div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-[#121212]">
        <p className="text-red-500 font-bold mb-4">{error || 'Session not found'}</p>
        <Button onClick={() => router.push('/home')}>Back to Home</Button>
      </div>
    );
  }

  // Out of hearts disabled: lifeline is unlimited
  if (session.status === 'failed') {
    return (
      <OutOfHearts
        nextHeartInSeconds={stats?.hearts.nextHeartInSeconds ?? 1800}
        onAdFinished={async () => {
          const res = await fetch('/api/hearts/watch-ad', { method: 'POST' });
          const adData = await res.json();
          setSession((prev) => (prev ? { ...prev, hearts: adData.hearts, status: 'active' } : prev));
          invalidateStats();
        }}
        onRetry={async () => {
          const createRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unitId: lessonId, difficulty: session.difficulty }),
          });
          const createData = await createRes.json();
          if (createRes.ok) {
            setSession(createData);
            setSelectedOptionId(null);
            setTypedValue('');
            setMatchedPairIds([]);
            setIsSubmitted(false);
            setAnswerFeedback(null);
          }
        }}
      />
    );
  }

  // Check if completion is shown
  if (completionResult) {
    return (
      <CompletionScreen
        xpAwarded={completionResult.xpAwarded}
        currentStreak={completionResult.currentStreak}
        isPerfect={completionResult.isPerfect}
        leveledUp={completionResult.leveledUp}
        newLevel={completionResult.newLevel}
        soundEnabled={soundEnabled}
        onContinue={() => {
          invalidateStats();
          router.push('/home');
        }}
      />
    );
  }

  const currentExerciseIndex = session.currentIndex;
  const currentExercise = session.exercises[currentExerciseIndex] || session.exercises[0];

  // Answer validation condition for "Check Answer" button
  let isCheckDisabled = isSubmitted || isGrading;
  if (currentExercise.type === 'multiple_choice') {
    isCheckDisabled = isCheckDisabled || !selectedOptionId;
  } else if (currentExercise.type === 'translate' || currentExercise.type === 'listen_type') {
    isCheckDisabled = isCheckDisabled || !typedValue.trim();
  } else if (currentExercise.type === 'tap_pairs') {
    const totalPairsCount = currentExercise.pairs?.length || 5;
    isCheckDisabled = isCheckDisabled || matchedPairIds.length < totalPairsCount;
  }

  // Handle wrong match inside pair exercises
  const handleWrongMatch = async () => {
    soundManager.playWrong(soundEnabled);
    try {
      const deltaSec = Math.floor((Date.now() - (lastActiveTimestamp.current ?? Date.now())) / 1000);
      lastActiveTimestamp.current = Date.now();

      const res = await fetch(`/api/sessions/${session.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: currentExercise.id,
          matchedPairIds: [], // incorrect trigger
          activeSecondsDelta: deltaSec,
        }),
      });
      const data = await res.json();
      setSession(data.session);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckAnswer = async () => {
    setIsGrading(true);
    const deltaSec = Math.floor((Date.now() - (lastActiveTimestamp.current ?? Date.now())) / 1000);
    lastActiveTimestamp.current = Date.now();

    try {
      const payload: {
        exerciseId: string;
        optionId?: string;
        text?: string;
        matchedPairIds?: string[];
        activeSecondsDelta: number;
      } = {
        exerciseId: currentExercise.id,
        activeSecondsDelta: deltaSec,
      };

      if (currentExercise.type === 'multiple_choice') {
        payload.optionId = selectedOptionId!;
      } else if (currentExercise.type === 'translate' || currentExercise.type === 'listen_type') {
        payload.text = typedValue;
      } else if (currentExercise.type === 'tap_pairs') {
        payload.matchedPairIds = matchedPairIds;
      }

      const res = await fetch(`/api/sessions/${session.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit answer');

      setIsSubmitted(true);
      setAnswerFeedback({
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
      });

      if (data.isCorrect) {
        soundManager.playCorrect(soundEnabled);
      } else {
        soundManager.playWrong(soundEnabled);
      }

      // If lesson completed
      if (data.isLessonCompleted && data.completionResult) {
        setCompletionResult(data.completionResult);
      } else {
        setSession(data.session);
      }
    } catch (err: unknown) {
      console.error('Answer check error:', err);
    } finally {
      setIsGrading(false);
    }
  };

  const handleNextExercise = () => {
    setSelectedOptionId(null);
    setTypedValue('');
    setMatchedPairIds([]);
    setIsSubmitted(false);
    setAnswerFeedback(null);
    lastActiveTimestamp.current = Date.now();
  };

  const progressPercent = Math.min(
    100,
    Math.round((session.completedCount / session.totalExercises) * 100)
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] flex flex-col justify-between select-none">
      {/* Top Header: Close Button, Progress Bar, Hearts Pool */}
      <header className="px-4 py-3 sm:py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 max-w-4xl w-full mx-auto">
        <button
          onClick={() => setIsLeaveModalOpen(true)}
          aria-label="Leave lesson"
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md">
          <ProgressBar value={progressPercent} max={100} height="14px" />
        </div>

        {/* Unlimited Hearts Indicator */}
        <div
          title="Unlimited Lifeline"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/20 text-[#FF4B4B] font-black text-sm flex-shrink-0"
        >
          <Heart className="w-5 h-5 fill-[#FF4B4B]" />
          <span className="text-base font-black leading-none">∞</span>
        </div>
      </header>

      {/* Main Exercise Interactive Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl w-full mx-auto">
        {currentExercise.type === 'multiple_choice' && (
          <MultipleChoice
            exerciseId={currentExercise.id}
            prompt={currentExercise.prompt || ''}
            instruction={currentExercise.instruction}
            options={currentExercise.options || []}
            selectedOptionId={selectedOptionId}
            onSelectOption={(optId) => !isSubmitted && setSelectedOptionId(optId)}
            isSubmitted={isSubmitted}
            isCorrect={answerFeedback?.isCorrect}
          />
        )}

        {currentExercise.type === 'translate' && (
          <TranslateSentence
            exerciseId={currentExercise.id}
            prompt={currentExercise.prompt || ''}
            instruction={currentExercise.instruction}
            typedValue={typedValue}
            onChangeValue={(val) => !isSubmitted && setTypedValue(val)}
            isSubmitted={isSubmitted}
            isCorrect={answerFeedback?.isCorrect}
          />
        )}

        {currentExercise.type === 'tap_pairs' && (
          <TapPairs
            exerciseId={currentExercise.id}
            instruction={currentExercise.instruction}
            leftCards={currentExercise.leftCards || []}
            rightCards={currentExercise.rightCards || []}
            matchedPairIds={matchedPairIds}
            onMatchPair={(pairId) => {
              setMatchedPairIds((prev) => [...prev, pairId]);
              soundManager.playCorrect(soundEnabled);
            }}
            onWrongMatch={handleWrongMatch}
            isSubmitted={isSubmitted}
          />
        )}

        {currentExercise.type === 'listen_type' && (
          <ListenType
            exerciseId={currentExercise.id}
            prompt={currentExercise.prompt || ''}
            instruction={currentExercise.instruction}
            typedValue={typedValue}
            onChangeValue={(val) => !isSubmitted && setTypedValue(val)}
            isSubmitted={isSubmitted}
            isCorrect={answerFeedback?.isCorrect}
          />
        )}
      </main>

      {/* Bottom Sticky Action / Feedback Bar */}
      <footer
        className={`border-t p-4 sm:p-6 transition-colors duration-200 ${isSubmitted
            ? answerFeedback?.isCorrect
              ? 'bg-[#58CC02]/15 border-[#58CC02]/30'
              : 'bg-[#FF4B4B]/15 border-[#FF4B4B]/30'
            : 'bg-white dark:bg-[#121212] border-gray-100 dark:border-gray-800'
          }`}
      >
        <div className="max-w-2xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Feedback message banner if answered */}
          {isSubmitted ? (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {answerFeedback?.isCorrect ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#58CC02] text-white flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-[#58CC02]">Nicely done!</h4>
                    <p className="text-xs text-gray-500 font-semibold">Keep up the great momentum</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#FF4B4B] text-white flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-lg font-black text-[#FF4B4B]">Correct solution:</h4>
                    <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200 truncate">
                      {answerFeedback?.correctAnswer}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden sm:block text-xs font-semibold text-gray-400">
              LinguaQuest Interactive Engine
            </div>
          )}

          {/* Action button: Check or Continue */}
          <div className="w-full sm:w-auto">
            {isSubmitted ? (
              <Button
                onClick={handleNextExercise}
                variant={answerFeedback?.isCorrect ? 'primary' : 'danger'}
                size="lg"
                className="w-full sm:min-w-[180px] text-lg font-black"
              >
                Continue
              </Button>
            ) : (
              <Button
                disabled={isCheckDisabled}
                onClick={handleCheckAnswer}
                variant="primary"
                size="lg"
                className="w-full sm:min-w-[180px] text-lg font-black"
              >
                {isGrading ? 'Checking...' : 'Check Answer'}
              </Button>
            )}
          </div>
        </div>
      </footer>

      {/* Leave lesson confirmation modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Leave lesson?"
        asSheetOnMobile={true}
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to exit? Your progress in this session is saved, so you can resume whenever you are ready.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsLeaveModalOpen(false)}
            >
              Keep Learning
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                setIsLeaveModalOpen(false);
                router.push('/home');
              }}
            >
              Leave
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
