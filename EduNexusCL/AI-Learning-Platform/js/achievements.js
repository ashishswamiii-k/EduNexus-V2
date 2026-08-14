/**
 * ACHIEVEMENTS.JS — achievements.html logic. Light gamification: badges
 * are computed from the same real stats as everywhere else — no separate
 * points/coins system, just recognition of genuine patterns.
 */
(function () {
  const user = requireRole("student");
  if (!user) return;
  const studentId = user.id;
  const student = getStudentById(studentId);

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("student", "achievements.html");
    renderMobileTopbar("Achievements");
    render();
    initIcons();
  });

  function render() {
    const overall = getOverallStats(studentId);
    const streak = getStreak(studentId);
    let topics = [];
    student.subjects.forEach(sid => { topics = topics.concat(getTopicsBySubject(sid)); });
    const masteredTopics = topics.filter(t => classifyTopic(getTopicStats(studentId, t.id).accuracy, getTopicStats(studentId, t.id).total) === "strong");
    const subjectsWithAttempts = student.subjects.filter(sid => getSubjectStats(studentId, sid).total > 0);

    const badges = [
      { icon: "🔥", name: "3-Day Streak", desc: "Practice 3 days in a row", unlocked: streak >= 3 },
      { icon: "🔥", name: "7-Day Streak", desc: "Practice 7 days in a row", unlocked: streak >= 7 },
      { icon: "🎯", name: "First Quiz", desc: "Complete your first quiz", unlocked: overall.total > 0 },
      { icon: "📚", name: "Subject Explorer", desc: "Attempt a quiz in every enrolled subject", unlocked: subjectsWithAttempts.length === student.subjects.length && student.subjects.length > 0 },
      { icon: "🏆", name: "Topic Master", desc: "Reach Strong on any topic", unlocked: masteredTopics.length >= 1 },
      { icon: "🌟", name: "Multi-Topic Master", desc: "Reach Strong on 3+ topics", unlocked: masteredTopics.length >= 3 },
      { icon: "💯", name: "High Scorer", desc: "Reach 80%+ overall accuracy", unlocked: overall.accuracy !== null && overall.accuracy >= 80 },
      { icon: "📈", name: "On the Rise", desc: "Show improvement on any topic", unlocked: topics.some(t => { const tr = getTopicTrend(studentId, t.id); return tr.earlierAccuracy !== null && tr.recentAccuracy !== null && tr.recentAccuracy > tr.earlierAccuracy; }) },
      { icon: "💪", name: "Committed Learner", desc: "Answer 30+ questions total", unlocked: overall.total >= 30 },
    ];

    document.getElementById("badgeGrid").innerHTML = badges.map((b, i) => `
      <div class="badge-tile ${b.unlocked ? "" : "locked"}" style="animation:popIn 300ms var(--ease) backwards; animation-delay:${i * 50}ms;">
        <div class="badge-tile-icon">${b.icon}</div>
        <div class="badge-tile-name">${b.name}</div>
        <div class="badge-tile-desc">${b.desc}</div>
        ${b.unlocked ? `<span class="badge badge-success" style="margin-top:2px;">Unlocked</span>` : `<span class="badge badge-neutral" style="margin-top:2px;">Locked</span>`}
      </div>
    `).join("");
  }
})();
