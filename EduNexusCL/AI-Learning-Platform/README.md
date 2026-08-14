# EduNexus — AI-Powered Personalized Learning & Early Intervention Platform

An SIH 2026 hackathon prototype. Detects where a student's understanding
breaks down, diagnoses the likely prerequisite gap, builds a personalized
learning path, and gives teachers early-intervention visibility — all
from real, transparent, rule-based analysis of quiz performance (no
external services, no build step, works fully offline once loaded).

> **Detect → Diagnose → Personalize → Intervene → Measure Improvement**

---

## 1. Quick Start

No build tools, no server, no npm install required.

1. Unzip the project.
2. Open `index.html` directly in a browser (double-click it), **or**
   serve the folder with any static server for the best experience:
   ```bash
   cd AI-Learning-Platform
   python3 -m http.server 8080
   # then visit http://localhost:8080
   ```
3. Log in with one of the demo accounts below.

The first page load seeds ~18 students' worth of realistic quiz history
into `localStorage` automatically (see `data/seed.js`) — nothing to
configure, the dashboards are populated immediately.

### Demo Login Credentials

| Role    | Email or ID          | Password    |
|---------|------------------------|-------------|
| Student | student@test.com       | student123  |
| Teacher | teacher@test.com       | teacher123  |

You can also **register a new account** from the login page ("Create Account"
tab). Registration auto-generates a unique ID:
- **Student ID** = first 4 letters of the school name (uppercased, padded if
  short) + roll number, e.g. `ABC Public School` + roll `0245` → `ABCP0245`.
- **Teacher ID** = first 4 letters of the school name + last 4 digits of the
  mobile number (only those 4 digits are ever stored). Duplicate IDs are
  rejected with a live availability check as you type.
You can log in with either the registered email or the generated ID.

The demo **student** account is *Rahul Sharma* — the featured presentation
scenario (see below).

Other student accounts (`priya.v@test.com`, `aman.y@test.com`,
`yash.m@test.com` … all password `pass123`) are visible in the teacher's
class roster and span strong / average / struggling / at-risk profiles.

---

## 2. UI/UX Features

- **Collapsible sidebar** (desktop) — smooth width transition; a menu
  button always stays visible/clickable even when collapsed, with
  hover tooltips on the icon-only state. Persists across reloads.
- **Light / dark theme** — toggle from the floating top-right button or
  Settings; a full dedicated dark palette (not just inverted colors),
  persisted in `localStorage`, and synced to Chart.js's colors too.
- **Reduced motion** — respects `prefers-reduced-motion` automatically,
  and can be forced on/off from Settings; every animation in the app
  checks this flag.
- **Reading character + Learning Journey** — a small decorative character
  walks along the dashboard's journey track, does a 360° spin at each
  end, and reverses — confined to its own track so it never covers
  content, and hidden entirely under reduced motion.
- **Micro-interactions** — cards lift on hover, buttons nudge their icon
  and lift with a shadow, sidebar links expand slightly, quiz options
  fade in staggered, all in the 150–300ms range with CSS transitions
  (no animation libraries).
- **Animated counters** — KPI numbers and the result-page score ring
  count up from 0 on load.
- **Gamified toasts** — a streak milestone (every 5 days) surfaces a
  small toast notification.
- **Smart empty states** — every list/table has a real "nothing here
  yet, here's what to do" state instead of a blank screen.

---

## 3. Main Demo Flow

```
Student Login (student@test.com)
      ↓
Student Dashboard  — KPIs, Learning Journey, AI insight card, charts, weak topics
      ↓
My Subjects → Mathematics → Factorization
      ↓
Take Quiz  (adaptive difficulty picked from Rahul's own accuracy)
      ↓
Submit Quiz → "Analyzing your performance…" → Analysis Complete
      ↓
Result Page — animated score ring, topic analysis, AI insight
      ↓
Learning Path  — personalized, prerequisite-aware step sequence (builds in sequentially)
      ↓
Take Adaptive Quiz  (from the path's CTA)
      ↓
Teacher Login (teacher@test.com)
      ↓
Class Overview  — KPIs, at-risk alert banner, risk chart, roster
      ↓
Click Rahul Sharma
      ↓
Student Analysis — gap, risk breakdown, AI intervention recommendation
```

