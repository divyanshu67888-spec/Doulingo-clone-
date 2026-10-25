# LinguaQuest: Product Requirements Document

**Version:** 1.0 | **Type:** Responsive web app | **Inspiration:** Duolingo

## 1. Overview
LinguaQuest is a gamified language learning app. Users sign up, choose a language and level, and move through a sequential path of lessons. Each lesson has short exercises built from stored vocabulary. XP, streaks, hearts, levels, crowns, and leagues keep learners motivated.

**Goals:** make daily practice feel rewarding; keep progress accurate and persistent; work equally well on phone, tablet, and desktop.
**Out of scope for v1:** real ad SDK, true web push, weekly league groups with promotion and demotion, content for languages other than Spanish.

## 2. Users
Casual learners who want short daily sessions, mostly on mobile and sometimes on desktop.

## 3. Assumptions and decisions

| # | Topic | Decision |
|---|---|---|
| 1 | Unit order | Greetings, Basics 1, Numbers, Colors, Food & Drink, Travel, Family, Animals |
| 2 | Hearts | Per-user pool, max 5, shared across lessons, refills 1 per 30 min. |
| 3 | Lesson completion | Complete once every exercise has been answered correctly. Wrong answers cost a heart and requeue the exercise |
| 4 | XP values | 20 XP on first completion, 10 XP on replays. |
| 5 | Difficulty | Normal, Medium, Hard |
| 6 | League thresholds | Bronze 0, Silver 500, Gold 1,500, Sapphire 3,500, Ruby 7,000 total XP |
| 7 | Daily goal options | 10, 20, 30, 50 XP (default 20) |
| 8 | Reminder defaults | Streak reminder at 6 PM local time. Reminder emails on by default for new users |
| 9 | "Push reminders" toggle | Controls in-app reminders and optional browser notifications. Real web push is future work |
| 10 | Sample sentences | Spanish sentences in Appendix A |
| 11 | Weekly chart history | 7 local days ending today. Missing days stay 0 |
| 12 | Other languages | Selectable, but "Coming soon" until content exists |

## 4. Authentication and onboarding
- Sign-up (display name, email, password) and login screens. Sessions persist across visits.
- After the first login, a welcome screen asks for **language** (Spanish, French, Japanese, German, Mandarin) and **level** (Beginner, Intermediate, Advanced).
- The browser time zone is captured at sign-up and kept up to date.
- Progress is tracked per user **and per language**.

## 5. Layout and navigation
- >=1024px: Left sidebar (Home, Lessons, Leaderboard, Profile, Settings)
- 640–1023px: Top bar (logo, five items with icon and label, bell)
- <640px: Bottom bar with five items, plus slim top header with logo and bell
- Exactly one nav visible at a time.
- Active item: green, bold, `aria-current="page"`.
- Navs hidden during lesson.
- No horizontal scroll from 360px up.

## 6. Lessons
- Modal/sheet start screen: title, description, XP reward, exercise count, large green Start button.
- 4 exercise types: Multiple choice (4 options), Translate the sentence, Tap the pairs (5 pairs), Listen and type.
- Shared hearts pool (max 5). 0 hearts -> Out of hearts screen (Retry, Watch Ad 5s).
- Session state saved on server; resume where left off.
- Normal lesson: 4 multiple choice, 3 translate, 2 pair rounds, 3 listen-and-type.
- Server grades answers. Typed answers trim, lowercase, ignore accents and punctuation.
- Completion screen: XP earned, streak flame, Perfect Lesson badge (0 mistakes), level-up message if applicable, confetti, Continue button.
- Status: locked, unlocked, completed. Greetings starts unlocked.

## 7. Dashboard
- Greeting: `Welcome back, {displayName}!` exactly.
- Daily Goal bar, Continue Learning button directly below.
- Stat cards: streak (orange), XP (yellow, today's & all-time), hearts (red), lessons (blue).
- Level badge.

## 8. Progression
- Level = min(20, floor(totalXP / 100) + 1). Max level says "Max level".
- Crowns: 1 (Normal), 2 (Medium), 3 (Hard).
- Leagues: Bronze, Silver, Gold, Sapphire, Ruby.
- Leaderboard: ~25 seeded users + real users, sorted by total XP desc. Top 10 + user row if outside.

## 9. Engagement systems
- Hearts: refills 1 per 30m, max 5. Watch Ad refills to 5.
- Sounds: Web Audio API (correct, wrong, completion, level-up).
- Notifications: Bell in header. Types: streak reminder, level-up, rank change.
- Reminder email: cron job every 15m, sent after 6 PM local if no lesson completed today.

## 10. Profile
- Longest streak, Time spent learning ("Xh Ym"), Weekly Activity chart (7 days), Edit Profile (name, photo, goal).

## 11. Settings
- Toggles: sound, in-app/browser reminders, email reminders. Change language, daily goal, Sign Out.

## Appendix A: Spanish vocabulary seed data (80 items)
Greetings (10), Basics 1 (10), Numbers (10), Colors (10), Food & Drink (10), Travel (10), Family (10), Animals (10).
