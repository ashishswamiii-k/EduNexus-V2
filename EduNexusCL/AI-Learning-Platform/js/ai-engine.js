/**
 * AI ENGINE
 * The "intelligence" layer of the prototype. Everything here is
 * transparent, rule-based reasoning over the numbers analysis.js
 * produces — data-driven performance analysis + prerequisite-aware
 * reasoning + adaptive decision logic, not trained machine learning.
 * Thresholds are grouped in AI_CONFIG so they're easy to tune/demo.
 */

const AI_CONFIG = {
  weakThreshold: 50,            // < this % = weak
  improvingThreshold: 70,       // 50-70% = needs improvement, > 70% = strong
  minAttemptsForRating: 3,      // fewer attempts than this = "not enough data" instead of a verdict
  lowAccuracyRiskThreshold: 55, // overall accuracy below this counts as "Low Accuracy" for risk scoring
  minAttemptsForDropSignal: 8,  // fewer total attempts than this and a "drop" is too noisy to trust
  highResponseTimeSeconds: 38,  // avg response time above this is "slow"
  repeatedMistakeMinCount: 2,   // same question missed this many times = a repeated mistake
  lowActivityAttempts: 15,      // fewer total attempts than this = "low activity"
  performanceDropPoints: 10,    // recent accuracy this many points below earlier = a "drop"
  risk: {
    lowAccuracy: 30,
    repeatedMistakes: 25,
    highResponseTime: 15,
    performanceDrop: 20,
    lowActivity: 10,
  },
};

// ---------------------------------------------------------------
// A. Weak topic detection
// ---------------------------------------------------------------
function classifyTopic(accuracy, totalAttempts) {
  if (accuracy === null || totalAttempts < AI_CONFIG.minAttemptsForRating) return "unrated";
  if (accuracy < AI_CONFIG.weakThreshold) return "weak";
  if (accuracy < AI_CONFIG.improvingThreshold) return "needs_improvement";
  return "strong";
}

/** Every topic in a subject with its stats + classification, weakest first. */
function getClassifiedTopics(studentId, subjectId) {
  return getSubjectTopicStats(studentId, subjectId)
    .map(stats => ({ ...stats, topicMeta: getTopicById(stats.topicId), status: classifyTopic(stats.accuracy, stats.total) }))
    .sort((a, b) => (a.accuracy ?? 999) - (b.accuracy ?? 999));
}

function getWeakTopics(studentId, subjectId) {
  return getClassifiedTopics(studentId, subjectId).filter(t => t.status === "weak");
}

// ---------------------------------------------------------------
// B. Repeated mistake detection
// ---------------------------------------------------------------
function hasRepeatedMistakes(studentId, topicId) {
  const { repeatedQuestionCount, totalWrong } = getRepeatedMistakes(studentId, topicId);
  return { flagged: repeatedQuestionCount >= 1, repeatedQuestionCount, totalWrong };
}

// ---------------------------------------------------------------
// C. Response-time analysis
// ---------------------------------------------------------------
/**
 * High response time on its own proves nothing — we only flag a
 * "possible conceptual difficulty" when slow answers are *combined*
 * with below-average accuracy on the same topic.
 */
function analyzeResponseTime(topicStats) {
  const slow = topicStats.avgResponseTime !== null && topicStats.avgResponseTime > AI_CONFIG.highResponseTimeSeconds;
  const inaccurate = topicStats.accuracy !== null && topicStats.accuracy < AI_CONFIG.improvingThreshold;
  return {
    slow,
    conceptualDifficultyFlag: slow && inaccurate,
    avgResponseTime: topicStats.avgResponseTime,
  };
}

