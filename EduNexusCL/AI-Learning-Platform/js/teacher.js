/**
 * TEACHER.JS — teacher-dashboard.html logic.
 */
(function () {
  const user = requireRole("teacher");
  if (!user) return;

  let roster = [];

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("teacher", "teacher-dashboard.html");
    renderMobileTopbar("Class Overview");
    document.getElementById("teacherGreeting").textContent = `Welcome back, ${user.name.split(" ")[0]} 👋`;

    buildRoster();
    renderKPIs();
    renderAlertBanner();
    renderCharts();
    renderRoster("all");

    document.getElementById("riskFilter").addEventListener("change", (e) => renderRoster(e.target.value));
    initIcons();
  });

  function renderAlertBanner() {
    const mount = document.getElementById("alertBannerMount");
    const highRiskCount = roster.filter(r => r.risk === "High").length;
    if (highRiskCount === 0) {
      mount.innerHTML = "";
      return;
    }
    mount.innerHTML = `
      <div class="alert-banner">
        <div class="alert-banner-icon"><i data-lucide="alert-triangle"></i></div>
        <div style="flex:1;">
          <div class="alert-banner-title">EARLY INTERVENTION REQUIRED</div>
          <div class="alert-banner-sub">${highRiskCount} student${highRiskCount === 1 ? "" : "s"} may require attention.</div>
        </div>
        <a href="early-intervention.html" class="btn btn-outline btn-sm">Review Students</a>
      </div>
    `;
    initIcons();
  }

  function studentImprovementDelta(studentId, subjects) {
    let topics = [];
    subjects.forEach(sid => { topics = topics.concat(getTopicsBySubject(sid)); });
    const deltas = topics.map(t => {
      const trend = getTopicTrend(studentId, t.id);
      if (trend.earlierAccuracy === null || trend.recentAccuracy === null) return null;
      return trend.recentAccuracy - trend.earlierAccuracy;
    }).filter(d => d !== null);
    return deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  }

  function buildRoster() {
    roster = getAllStudents().map(s => {
      const overall = getOverallStats(s.id);
      let weakest = null;
      s.subjects.forEach(sid => {
        getWeakTopics(s.id, sid).forEach(t => {
          if (!weakest || t.accuracy < weakest.accuracy) weakest = t;
        });
      });
      const risk = computeRiskScore(s.id);
      return {
        id: s.id,
        name: s.name,
        subjects: s.subjects,
        score: overall.accuracy,
        weakTopicName: weakest ? weakest.topicMeta.name : "—",
        risk: risk.level,
        riskScore: risk.score,
        improvement: studentImprovementDelta(s.id, s.subjects),
      };
    });
  }

  function renderKPIs() {
    const scored = roster.filter(r => r.score !== null);
    const avgScore = scored.length ? Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length) : 0;
    const improving = roster.filter(r => r.improvement > 2).length;
    const needsAttention = roster.filter(r => r.risk === "Medium").length;
    const highRisk = roster.filter(r => r.risk === "High").length;

    const cards = [
      { icon: "users", label: "Students", numeric: roster.length },
      { icon: "target", label: "Average Score", numeric: avgScore, suffix: "%" },
      { icon: "trending-up", label: "Improving", numeric: improving },
      { icon: "alert-triangle", label: "High Risk", numeric: highRisk, sub: `${needsAttention} need attention` },
    ];
    document.getElementById("classKpis").innerHTML = cards.map((c, i) => `
      <div class="card kpi-card" style="animation-delay:${i * 60}ms">
        <div class="kpi-label"><i data-lucide="${c.icon}"></i>${c.label}</div>
        <div class="kpi-value" id="teacherKpi${i}">0</div>
        ${c.sub ? `<div class="kpi-delta" style="color:var(--text-muted)">${c.sub}</div>` : ""}
      </div>
    `).join("");
    initIcons();
    cards.forEach((c, i) => animateCount(document.getElementById("teacherKpi" + i), c.numeric, { suffix: c.suffix || "", duration: 800 }));
  }

  function renderCharts() {
    applyChartTheme();
    const low = roster.filter(r => r.risk === "Low").length;
    const medium = roster.filter(r => r.risk === "Medium").length;
    const high = roster.filter(r => r.risk === "High").length;

    new Chart(document.getElementById("riskChart"), {
      type: "doughnut",
      data: {
        labels: ["Low Risk", "Medium Risk", "High Risk"],
        datasets: [{ data: [low, medium, high], backgroundColor: ["#1B998B", "#E8871E", "#D62839"], borderWidth: 0 }],
      },
      options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11.5 } } } } },
    });

    const subjectAverages = SUBJECTS.map(s => {
      const students = getAllStudents().filter(st => st.subjects.includes(s.id));
      const scores = students.map(st => getSubjectStats(st.id, s.id).accuracy).filter(a => a !== null);
      return { name: s.name, avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0, color: s.color };
    });

    new Chart(document.getElementById("subjectAvgChart"), {
      type: "bar",
      data: {
        labels: subjectAverages.map(s => s.name),
        datasets: [{ data: subjectAverages.map(s => s.avg), backgroundColor: subjectAverages.map(s => s.color), borderRadius: 6, maxBarThickness: 40 }],
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + "%" } } } },
    });
  }

  function renderRoster(filter) {
    const rows = roster
      .filter(r => filter === "all" || r.risk === filter)
      .sort((a, b) => b.riskScore - a.riskScore);

    const tbody = document.getElementById("rosterBody");
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No students match this filter.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr class="row-link" onclick="window.location.href='student-analysis.html?student=${r.id}'">
        <td>
          <div class="student-cell">
            <div class="avatar" style="background:var(--primary); width:30px; height:30px; font-size:11.5px;">${initials(r.name)}</div>
            <div>${r.name}</div>
          </div>
        </td>
        <td class="mono">${r.score !== null ? r.score + "%" : "—"}</td>
        <td>${r.weakTopicName}</td>
        <td><span class="${riskBadgeClass(r.risk)}"><span class="badge-dot"></span>${r.risk.toUpperCase()}</span></td>
      </tr>
    `).join("");
  }
})();
