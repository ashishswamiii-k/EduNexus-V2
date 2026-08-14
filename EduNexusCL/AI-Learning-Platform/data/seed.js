/**
 * SEED GENERATOR
 * Populates localStorage with a believable history of quiz "answer events"
 * for every demo student, so dashboards/teacher views are never empty.
 * Deterministic (seeded PRNG) so the demo looks the same every run, but
 * still feeds through the exact same analysis/AI pipeline that live
 * quiz-taking uses — nothing here is faked separately from real logic.
 *
 * Storage schema per student (key: aelp_attempts_<studentId>):
 *   [{ id, date, sessionId, subjectId, topicId, questionId,
 *      selectedIndex, isCorrect, difficulty, responseTime }]
 */

// ---- tiny deterministic PRNG (mulberry32) so re-seeding is stable ----
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const TIER_ACCURACY = {
  strong:     [80, 95],
  average:    [60, 79],
  struggling: [40, 59],
  atrisk:     [18, 39],
};

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Evenly spreads `correctCount` trues across `length` slots (Bresenham-style), then shuffles the order. */
function spreadCorrectness(length, correctCount, rng) {
  const arr = [];
  for (let j = 0; j < length; j++) {
    arr.push(Math.floor(((j + 1) * correctCount) / length) > Math.floor((j * correctCount) / length));
  }
  return shuffle(arr, rng);
}

/**
 * Generates `count` answer-events for one topic, spread across the last
 * ~30 days. The accuracy split between the earlier and later half of the
 * attempts is controlled explicitly (not left to small-sample randomness),
 * so a "flat" trend genuinely stays flat and a "declining"/"improving"
 * trend produces a real, detectable shift — this is what feeds the
 * recent-performance-drop risk factor and the dashboard trend chart.
 */
function generateTopicEvents(rng, { studentId, subjectId, topicId, count, accuracyPct, trend = "flat" }) {
  const events = [];
  const sessionId = `sess_${studentId}_${topicId}`;
  const topicQuestions = getQuestionsByTopic(topicId);
  if (topicQuestions.length === 0 || count === 0) return events;

  const targetCorrect = Math.max(0, Math.min(count, Math.round((accuracyPct / 100) * count)));
  const halfLen1 = Math.floor(count / 2);
  const halfLen2 = count - halfLen1;

  let earlierAccTarget = accuracyPct;
  let recentAccTarget = accuracyPct;
  const SHIFT = 22; // points of separation between halves for a genuine trend
  if (trend === "declining") { earlierAccTarget = Math.min(97, accuracyPct + SHIFT); recentAccTarget = Math.max(3, accuracyPct - SHIFT); }
  else if (trend === "improving") { earlierAccTarget = Math.max(3, accuracyPct - SHIFT); recentAccTarget = Math.min(97, accuracyPct + SHIFT); }

  let earlierCorrect = Math.round((earlierAccTarget / 100) * halfLen1);
  earlierCorrect = Math.max(0, Math.min(halfLen1, earlierCorrect));
  let recentCorrect = targetCorrect - earlierCorrect;
  // Keep the total exact even after rounding/clipping
  if (recentCorrect > halfLen2) { recentCorrect = halfLen2; earlierCorrect = Math.max(0, Math.min(halfLen1, targetCorrect - recentCorrect)); }
  if (recentCorrect < 0) { recentCorrect = 0; earlierCorrect = Math.max(0, Math.min(halfLen1, targetCorrect)); }

  const correctnessOrder = spreadCorrectness(halfLen1, earlierCorrect, rng).concat(spreadCorrectness(halfLen2, recentCorrect, rng));

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.round(30 - (i / Math.max(1, count - 1)) * 28);
    const isCorrect = correctnessOrder[i];
    const q = topicQuestions[Math.floor(rng() * topicQuestions.length)];

    // Response time: incorrect answers tend to take a bit longer to think through
    const baseTime = isCorrect ? 14 : 30;
    const responseTime = Math.round(Math.max(6, baseTime + (rng() - 0.5) * 14));

    events.push({
      id: `${sessionId}_${i}`,
      date: daysAgoISO(daysAgo),
      sessionId,
      subjectId,
      topicId,
      questionId: q.id,
      selectedIndex: isCorrect ? q.correct : (q.correct + 1) % q.options.length,
      isCorrect,
      difficulty: q.difficulty,
      responseTime,
    });
  }
  return events;
}

