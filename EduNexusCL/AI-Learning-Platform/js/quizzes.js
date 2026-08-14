/**
 * QUIZZES.JS — quizzes.html logic. Groups raw answer-events by sessionId
 * to reconstruct a per-attempt history log.
 */
(function () {
  const user = requireRole("student");
  if (!user) return;
  const studentId = user.id;

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("student", "quizzes.html");
    renderMobileTopbar("Quizzes");
    render();
    initIcons();
  });

  function render() {
    const events = getAttempts(studentId);
    const bySession = {};
    events.forEach(e => {
      if (!bySession[e.sessionId]) bySession[e.sessionId] = { date: e.date, subjectId: e.subjectId, topicId: e.topicId, events: [] };
      bySession[e.sessionId].events.push(e);
      // A session can span multiple topics (a full-subject adaptive quiz) — only keep topicId if all events share one
      if (bySession[e.sessionId].topicId !== e.topicId) bySession[e.sessionId].topicId = null;
    });
    const sessions = Object.entries(bySession).map(([sessionId, s]) => {
      const correct = s.events.filter(e => e.isCorrect).length;
      const total = s.events.length;
      return {
        sessionId, date: s.date, subjectId: s.subjectId, topicId: s.topicId,
        correct, total, score: Math.round((correct / total) * 100),
        avgResponseTime: Math.round(s.events.reduce((a, e) => a + e.responseTime, 0) / total),
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    const mount = document.getElementById("quizList");
    if (sessions.length === 0) {
      mount.innerHTML = `
        <div class="empty-state">
          <i data-lucide="clipboard-list" style="width:30px;height:30px;margin-bottom:10px;"></i>
          <p>No quiz attempts yet.</p>
          <p style="margin-top:4px;">Take your first quiz to generate your personalized learning insights.</p>
          <a href="subjects.html" class="btn btn-primary" style="margin-top:16px;"><i data-lucide="play"></i><span>Start Quiz</span></a>
        </div>`;
      initIcons();
      return;
    }

    mount.innerHTML = `
      <table>
        <thead><tr><th>Date</th><th>Subject</th><th>Score</th><th>Correct</th><th>Avg Time</th></tr></thead>
        <tbody>
          ${sessions.map(s => `
            <tr>
              <td>${formatDate(s.date)}</td>
              <td>${getSubjectById(s.subjectId).name}${s.topicId ? " · " + getTopicById(s.topicId).name : " · Adaptive Mix"}</td>
              <td><span class="${s.score < 50 ? "badge badge-danger" : s.score < 70 ? "badge badge-warning" : "badge badge-success"}">${s.score}%</span></td>
              <td class="mono">${s.correct}/${s.total}</td>
              <td class="mono">${s.avgResponseTime}s</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
})();
