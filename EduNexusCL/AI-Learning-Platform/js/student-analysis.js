/**
 * STUDENT-ANALYSIS.JS — student-analysis.html logic (teacher-facing drill-down).
 */
(function () {
  const user = requireRole("teacher");
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("student");
  const student = studentId ? getStudentById(studentId) : null;

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("teacher", "teacher-dashboard.html");
    renderMobileTopbar("Student Analysis");

    if (!student) {
      document.getElementById("pageContent").innerHTML = `<div class="card empty-state">Student not found.<br><a href="teacher-dashboard.html" class="btn btn-outline" style="margin-top:12px;">Back to Class Overview</a></div>`;
      return;
    }
    render();
    initIcons();
  });

  function gaugeRing(pct, color) {
    const r = 40, c = 2 * Math.PI * r;
    const offset = c - (Math.max(0, Math.min(100, pct || 0)) / 100) * c;
    return `
      <div class="gauge">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="${r}" fill="none" stroke="#EEF0F6" stroke-width="10"/>
          <circle cx="48" cy="48" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="gauge-value">${pct !== null ? pct + "%" : "—"}</div>
      </div>`;
  }

  function render() {
    const overall = getOverallStats(studentId);
    const gap = findPrimaryGap(studentId);
    const insight = generateAIInsight(studentId);
    const risk = computeRiskScore(studentId);
    const recommendation = generateInterventionRecommendation(studentId);

    let repeatedMistakesTotal = 0;
    student.subjects.forEach(sid => {
      getTopicsBySubject(sid).forEach(t => {
        repeatedMistakesTotal += getRepeatedMistakes(studentId, t.id).totalWrong;
      });
    });

    const riskColor = risk.level === "High" ? "var(--danger)" : risk.level === "Medium" ? "var(--warning)" : "var(--success)";
    const gaugeColor = overall.accuracy === null ? "#C9CCDC" : overall.accuracy < 50 ? "#D62839" : overall.accuracy < 70 ? "#E8871E" : "#1B998B";

    document.getElementById("pageContent").innerHTML = `
      <a href="teacher-dashboard.html" class="text-secondary" style="font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px; margin-bottom:16px;"><i data-lucide="arrow-left" style="width:15px;height:15px;"></i> Class Overview</a>

      <div class="topbar">
        <div class="row">
          <div class="avatar" style="width:52px; height:52px; font-size:18px;">${initials(student.name)}</div>
          <div>
            <h1 class="page-title">${student.name}</h1>
            <p class="page-sub">${student.subjects.map(sid => getSubjectById(sid).name).join(" · ")}</p>
          </div>
        </div>
        <span class="${riskBadgeClass(risk.level)}" style="font-size:13px; padding:7px 14px;"><span class="badge-dot"></span>${risk.level.toUpperCase()} RISK</span>
      </div>

      <div class="grid grid-2" style="align-items:start; margin-bottom:20px;">
        <div class="card">
          <div class="card-header"><div class="card-title">Overall Performance</div></div>
          <div class="gauge-wrap">
            ${gaugeRing(overall.accuracy, gaugeColor)}
            <div>
              <div class="row" style="gap:18px; flex-wrap:wrap;">
                <div><div class="result-stat-value">${overall.avgResponseTime !== null ? overall.avgResponseTime + "s" : "—"}</div><div class="result-stat-label">Avg Response Time</div></div>
                <div><div class="result-stat-value">${repeatedMistakesTotal}</div><div class="result-stat-label">Repeated Mistakes</div></div>
                <div><div class="result-stat-value">${overall.total}</div><div class="result-stat-label">Questions Attempted</div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Risk Breakdown</div></div>
          <div class="row-between" style="margin-bottom:10px;">
            <span class="text-secondary" style="font-size:13px;">Risk Score</span>
            <span class="mono" style="font-weight:700; color:${riskColor};">${risk.score} / 100</span>
          </div>
          <div class="progress-track" style="margin-bottom:14px;"><div class="progress-fill ${risk.level === "High" ? "danger" : risk.level === "Medium" ? "warning" : "success"}" style="width:${risk.score}%"></div></div>
          ${risk.factors.length ? risk.factors.map(f => `
            <div class="row-between" style="padding:7px 0; border-bottom:1px solid var(--border); font-size:13.5px;">
              <span>${f.label}</span><span class="mono text-secondary">+${f.points}</span>
            </div>`).join("") : `<p class="text-muted" style="font-size:13.5px;">No risk factors currently triggered.</p>`}
        </div>
      </div>

      ${gap ? `
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><div class="card-title">Weak Topic & Prerequisite Gap</div></div>
        <div class="row-between" style="margin-bottom:6px;">
          <span class="text-secondary" style="font-size:13.5px;">Weak Topic</span>
          <strong>${gap.weakTopic.name} (${gap.weakTopicAccuracy}%)</strong>
        </div>
        <div class="row-between">
          <span class="text-secondary" style="font-size:13.5px;">Possible Prerequisite Gap</span>
          <strong>${gap.prerequisiteTopic.name}${gap.prerequisiteAccuracy !== null ? " (" + gap.prerequisiteAccuracy + "%)" : " (no data)"}</strong>
        </div>
        <div class="chain">
          <div class="chain-node">${gap.prerequisiteTopic.name}</div>
          <div class="chain-link broken"></div>
          <div class="chain-node gap">${gap.weakTopic.name} ⚠</div>
        </div>
      </div>` : ""}

      <div class="ai-insight ${insight.type === "ok" ? "tone-ok" : ""}" style="margin-bottom:20px;">
        <div class="ai-insight-icon"><i data-lucide="${insight.type === "ok" ? "check" : "lightbulb"}"></i></div>
        <div style="flex:1;">
          <div class="ai-insight-title">AI Intervention Recommendation</div>
          <div class="ai-insight-body">${recommendation}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Topic-Wise Performance</div></div>
        <div id="topicBreakdown"></div>
      </div>
    `;

    const breakdown = [];
    student.subjects.forEach(sid => {
      const subject = getSubjectById(sid);
      getTopicsBySubject(sid).forEach(t => {
        const stats = getTopicStats(studentId, t.id);
        const status = classifyTopic(stats.accuracy, stats.total);
        breakdown.push({ subjectName: subject.name, name: t.name, ...stats, status });
      });
    });
    document.getElementById("topicBreakdown").innerHTML = breakdown.map(t => `
      <div class="topic-row">
        <div>
          <div class="topic-name">${t.name}</div>
          <div class="topic-name-sub">${t.subjectName}</div>
        </div>
        <div class="topic-score" style="color:${t.status === "weak" ? "var(--danger)" : t.status === "strong" ? "var(--success)" : "var(--text-primary)"}">${t.accuracy !== null ? t.accuracy + "%" : "—"}</div>
        <div class="progress-track"><div class="progress-fill ${t.status === "weak" ? "danger" : t.status === "needs_improvement" ? "warning" : t.status === "strong" ? "success" : ""}" style="width:${t.accuracy || 0}%"></div></div>
        <span class="${statusBadgeClass(t.status)}">${statusLabel(t.status)}</span>
      </div>
    `).join("");

    initIcons();
  }
})();