/** Hand-crafted profile for the featured demo student (Rahul Sharma). */
function generateRahulProfile() {
  const events = [];
  events.push(...generateTopicEvents(mulberry32(1001), {
    studentId: "stu_001", subjectId: "sub_math", topicId: "t_algebra", count: 8, accuracyPct: 82, trend: "flat",
  }));
  events.push(...generateTopicEvents(mulberry32(1002), {
    studentId: "stu_001", subjectId: "sub_math", topicId: "t_linear_eq", count: 6, accuracyPct: 71, trend: "flat",
  }));
  // Factorization: weak + repeated mistakes + slow response time (conceptual difficulty signal)
  events.push(...generateTopicEvents(mulberry32(1003), {
    studentId: "stu_001", subjectId: "sub_math", topicId: "t_factorization", count: 9, accuracyPct: 43, trend: "flat",
  }));
  // Quadratic Equations: weak AND declining (recent performance drop signal)
  events.push(...generateTopicEvents(mulberry32(1004), {
    studentId: "stu_001", subjectId: "sub_math", topicId: "t_quadratic", count: 8, accuracyPct: 35, trend: "declining",
  }));
  // Programming — below the class average, reinforcing the at-risk profile
  // (kept above the Math weak-topic scores so Quadratic Equations stays
  // the clear primary gap for the demo)
  events.push(...generateTopicEvents(mulberry32(1005), {
    studentId: "stu_001", subjectId: "sub_prog", topicId: "t_variables", count: 6, accuracyPct: 65, trend: "flat",
  }));
  events.push(...generateTopicEvents(mulberry32(1006), {
    studentId: "stu_001", subjectId: "sub_prog", topicId: "t_conditions", count: 6, accuracyPct: 50, trend: "flat",
  }));
  events.push(...generateTopicEvents(mulberry32(1007), {
    studentId: "stu_001", subjectId: "sub_prog", topicId: "t_loops", count: 5, accuracyPct: 40, trend: "flat",
  }));
  // DBMS — also below average
  events.push(...generateTopicEvents(mulberry32(1008), {
    studentId: "stu_001", subjectId: "sub_dbms", topicId: "t_sql", count: 6, accuracyPct: 50, trend: "flat",
  }));
  events.push(...generateTopicEvents(mulberry32(1009), {
    studentId: "stu_001", subjectId: "sub_dbms", topicId: "t_normalization", count: 5, accuracyPct: 40, trend: "flat",
  }));
  return events;
}

function generateAllSeedData() {
  const data = {}; // studentId -> events[]

  data["stu_001"] = generateRahulProfile();

  STUDENTS.filter(s => s.id !== "stu_001").forEach((student, idx) => {
    const rng = mulberry32(2000 + idx * 37);
    const [lo, hi] = TIER_ACCURACY[student.tier] || TIER_ACCURACY.average;
    const events = [];

    student.subjects.forEach(subjectId => {
      const topics = getTopicsBySubject(subjectId);
      topics.forEach(topic => {
        const accuracyPct = lo + rng() * (hi - lo);
        const count = 6 + Math.floor(rng() * 4); // 6-9 events per topic
        const trendRoll = rng();
        const trend = trendRoll < 0.15 ? "declining" : (trendRoll > 0.85 ? "improving" : "flat");
        events.push(...generateTopicEvents(rng, {
          studentId: student.id, subjectId, topicId: topic.id, count, accuracyPct, trend,
        }));
      });
    });

    data[student.id] = events;
  });

  return data;
}

function seedIfNeeded() {
  if (localStorage.getItem("aelp_seeded_v1")) return;
  const allData = generateAllSeedData();
  Object.keys(allData).forEach(studentId => {
    localStorage.setItem(`aelp_attempts_${studentId}`, JSON.stringify(allData[studentId]));
  });
  localStorage.setItem("aelp_seeded_v1", "true");
}

window.seedIfNeeded = seedIfNeeded;
