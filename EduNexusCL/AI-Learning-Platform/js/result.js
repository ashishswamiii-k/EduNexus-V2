/**
 * RESULT.JS — result.html logic. Reads the session summary quiz.js
 * stored in sessionStorage right after submission.
 */
(function () {
  const user = requireRole("student");
  if (!user) return;
  const studentId = user.id;

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("student", "subjects.html");
    renderMobileTopbar("Result");

    const raw = sessionStorage.getItem("aelp_last_result");
    if (!raw) { window.location.href = "student-dashboard.html"; return; }
    const summary = JSON.parse(raw);
    render(summary);
    initIcons();
  });

  function render(summary) {
    const subject = getSubjectById(summary.subjectId);
    const sessionEvents = getAttempts(studentId).filter(e => e.sessionId === summary.sessionId);

    const topicRows = summary.topicIds.map(tid => {
      const topicEvents = sessionEvents.filter(e => e.topicId === tid);
      const correct = topicEvents.filter(e => e.isCorrect).length;
      const acc = Math.round((correct / topicEvents.length) * 100);
      const topic = getTopicById(tid);
      const status = classifyTopic(getTopicStats(studentId, tid).accuracy, getTopicStats(studentId, tid).total);
      return `
        <div class="topic-row">
          <div class="topic-name">${topic.name}</div>
          <div class="topic-score" style="color:${acc < 50 ? "var(--danger)" : acc < 70 ? "var(--warning)" : "var(--success)"}">${acc}%</div>
          <div class="progress-track"><div class="progress-fill ${acc < 50 ? "danger" : acc < 70 ? "warning" : "success"}" style="width:${acc}%"></div></div>
          <span class="${statusBadgeClass(status)}">${statusLabel(status)}</span>
        </div>
      `;
    }).join("");

    const insight = generateAIInsight(studentId);
    let chainHTML = "";
    if (insight.type === "gap") {
      chainHTML = `<div class="chain"><div class="chain-node">${insight.prerequisiteTopic.name}</div><div class="chain-link broken"></div><div class="chain-node gap">${insight.weakTopic.name} ⚠</div></div>`;
    }
    const toneClass = insight.type === "ok" ? "tone-ok" : "";
    const icon = insight.type === "ok" ? "check" : "alert-triangle";
    const ringColor = summary.score < 50 ? "var(--danger)" : summary.score < 70 ? "var(--warning)" : "var(--success)";

    document.getElementById("pageContent").innerHTML = `
      <div class="card result-hero" style="margin-bottom:20px;">
        <div class="page-eyebrow">Quiz Complete</div>
        <div class="score-ring-wrap">
          <svg viewBox="0 0 168 168">
            <circle cx="84" cy="84" r="72" fill="none" stroke="var(--surface-alt)" stroke-width="14"/>
            <circle id="scoreRingArc" cx="84" cy="84" r="72" fill="none" stroke="${ringColor}" stroke-width="14" stroke-linecap="round"
              stroke-dasharray="${2 * Math.PI * 72}" stroke-dashoffset="${2 * Math.PI * 72}"/>
          </svg>
          <div class="score-ring-value">
            <div class="score-ring-num" id="scoreRingNum">0%</div>
          </div>
        </div>
        <div class="result-score-label">${subject.name}${summary.topicId ? " · " + getTopicById(summary.topicId).name : ""}</div>
        <div class="result-stats">
          <div><div class="result-stat-value">${summary.correct} / ${summary.total}</div><div class="result-stat-label">Correct Answers</div></div>
          <div><div class="result-stat-value">${summary.avgResponseTime}s</div><div class="result-stat-label">Avg Response Time</div></div>
        </div>
      </div>

      <div class="card reveal-section" style="margin-bottom:20px; animation-delay:150ms;">
        <div class="card-header"><div class="card-title">Topic Analysis</div></div>
        ${topicRows}
      </div>

      <div class="ai-insight ${toneClass} reveal-section" style="margin-bottom:22px; animation-delay:300ms;">
        <div class="ai-insight-icon"><i data-lucide="${icon}"></i></div>
        <div style="flex:1;">
          <div class="ai-insight-title">${insight.title}</div>
          <div class="ai-insight-body">${insight.message}</div>
          ${chainHTML}
        </div>
      </div>

      <div class="row reveal-section" style="justify-content:center; gap:12px; flex-wrap:wrap; animation-delay:450ms;">
        <a href="learning-path.html${summary.subjectId ? "?subject=" + summary.subjectId : ""}" class="btn btn-accent"><i data-lucide="route"></i><span>View Learning Path</span></a>
        <a href="subjects.html?subject=${summary.subjectId}" class="btn btn-outline"><span>Back to Subject</span></a>
        <a href="student-dashboard.html" class="btn btn-outline"><span>Dashboard</span></a>
      </div>
    `;
    initIcons();

    // Animate the ring + the number counting up together
    const circumference = 2 * Math.PI * 72;
    const reduced = document.documentElement.classList.contains("reduced-motion");
    const arc = document.getElementById("scoreRingArc");
    const numEl = document.getElementById("scoreRingNum");
    if (reduced) {
      arc.style.strokeDashoffset = circumference - (summary.score / 100) * circumference;
      numEl.textContent = summary.score + "%";
    } else {
      requestAnimationFrame(() => {
        arc.style.transition = "stroke-dashoffset 1100ms cubic-bezier(.4,0,.2,1)";
        arc.style.strokeDashoffset = circumference - (summary.score / 100) * circumference;
      });
      animateCount(numEl, summary.score, { suffix: "%", duration: 1100 });
    }
  }
})();
