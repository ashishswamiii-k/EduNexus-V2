/**
 * AI-INSIGHTS.JS — ai-insights.html logic. Lists every detected
 * weak-topic / prerequisite-gap across ALL enrolled subjects (the
 * dashboard only ever headlines the single clearest one).
 */
(function () {
  const user = requireRole("student");
  if (!user) return;
  const studentId = user.id;
  const student = getStudentById(studentId);

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("student", "ai-insights.html");
    renderMobileTopbar("AI Insights");
    render();
    initIcons();
  });

  function render() {
    const mount = document.getElementById("insightList");
    const cards = [];

    student.subjects.forEach(subjectId => {
      const subject = getSubjectById(subjectId);
      getWeakTopics(studentId, subjectId).forEach(t => {
        const gap = detectPrerequisiteGap(studentId, t.topicId);
        const rtAnalysis = analyzeResponseTime(t);
        cards.push({ subject, topic: t, gap, rtAnalysis });
      });
    });

    if (cards.length === 0) {
      mount.innerHTML = `
        <div class="card empty-state">
          <i data-lucide="sparkles" style="width:30px;height:30px;margin-bottom:10px;"></i>
          <p>No weak topics or gaps detected right now.</p>
          <p style="margin-top:4px;">Keep taking quizzes — insights will appear here the moment the AI spots a pattern.</p>
        </div>`;
      initIcons();
      return;
    }

    mount.innerHTML = cards.map((c, i) => {
      const chain = c.gap ? `
        <div class="chain">
          <div class="chain-node">${c.gap.prerequisiteTopic.name}</div>
          <div class="chain-link broken"></div>
          <div class="chain-node gap">${c.gap.weakTopic.name} ⚠</div>
        </div>` : "";
      const rtNote = c.rtAnalysis.conceptualDifficultyFlag
        ? `<div class="text-secondary" style="font-size:12.5px; margin-top:8px;">⏱ Slower-than-average response time combined with low accuracy suggests possible conceptual difficulty here.</div>` : "";
      return `
        <div class="ai-insight glow-once" style="animation-delay:${i * 80}ms;">
          <div class="ai-insight-icon"><i data-lucide="alert-triangle"></i></div>
          <div style="flex:1;">
            <div class="ai-insight-title">${c.subject.name} · ${c.topic.topicMeta.name} — ${c.topic.accuracy}%</div>
            <div class="ai-insight-body">${c.gap
              ? `Your performance suggests that revising ${c.gap.prerequisiteTopic.name} may help before continuing with advanced ${c.gap.weakTopic.name}.`
              : `This topic is currently weak — focused practice should raise your score here.`}</div>
            ${chain}${rtNote}
            <div style="margin-top:12px;"><a href="learning-path.html?subject=${c.subject.id}" class="btn btn-accent btn-sm"><i data-lucide="route"></i>View Learning Path</a></div>
          </div>
        </div>
      `;
    }).join("");
    initIcons();
  }
})();