Every button on every page performs a real, visible action — there are
no placeholder/dead-end buttons.

---

## 4. Project Structure

```text
AI-Learning-Platform/
│
├── index.html                 Login + Student/Teacher registration
├── student-dashboard.html     KPIs, journey, AI insight, charts, weak topics
├── subjects.html               Subject grid + per-subject topic breakdown
├── quizzes.html                 Quiz history log
├── quiz.html                   Adaptive quiz engine (timer, nav, submit)
├── result.html                 Score ring, topic analysis, AI insight
├── learning-path.html          AI-generated personalized step sequence
├── progress.html                Full cross-subject progress + trend chart
├── ai-insights.html             Every detected weak-topic/gap, not just one
├── achievements.html            Gamified badges from real performance data
├── settings.html                 Theme, motion, account (shared both roles)
│
├── teacher-dashboard.html      Class overview, at-risk alert, roster
├── student-analysis.html       Per-student gap/risk/intervention detail
├── early-intervention.html      Filtered Medium/High-risk roster + actions
├── analytics.html               Class-wide charts (subject/risk/difficulty)
├── teacher-subjects.html        Read-only curriculum/prerequisite reference
├── question-bank.html           Full question list, filterable by subject
│
├── css/
│   ├── style.css                Design tokens (incl. dark theme), sidebar,
│   │                            forms, buttons, auth pages, tooltips
│   ├── dashboard.css            KPI cards, quiz UI, journey/character,
│   │                            score ring, toasts, badges, settings
│   └── responsive.css           Tablet/mobile breakpoints
│
├── js/
│   ├── app.js                   Auth guard, sidebar+collapse, theme,
│   │                            reduced motion, counters, toasts,
│   │                            reading character/journey, chart theming
│   ├── auth.js                  Login + registration (ID generation/validation)
│   ├── analysis.js               Raw events → scores/accuracy/response time
│   ├── ai-engine.js              Weak-topic/gap/risk/adaptive/path logic
│   ├── student.js / subjects.js / quiz.js / result.js / learning-path.js
│   ├── quizzes.js / progress.js / ai-insights.js / achievements.js / settings.js
│   └── teacher.js / student-analysis.js / early-intervention.js /
│       analytics.js / teacher-subjects.js / question-bank.js
│
├── data/
│   ├── subjects.js / topics.js / questions.js    Curriculum + question bank
│   ├── students.js / teachers.js                  Demo roster + registration
│   │                                              (custom accounts merged
│   │                                               from localStorage)
│   └── seed.js                    Deterministic demo-data generator
│
├── assets/
└── README.md
```

---

## 5. Data Model & Enrollment

```
Student → Enrollment → Subject → Topic → Question
```

Students are **not** all enrolled in the same subjects — see
`data/students.js`, where each student has a `subjects: [...]` array
(three enrollment sets: Math/Programming/DBMS, Math/Physics/Digital
Electronics, and Programming/DBMS/Digital Electronics). The subjects
page, dashboard, and quiz engine only ever surface a student's own
enrolled subjects.

Every topic optionally declares a `prerequisite` (see `data/topics.js`),
forming chains such as:

```
Algebra → Factorization → Quadratic Equations
Variables → Conditions → Loops → Arrays → Functions
SQL → Normalization
SQL → ER Diagrams
```

This chain is what the prerequisite-gap detector walks.

### Quiz attempt data

Every answered question is recorded as one "event" in `localStorage`
(`aelp_attempts_<studentId>`):

```js
{ id, date, sessionId, subjectId, topicId, questionId,
  selectedIndex, isCorrect, difficulty, responseTime }
```

All analytics (accuracy, response time, mistakes, trends) are computed
live from these events by `js/analysis.js` — nothing is pre-baked
separately from what a real quiz attempt would produce. Demo history is
generated by `data/seed.js` on first load using the exact same event
shape, so seeded data and live quiz data are indistinguishable to the
rest of the app.

---

## 6. AI Logic (transparent, rule-based — not trained ML)

All thresholds live in one place, `AI_CONFIG` at the top of
`js/ai-engine.js`, so they're easy to tune or explain in a demo.

