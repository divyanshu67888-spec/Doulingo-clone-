# LinguaQuest: Architecture

## 1. Stack
| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS with a central design-tokens file |
| Database | PostgreSQL with Prisma ORM and migrations |
| Validation | Zod (every API input) |
| Client data | React Query (single shared user-stats source) |
| Auth | Email and password (hashed with argon2 or bcrypt), session cookie (e.g. Auth.js) |
| Audio | Web Audio API (sounds), `speechSynthesis` (listen-and-type) |
| Email | SendEmail built-in integration behind one `sendEmail()` wrapper |
| Scheduler | Cron or platform scheduled job, every 15 minutes, hitting a protected endpoint |
| Tests | Vitest (unit), Playwright (end-to-end and responsive) |

These are defaults. Keep the existing stack if the repo already has one.

## 2. Folder structure
```
linguaquest/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed/            # vocabulary.ts (Appendix A), leaderboard-seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login, signup
│  │  ├─ onboarding/
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx          # shell: one nav config, 3 layouts
│  │  │  ├─ home/  lessons/  leaderboard/  profile/  settings/
│  │  │  └─ lesson/[lessonId]/  # exercise screen, nav hidden
│  │  └─ api/
│  │     ├─ auth/  me/  stats/  lessons/  sessions/
│  │     ├─ leaderboard/  notifications/  settings/  profile/
│  │     ├─ hearts/watch-ad/
│  │     └─ cron/reminders/     # protected by secret
│  ├─ components/
│  │  ├─ nav/ (Sidebar, TopBar, BottomBar, nav.config.ts)
│  │  ├─ exercises/ (MultipleChoice, Translate, TapPairs, ListenType)
│  │  ├─ dashboard/ profile/ leaderboard/ settings/ ui/ (Button, Card, Modal, Sheet, Switch)
│  ├─ server/
│  │  ├─ xp.ts            # awardXp(): the only XP write path
│  │  ├─ hearts.ts        # getHearts(), loseHeart(), refillAll()
│  │  ├─ streak.ts        # read-time streak evaluation
│  │  ├─ levels.ts  leagues.ts  crowns.ts
│  │  ├─ lessons.ts       # unlock + complete (single-row transactions)
│  │  ├─ sessions.ts      # build session, grade answers, resume
│  │  ├─ leaderboard.ts   # ranking + seed drift + rank-change detection
│  │  ├─ notifications.ts
│  │  ├─ reminders.ts     # eligibility + email job
│  │  └─ time.ts          # localDate(tz, instant), the only date helper
│  ├─ lib/ (tokens.ts, sounds.ts, tts.ts, normalize.ts, queryClient.ts)
│  └─ styles/
├─ tests/
└─ .env.example
```

## 3. Data model (Prisma-style)

```
User(id, email unique, passwordHash, displayName, photoUrl?, timeZone,
     language, level_pref, totalXp, dailyGoal default 20,
     currentStreak, longestStreak, lastLessonLocalDate?,
     hearts default 5, heartsUpdatedAt, totalSeconds default 0,
     createdAt)

Settings(userId PK→User, soundEnabled default true,
         remindersEnabled default true,      # in-app / browser
         emailRemindersEnabled default true) # email

Vocabulary(id, language, unitId, spanish, english,
           sentenceEs, sentenceEn, position)

Unit(id, language, key, title, description, orderIndex, xpReward, exerciseCount)

LessonProgress(id, userId, language, unitId,
               status ENUM(locked, unlocked, completed),
               crowns int 0..3 default 0,
               xpEarned default 0, completedAt?,
               UNIQUE(userId, language, unitId))

LessonSession(id, userId, unitId, difficulty ENUM(normal, medium, hard),
              status ENUM(active, completed, failed, abandoned),
              exercises JSON,        # ordered list, options + card orders frozen here
              currentIndex, correctIds JSON, wrongCount,
              typedDraft?, xpSoFar, secondsActive,
              startedAt, updatedAt, completedAt?)

SessionAnswer(id, sessionId, exerciseId, payload JSON, isCorrect, createdAt)

DailyActivity(userId, localDate, xp default 0, seconds default 0,
              PRIMARY KEY(userId, localDate))

Notification(id, userId, type ENUM(streak_reminder, level_up, rank_change),
             message, readAt?, createdAt, dedupeKey UNIQUE per user)

LeaderboardUser   # seeds are User rows with isSeed=true and a driftPerDay field

EmailLog(id, userId, localDate, status ENUM(sending, sent, failed),
         attempts, sentAt?, UNIQUE(userId, localDate))
```