// ---------------------------------------------------------------
// D. Risk score
// ---------------------------------------------------------------
function computeRiskScore(studentId) {
  const overall = getOverallStats(studentId);
  const factors = [];
  let score = 0;

  const lowAccuracy = overall.accuracy !== null && overall.accuracy < AI_CONFIG.lowAccuracyRiskThreshold;
  if (lowAccuracy) { score += AI_CONFIG.risk.lowAccuracy; factors.push({ label: "Low Accuracy", points: AI_CONFIG.risk.lowAccuracy }); }

  // Repeated mistakes only count on topics the student is actually struggling
  // with (weak/needs-improvement) — one fluke miss on an otherwise-strong
  // topic shouldn't raise risk.
  let repeatedMistakeTopics = 0;
  const student = getStudentById(studentId);
  (student ? student.subjects : []).forEach(subjectId => {
    getTopicsBySubject(subjectId).forEach(topic => {
      const stats = getTopicStats(studentId, topic.id);
      const status = classifyTopic(stats.accuracy, stats.total);
      if (status === "weak" || status === "needs_improvement") {
        if (hasRepeatedMistakes(studentId, topic.id).flagged) repeatedMistakeTopics++;
      }
    });
  });
  const repeatedMistakes = repeatedMistakeTopics >= 1;
  if (repeatedMistakes) { score += AI_CONFIG.risk.repeatedMistakes; factors.push({ label: "Repeated Mistakes", points: AI_CONFIG.risk.repeatedMistakes }); }

  const highResponseTime = overall.avgResponseTime !== null && overall.avgResponseTime > AI_CONFIG.highResponseTimeSeconds;
  if (highResponseTime) { score += AI_CONFIG.risk.highResponseTime; factors.push({ label: "High Response Time", points: AI_CONFIG.risk.highResponseTime }); }

  // Recent-drop only counts with enough attempts to be meaningful (avoids
  // 2-vs-2 sample noise) and only on topics that aren't already strong.
  let hasDrop = false;
  (student ? student.subjects : []).forEach(subjectId => {
    getTopicsBySubject(subjectId).forEach(topic => {
      const stats = getTopicStats(studentId, topic.id);
      if (stats.total < AI_CONFIG.minAttemptsForDropSignal) return;
      const status = classifyTopic(stats.accuracy, stats.total);
      if (status === "strong") return;
      const trend = getTopicTrend(studentId, topic.id);
      if (trend.earlierAccuracy !== null && trend.recentAccuracy !== null &&
          trend.earlierAccuracy - trend.recentAccuracy >= AI_CONFIG.performanceDropPoints) {
        hasDrop = true;
      }
    });
  });
  if (hasDrop) { score += AI_CONFIG.risk.performanceDrop; factors.push({ label: "Recent Performance Drop", points: AI_CONFIG.risk.performanceDrop }); }

  const lowActivity = overall.total < AI_CONFIG.lowActivityAttempts;
  if (lowActivity) { score += AI_CONFIG.risk.lowActivity; factors.push({ label: "Low Activity", points: AI_CONFIG.risk.lowActivity }); }

  score = Math.min(100, score);
  let level = "Low";
  if (score > 60) level = "High";
  else if (score > 30) level = "Medium";

  return { score, level, factors };
}

// ---------------------------------------------------------------
// Prerequisite gap detection
// ---------------------------------------------------------------
/**
 * If a topic is weak AND its declared prerequisite is also weak or
 * needs-improvement (or has too little data to be considered mastered),
 * surface that prerequisite as the likely root cause.
 */
function detectPrerequisiteGap(studentId, topicId) {
  const topicStats = getTopicStats(studentId, topicId);
  const status = classifyTopic(topicStats.accuracy, topicStats.total);
  if (status !== "weak") return null;

  const prereq = getPrerequisiteTopic(topicId);
  if (!prereq) return null;

  const prereqStats = getTopicStats(studentId, prereq.id);
  const prereqStatus = classifyTopic(prereqStats.accuracy, prereqStats.total);
  if (prereqStatus === "weak" || prereqStatus === "needs_improvement" || prereqStatus === "unrated") {
    return {
      weakTopic: getTopicById(topicId),
      weakTopicAccuracy: topicStats.accuracy,
      prerequisiteTopic: prereq,
      prerequisiteAccuracy: prereqStats.accuracy,
    };
  }
  return null;
}

/** Scans every enrolled subject for the single clearest gap to headline on the dashboard. */
function findPrimaryGap(studentId) {
  const student = getStudentById(studentId);
  if (!student) return null;
  let best = null;
  student.subjects.forEach(subjectId => {
    getTopicsBySubject(subjectId).forEach(topic => {
      const gap = detectPrerequisiteGap(studentId, topic.id);
      if (gap && (!best || gap.weakTopicAccuracy < best.weakTopicAccuracy)) {
        best = { ...gap, subjectId };
      }
    });
  });
  return best;
}

// ---------------------------------------------------------------
// Adaptive quiz difficulty
// ---------------------------------------------------------------
function getAdaptiveDifficulty(studentId, subjectId) {
  const stats = getSubjectStats(studentId, subjectId);
  const acc = stats.accuracy;
  if (acc === null) return "easy"; // no history yet — start gentle
  if (acc < 40) return "easy";
  if (acc <= 70) return "medium";
  return "hard";
}