| Feature | How it works |
|---|---|
| **Weak topic detection** | `< 50%` accuracy = Weak, `50–70%` = Needs Improvement, `> 70%` = Strong. Needs ≥3 attempts to render a verdict. |
| **Repeated mistake detection** | Same question missed ≥2 times on a topic the student is already weak/needs-improvement in. |
| **Response-time analysis** | Flags "possible conceptual difficulty" only when slow answers (avg > 38s) are *combined* with sub-70% accuracy on that topic — response time alone never proves anything, per the brief's requirement. |
| **Risk score** | Low Accuracy (+30, overall < 55%) · Repeated Mistakes (+25) · High Response Time (+15) · Recent Performance Drop (+20, needs ≥8 attempts on that topic to avoid small-sample noise) · Low Activity (+10, < 15 total attempts). 0–30 Low · 31–60 Medium · 61–100 High. |
| **Prerequisite gap detection** | If a topic is weak **and** its declared prerequisite is also weak/needs-improvement/unrated, the prerequisite is surfaced as the likely root cause (e.g. *Quadratic Equations weak → Factorization is the gap*). |
| **Adaptive quiz difficulty** | `< 40%` recent accuracy → Easy questions, `40–70%` → Medium, `> 70%` → Hard. Recalculated per subject (or per topic for a focused quiz) from the student's own history every time a quiz starts. |
| **Personalized learning path** | Built from the weakest topic + its detected gap: *Review prerequisite basics → Revise → Practice 5 questions → Take assessment → Learn the target topic → Take adaptive quiz.* Falls back to a simple revise/practice/adaptive sequence when there's no prerequisite gap, or a "keep practicing" message when there's no weak topic at all. |

The prototype is described accurately throughout as **data-driven
performance analysis + prerequisite-aware reasoning + adaptive decision
logic + AI-assisted recommendations** — not trained machine learning.

---

## 7. Testing Checklist

**Student:** Login ✓ · Dashboard ✓ · Subjects ✓ · Topics ✓ · Quiz ✓ ·
Timer ✓ · Submit ✓ · Result ✓ · Performance ✓ · Weak topic ✓ ·
Prerequisite gap ✓ · Learning path ✓ · Adaptive quiz ✓

**Teacher:** Login ✓ · Dashboard ✓ · Student list ✓ · Risk level ✓ ·
Student analysis ✓ · Intervention recommendation ✓

**UI:** Desktop ✓ · Tablet ✓ · Mobile (collapsible sidebar drawer) ✓ ·
Navigation ✓ · Buttons ✓ · Charts ✓ · No broken/dead-end pages ✓

All of the above were additionally verified with an automated headless
DOM smoke test (every page load + full click-through quiz + login +
risk-filter + tab-switch flows) with zero runtime errors across every
seeded student.

---

## 8. Android Studio WebView / APK Packaging

The app is a pure static site with no server dependency, touch-friendly
buttons, and no hover-only interactions, so it drops straight into a
WebView wrapper:

1. **Create a new Android Studio project** → Empty Views Activity.
2. Copy this entire `AI-Learning-Platform/` folder into
   `app/src/main/assets/www/`.
3. In `MainActivity.java` (or `.kt`), load it via:
   ```java
   WebView webView = findViewById(R.id.webview);
   WebSettings settings = webView.getSettings();
   settings.setJavaScriptEnabled(true);
   settings.setDomStorageEnabled(true); // required for localStorage
   webView.loadUrl("file:///android_asset/www/index.html");
   ```
4. Add `<uses-permission android:name="android.permission.INTERNET" />`
   to `AndroidManifest.xml` (only needed for the Chart.js/Lucide CDN
   assets and Google Fonts — the app still functions, just with plainer
   styling/no charts, if offline).
5. Build → Build Bundle(s)/APK(s) → Build APK(s).

No native Android features are required — this is intentionally a thin
WebView shell around the existing responsive web app.

---

## 9. Notes / Known Simplifications (by design, per the 6-day scope)

- No backend: all data lives in `localStorage`, reset per browser.
  Architecture is modular (`data/`, `js/analysis.js`, `js/ai-engine.js`
  are pure functions) specifically so a Firebase/FastAPI backend could
  replace `localStorage` reads/writes later without touching the UI.
- Demo history is synthetic but deterministic (seeded PRNG) — the same
  scenario reproduces every run, which matters for a live presentation.
- Single teacher account overseeing the full 18-student roster (no
  multi-class/admin layer, per the brief's "admin is optional" note).