Notes:
- `LessonProgress` is the only place lesson state lives, with one row per user, language, and unit, created at sign-up. There is no global completion flag.
- Level, league, and "today's XP" are never stored. They are derived from `totalXp` and `DailyActivity`.
- Existing progress data is wiped by the migration that introduces this table, and client-side cached progress is cleared on first load after the migration (version-keyed cache).

## 4. Core server functions

### 4.1 Time (`time.ts`)
`localDate(tz, instant) → 'YYYY-MM-DD'`. It is used for streaks, daily XP, the chart, reminders, and notifications dedupe. Nothing else formats dates for these purposes.

### 4.2 XP (`xp.ts`): `awardXp(userId, lessonId, amount)`
One transaction: `User.totalXp += amount`; upsert `DailyActivity(userId, today)` with `xp += amount`; `LessonProgress.xpEarned += amount` for that one row; compute old and new level and create exactly one `level_up` notification (dedupe key `level:N`) if a threshold was crossed. Returns the new stats and a `leveledUp` flag. No other module writes `totalXp`.

### 4.3 Hearts (`hearts.ts`)
`getHearts(user, now)` = `min(5, hearts + floor((now − heartsUpdatedAt) / 30min))`. When it reaches the cap, no timer runs. On a loss: materialize the current value, subtract 1, and set `heartsUpdatedAt = now` only if the user was previously at cap, otherwise advance it by the whole windows consumed so partial progress carries over. Watch Ad sets hearts to 5 and `heartsUpdatedAt = now`, with a cooldown. Every screen calls this one function through the stats endpoint.

### 4.4 Streak (`streak.ts`)
On lesson completion (once per local date): if `lastLessonLocalDate` is yesterday, `currentStreak += 1`; if today, no change; otherwise set it to 1. Then `longestStreak = max(longestStreak, currentStreak)`. At read time, if `lastLessonLocalDate` is older than yesterday, the displayed current streak is 0 (stored values are not rewritten on read, and longest is never touched).

### 4.5 Levels and leagues
`level = min(20, floor(totalXp/100)+1)`; progress = `(totalXp mod 100)/100`, and max level has no next target. League thresholds: 0, 500, 1500, 3500, 7000; the note = next threshold − totalXp.

### 4.6 Lessons (`lessons.ts`)
`completeLesson(sessionId)`: loads the session, verifies on the server that every exercise in `exercises` appears in `correctIds`, and then in one transaction sets `LessonProgress[user, unit].status = completed` (only that row), sets the next unit's row from `locked` to `unlocked` (only that row), awards crowns for the session difficulty (`crowns = max(crowns, n)`, subject to the unlock rules), updates the streak, and awards XP. Any partial or duplicate call is a no-op (idempotent on session status).

## 5. Lesson engine

### 5.1 Session creation (`POST /api/sessions`)
1. Reject if the user has 0 hearts, or if the unit is `locked`. Medium and Hard require crowns ≥ 1 and ≥ 2.
2. Build the exercise list from the unit's 10 vocabulary rows (Normal: 4 multiple choice, 3 translate, 2 pair rounds, 3 listen-and-type).
3. Multiple choice: the correct answer plus 3 distractors from the same unit, shuffled **once** with a seeded shuffle, and the final order stored in `exercises` JSON. Pair rounds: each column is shuffled once and stored. Each option and card has a stable ID, never a position.
4. Save the session, return it.

