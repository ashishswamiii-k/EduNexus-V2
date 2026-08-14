/**
 * ANALYSIS ENGINE
 * Pure functions that turn raw "answer events" (stored in localStorage,
 * shape defined in data/seed.js) into the numbers every page displays:
 * scores, topic-wise accuracy, response times, and mistake patterns.
 * No AI/decision logic lives here — see ai-engine.js for that.
 */

function getAttempts(studentId) {
  try {
    const raw = localStorage.getItem(`aelp_attempts_${studentId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read attempts", e);
    return [];
  }
}

function saveAttempts(studentId, events) {
  localStorage.setItem(`aelp_attempts_${studentId}`, JSON.stringify(events));
}

function appendAttempts(studentId, newEvents) {
  const existing = getAttempts(studentId);
  const merged = existing.concat(newEvents);
  saveAttempts(studentId, merged);
  return merged;
}

function round1(n) { return Math.round(n * 10) / 10; }

/** Basic accuracy % for an arbitrary list of events. */
function accuracyOf(events) {
  if (events.length === 0) return null;
  const correct = events.filter(e => e.isCorrect).length;
  return round1((correct / events.length) * 100);
}

function avgResponseTimeOf(events) {
  if (events.length === 0) return null;
  const sum = events.reduce((acc, e) => acc + e.responseTime, 0);
  return Math.round(sum / events.length);
}

/** Stats for one topic: accuracy, response time, attempt count, raw events (newest last). */
function getTopicStats(studentId, topicId) {
  const events = getAttempts(studentId)
    .filter(e => e.topicId === topicId)
    .sort((a, b) => a.date.localeCompare(b.date));
  const correct = events.filter(e => e.isCorrect).length;
  return {
    topicId,
    total: events.length,
    correct,
    accuracy: accuracyOf(events),
    avgResponseTime: avgResponseTimeOf(events),
    events,
  };
}

/** Stats for every topic in a subject the student has attempted (or is enrolled in). */
function getSubjectTopicStats(studentId, subjectId) {
  return getTopicsBySubject(subjectId).map(topic => getTopicStats(studentId, topic.id));
}

function getSubjectStats(studentId, subjectId) {
  const events = getAttempts(studentId).filter(e => e.subjectId === subjectId);
  return {
    subjectId,
    total: events.length,
    accuracy: accuracyOf(events),
    avgResponseTime: avgResponseTimeOf(events),
    topics: getSubjectTopicStats(studentId, subjectId),
  };
}

/** Overall stats across every subject the student is enrolled in. */
function getOverallStats(studentId) {
  const student = getStudentById(studentId);
  const events = getAttempts(studentId);
  const bySubject = (student ? student.subjects : []).map(sid => getSubjectStats(studentId, sid));
  return {
    total: events.length,
    accuracy: accuracyOf(events),
    avgResponseTime: avgResponseTimeOf(events),
    subjects: bySubject,
  };
}

/**
 * Splits a topic's events into an "earlier" half and "recent" half
 * (chronological) so we can compare accuracy across time — used for
 * both the dashboard trend chart and recent-performance-drop detection.
 */
function getTopicTrend(studentId, topicId) {
  const events = getTopicStats(studentId, topicId).events;
  if (events.length < 4) {
    return { earlierAccuracy: null, recentAccuracy: accuracyOf(events), points: events.map(e => ({ date: e.date, correct: e.isCorrect })) };
  }
  const mid = Math.floor(events.length / 2);
  const earlier = events.slice(0, mid);
  const recent = events.slice(mid);
  return {
    earlierAccuracy: accuracyOf(earlier),
    recentAccuracy: accuracyOf(recent),
    points: events.map(e => ({ date: e.date, correct: e.isCorrect })),
  };
}

/**
 * Repeated mistakes: how many times the student answered a question from
 * this topic incorrectly. 2+ counts as a "repeated mistake" pattern.
 */
function getRepeatedMistakes(studentId, topicId) {
  const events = getTopicStats(studentId, topicId).events;
  const wrongByQuestion = {};
  events.filter(e => !e.isCorrect).forEach(e => {
    wrongByQuestion[e.questionId] = (wrongByQuestion[e.questionId] || 0) + 1;
  });
  const totalWrong = events.filter(e => !e.isCorrect).length;
  const repeatedQuestionCount = Object.values(wrongByQuestion).filter(c => c >= 2).length;
  return { totalWrong, repeatedQuestionCount, wrongByQuestion };
}

/** Daily-activity streak (consecutive days with at least one attempt, ending today or yesterday). */
function getStreak(studentId) {
  const events = getAttempts(studentId);
  if (events.length === 0) return 0;
  const dateSet = new Set(events.map(e => e.date));
  let streak = 0;
  let cursor = new Date();
  // Allow the streak to still "count" if today has no activity yet but yesterday does
  if (!dateSet.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

window.getAttempts = getAttempts;
window.saveAttempts = saveAttempts;
window.appendAttempts = appendAttempts;
window.accuracyOf = accuracyOf;
window.avgResponseTimeOf = avgResponseTimeOf;
window.getTopicStats = getTopicStats;
window.getSubjectTopicStats = getSubjectTopicStats;
window.getSubjectStats = getSubjectStats;
window.getOverallStats = getOverallStats;
window.getTopicTrend = getTopicTrend;
window.getRepeatedMistakes = getRepeatedMistakes;
window.getStreak = getStreak;
