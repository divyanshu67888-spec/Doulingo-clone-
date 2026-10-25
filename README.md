# LinguaQuest 🌍🦉

LinguaQuest is a gamified language learning web app inspired by Duolingo, built strictly according to `PRD.md` and `ARCHITECTURE.md`.

## Features
- **Per-Lesson Isolation:** Exactly 1 row per (user, language, unit). Completing unit N unlocks N+1 atomically.
- **Single XP Write Path:** All XP awards pass through one server transaction updating `totalXp`, `daily_activity`, lesson XP, and triggering level-up milestones.
- **Server Authority:** Answer grading, heart pool deductions, streaks, crowns, and leagues are computed on the server.
- **4 Interactive Exercise Types:**
  - Multiple Choice (4 choices with stable options generated once and frozen)
  - Translate the Sentence (case, accent, and punctuation-agnostic comparison)
  - Tap the Pairs (5 Spanish + 5 English cards, instant matching)
  - Listen and Type (SpeechSynthesis Web Audio with Spanish voice)
- **Progression Systems:**
  - Levels 1–20 (100 XP per level, Level 20 max)
  - Crowns & Difficulty (Normal, Medium, Hard)
  - Leagues (Bronze, Silver, Gold, Sapphire, Ruby) with real-time leaderboard rankings and seed drift
- **Engagement Systems:**
  - Shared Hearts Pool (max 5, regenerates 1 every 30m, 5s Watch Ad refill)
  - Streak Tracking with local timezone handling
  - Weekly Activity Chart (7-day activity with niceCeil scaling)
  - In-app notifications with badge & dropdown
  - Scheduled reminder emails with duplicate protection and one-click unsubscribe
- **Responsive Layout:**
  - Desktop (>=1024px): Left sidebar
  - Tablet (640–1023px): Top bar with icons and labels
  - Mobile (<640px): Slim top header + fixed bottom bar with safe-area padding

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="linguaquest_secure_jwt_secret_token_12345"
CRON_SECRET="linguaquest_cron_secret_key_12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup & Seeding
```bash
npx prisma generate
npx prisma db push
npm run seed
```
Seeds all 8 units with 80 vocabulary items from Appendix A, and 25 realistic leaderboard participants.

### 4. Running the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Automated Tests
```bash
npm test
```
Runs the full Vitest suite covering lesson isolation, completion integrity, hearts math, level & league math, streak rules, timezone handling, single XP path, option stability, reminder emails, and end-to-end sync.

---

## Scheduled Job (Email Reminders Cron)
The reminder endpoint runs every 15 minutes:
- **Endpoint:** `POST /api/cron/reminders`
- **Header:** `x-cron-secret: linguaquest_cron_secret_key_12345` (or `?secret=...` via GET)
- **Cron Expression:** `*/15 * * * *`
- Only sends to users whose local time is past 6 PM, with email reminders enabled, and who haven't completed a lesson today. Unique constraint on `(userId, localDate)` prevents duplicate sends.