### 5.2 Answering (`POST /api/sessions/:id/answer`)
Body: `{ exerciseId, optionId | text | matchedPairIds }`. The server loads its stored copy and grades it. Typed text is compared after trim, lowercase, accent stripping, and punctuation removal. On a wrong answer: lose a heart (shared pool), increment `wrongCount`, and requeue the exercise. On a correct one: add to `correctIds`, advance `currentIndex`. When every exercise is correct it calls `completeLesson`. When hearts hit 0 the session is marked `failed`. Returns the new session state, hearts, and the correct answer on a wrong attempt.

### 5.3 Resume (`GET /api/sessions/active?unitId=`)
Returns the stored session, including frozen option orders and `typedDraft`. The client never regenerates options.

### 5.4 Client exercise pattern (applies to all four components)
```
const [selectedId, setSelectedId] = useState<string|null>(null);  // ID, not index
const options = session.exercises[i].options;                      // from server, never shuffled in render
<Option selected={opt.id === selectedId} onClick={() => setSelectedId(opt.id)} />
<Button disabled={!selectedId} onClick={() => submit({exerciseId, optionId: selectedId})} />
```
Typed inputs keep one controlled state and submit that exact value. A draft is saved debounced. Audio replay is a pure side effect with no state change. Pair matching tracks matched pair IDs, with matched cards locked.

### 5.5 Time tracking
Active time accrues per session via heartbeat or on answer, with each gap capped at 5 minutes. It writes to `LessonSession.secondsActive`, `User.totalSeconds`, and `DailyActivity.seconds`.

## 6. Leaderboard and leagues
- Query: all users ordered by `totalXp DESC, createdAt ASC`; take the top 10; if the current user's rank > 10, also return their row with the true rank (computed with a window function).
- Seed users: about 25 rows with `isSeed=true`, realistic usernames, XP spread low to high, and a small `driftPerDay` applied lazily on read (computed from elapsed days) so XP rises slowly and consistently.
- Rank-change detection: when the leaderboard is computed, compare the user's rank with their stored `lastKnownRank`. If it worsened because a specific user passed them, create a `rank_change` notification with dedupe key `rank:{overtakerId}:{localDate}`.
- Client refetches on focus and polls about every 30–60 s.

## 7. Notifications
- API: `GET /api/notifications` (latest ~10 plus unread count), `POST /api/notifications/read`.
- Streak reminder: created on app load if past 6 PM local, no lesson completed today, and the reminders setting is on (dedupe key `streak:{localDate}`).
- Level-up is created inside `awardXp`. Rank change is created by the leaderboard computation.
- The browser Notification API is used optionally if permission is granted.

## 8. Reminder email job (`/api/cron/reminders`)
Protected by a secret header. Runs every ~15 minutes.
```
for each user where Settings.emailRemindersEnabled and email present:
   today = localDate(user.timeZone, now)
   if localHour(user.timeZone) < 18: continue
   if user.lastLessonLocalDate == today: continue
   try INSERT EmailLog(userId, today, 'sending')   # unique constraint
   if conflict: continue                           # already handled today
   send via sendEmail(); mark 'sent' or 'failed' (limited retry same day)
```
Insert-before-send makes overlapping runs safe. Errors are caught per user so one failure never stops the job. The email template HTML-escapes the name, shows the streak (or the "start a new streak" line when 0), the unfinished daily goal, an **Open LinguaQuest** button, and a footer with a Settings link and a signed one-click unsubscribe token.

## 9. Stats endpoint and client sync
`GET /api/stats` returns one object: total XP, today's XP, level and progress, league and next-league gap, current and longest streak, hearts and next-heart time, unlocked and completed counts, per-lesson status and crowns, daily goal, and unread notifications. `GET /api/stats/weekly` returns 7 `{localDate, weekday, xp}` entries for the last 7 local dates ending today, filling zeros for missing days.