// ---------------------------------------------------------------
// Personalized learning path
// ---------------------------------------------------------------
function generateLearningPath(studentId, subjectId) {
  const weakTopics = getWeakTopics(studentId, subjectId);
  if (weakTopics.length === 0) {
    return {
      hasGap: false,
      steps: [{ label: `Keep practicing ${getSubjectById(subjectId).name}`, done: false, type: "practice" }],
    };
  }

  const focusTopic = weakTopics[0];
  const gap = detectPrerequisiteGap(studentId, focusTopic.topicId);
  const steps = [];

  if (gap) {
    steps.push({ label: `Review ${gap.prerequisiteTopic.name} Basics`, type: "review", done: gap.prerequisiteAccuracy !== null && gap.prerequisiteAccuracy >= AI_CONFIG.improvingThreshold });
    steps.push({ label: `Revise ${gap.prerequisiteTopic.name}`, type: "revise", done: false });
    steps.push({ label: `Practice 5 ${gap.prerequisiteTopic.name} Questions`, type: "practice", done: false });
    steps.push({ label: `Take ${gap.prerequisiteTopic.name} Assessment`, type: "assessment", done: false });
    steps.push({ label: `Learn ${gap.weakTopic.name}`, type: "learn", done: false });
    steps.push({ label: `Take Adaptive Quiz`, type: "adaptive", done: false });
    return { hasGap: true, gap, focusTopic, steps };
  }

  steps.push({ label: `Revise ${focusTopic.topicMeta.name}`, type: "revise", done: false });
  steps.push({ label: `Practice 5 ${focusTopic.topicMeta.name} Questions`, type: "practice", done: false });
  steps.push({ label: `Take ${focusTopic.topicMeta.name} Assessment`, type: "assessment", done: false });
  steps.push({ label: `Take Adaptive Quiz`, type: "adaptive", done: false });
  return { hasGap: false, focusTopic, steps };
}

// ---------------------------------------------------------------
// Human-readable AI insight (dashboard card + result page)
// ---------------------------------------------------------------
function generateAIInsight(studentId) {
  const gap = findPrimaryGap(studentId);
  if (gap) {
    return {
      type: "gap",
      title: "Learning Gap Detected",
      message: `Your performance suggests that revising ${gap.prerequisiteTopic.name} may help before continuing with advanced ${gap.weakTopic.name}.`,
      subjectId: gap.subjectId,
      weakTopic: gap.weakTopic,
      prerequisiteTopic: gap.prerequisiteTopic,
    };
  }

  // No gap — fall back to the single weakest topic across all subjects, if any
  const student = getStudentById(studentId);
  let weakest = null;
  (student ? student.subjects : []).forEach(subjectId => {
    getWeakTopics(studentId, subjectId).forEach(t => {
      if (!weakest || t.accuracy < weakest.accuracy) weakest = { ...t, subjectId };
    });
  });
  if (weakest) {
    return {
      type: "weak",
      title: "Weak Topic Identified",
      message: `${weakest.topicMeta.name} is currently your weakest area at ${weakest.accuracy}%. Focused practice here should raise your overall score.`,
      subjectId: weakest.subjectId,
      weakTopic: weakest.topicMeta,
    };
  }

  return { type: "ok", title: "You're on Track", message: "No significant weak topics detected right now — keep up the consistent practice." };
}

/** Teacher-facing version of the same reasoning, phrased as an intervention. */
function generateInterventionRecommendation(studentId) {
  const gap = findPrimaryGap(studentId);
  if (gap) {
    return `Revise ${gap.prerequisiteTopic.name} and assign targeted practice before introducing advanced ${gap.weakTopic.name} problems.`;
  }
  const student = getStudentById(studentId);
  let weakest = null;
  (student ? student.subjects : []).forEach(subjectId => {
    getWeakTopics(studentId, subjectId).forEach(t => {
      if (!weakest || t.accuracy < weakest.accuracy) weakest = t;
    });
  });
  if (weakest) return `Assign focused revision and extra practice on ${weakest.topicMeta.name}.`;
  return "No immediate intervention needed — recommend continued regular practice.";
}

window.AI_CONFIG = AI_CONFIG;
window.classifyTopic = classifyTopic;
window.getClassifiedTopics = getClassifiedTopics;
window.getWeakTopics = getWeakTopics;
window.hasRepeatedMistakes = hasRepeatedMistakes;
window.analyzeResponseTime = analyzeResponseTime;
window.computeRiskScore = computeRiskScore;
window.detectPrerequisiteGap = detectPrerequisiteGap;
window.findPrimaryGap = findPrimaryGap;
window.getAdaptiveDifficulty = getAdaptiveDifficulty;
window.generateLearningPath = generateLearningPath;
window.generateAIInsight = generateAIInsight;
window.generateInterventionRecommendation = generateInterventionRecommendation;