The client keeps this in one React Query cache. After any lesson completion, ad refill, settings change, or profile edit, the relevant queries are invalidated. The profile also refetches on focus and at local midnight rollover.

## 10. Weekly chart rendering
`axisMax = niceCeil(max(daily xp))`, where `niceCeil` rounds up to 10, 25, 50, 100, 150… style steps. If all days are 0, use 50 and show the empty-state note. Draw 4–5 gridlines with labels. Bar height = `xp / axisMax`, with a minimum visible height for xp > 0 and no fill for 0. Today's bar uses `#58CC02`, others a muted tone. Use SVG or flex, `viewBox`-scaled so it fits 360px with no horizontal scroll, and add `aria-label` summaries.

**Backfill migration:** rebuild `DailyActivity` from `LessonProgress.completedAt`/`xpEarned` and session records where available, and ensure today's value is at least the XP the dashboard's Daily Goal bar already shows. Unrecoverable days stay 0.

## 11. Frontend architecture

### Navigation
`nav.config.ts` defines `[{label, icon, href}]` for the five items. `Sidebar` (≥1024px), `TopBar` (640–1023px), and `BottomBar` (<640px) all render from it, and only one is mounted per breakpoint (via CSS display or a `useMediaQuery` hook). Active state: `usePathname().startsWith(href)`, which gives green plus bold plus `aria-current="page"`. Bottom bar: `position: fixed`, `padding-bottom: env(safe-area-inset-bottom)`, content gets matching bottom padding. Modals, sheets, and the bell dropdown use a z-index above the nav. Lesson routes render without the nav.

### Design tokens (`tokens.ts`)
Colors (`green #58CC02`, `greenDark #46A302`, streak orange, XP yellow, hearts red, lessons blue, league colors), radii (pill, card), shadow levels, spacing scale, icon sizes (one icon set), motion durations. Components read tokens only.

### UI primitives
`Button` (pill, min-height 48px, pressed bottom-edge shadow, full-width on mobile for primary), `Card` (subtle shadow), `Modal` and `Sheet` (centered dialog at ≥640px, bottom or full-screen sheet below), `Switch` (labeled, accessible), `Toast`.

### Effects
- `sounds.ts`: tiny oscillator and gain envelopes for correct, wrong, complete, and level-up, at low volume. It checks `soundEnabled` before every play and wraps everything in try/catch.
- Confetti: a lightweight canvas or CSS effect on the completion screen that does not block the Continue button. It is disabled under `prefers-reduced-motion`, as are the pulsing node and page transitions.
- Page transitions: 200–300 ms fade-and-slide.

## 12. Security and quality
- Hash passwords, validate all input with Zod, and rate-limit auth and watch-ad endpoints.
- Authorize every query by session user ID. Never trust a client-sent user ID.
- Uploads: type and size checks (JPG, PNG, WebP up to 2 MB), server-side re-encode or crop, store outside the web root or in object storage.
- Escape all user-provided strings in emails and the UI.
- Cron endpoint requires a secret. Unsubscribe tokens are signed and expire.

## 13. Testing plan
- **Unit:** lesson isolation (completing one unit changes exactly one row plus one unlock), completion integrity (9 of 10 doesn't complete), hearts math (including cap and carry-over), level and league thresholds, streak transitions, `localDate` around midnight in several time zones, `awardXp` updating total and daily together, answer grading and normalization, option-order stability across re-renders and resume, reminder eligibility and de-dupe.
- **End-to-end:** the sync test from `PRD.md` (Y1), navigation at 360, 768, and 1280px, no horizontal scroll, tap-target sizes, reduced-motion behavior, and settings persistence across logout and login.

## 14. Build order
1. Schema, auth, tokens, seed → 2. App shell and nav → 3. Onboarding, dashboard, lesson path → 4. Lesson engine and sessions → 5. Levels, crowns, leagues, leaderboard → 6. Profile, chart, Settings → 7. Sounds, notifications, hearts refill, email job → 8. Audit and polish against `PRD.md` sections 12–15.
