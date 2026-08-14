/**
 * PROGRESS.JS — progress.html logic. A deeper, full-subject version of
 * the dashboard's charts plus a topic-by-topic table for every enrolled subject.
 */
(function () {
  const user = requireRole("student");
  if (!user) return;
  const studentId = user.id;
  const student = getStudentById(studentId);

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("student", "progress.html");
    renderMobileTopbar("Progress");
    renderKpis();
    renderTrendChart();
    renderSubjectBreakdown();
    initIcons();
  });

  function renderKpis() {
    const overall = getOverallStats(studentId);
    const streak = getStreak(studentId);
    let topics = [];
    student.subjects.forEach(sid => { topics = topics.concat(getTopicsBySubject(sid)); });
    const classified = topics.map(t => { const s = getTopicStats(studentId, t.id); return classifyTopic(s.accuracy, s.total); });
    const mastered = classified.filter(s => s === "strong").length;
    const weak = classified.filter(s => s === "weak").length;

    const cards = [
      { icon: "target", label: "Overall Accuracy", numeric: overall.accuracy, suffix: "%" },
      { icon: "list-checks", label: "Questions Answered", numeric: overall.total },
      { icon: "trophy", label: "Topics Mastered", numeric: mastered },
      { icon: "alert-circle", label: "Weak Topics", numeric: weak },
    ];
    document.getElementById("progressKpis").innerHTML = cards.map((c, i) => `
      <div class="card kpi-card" style="animation-delay:${i * 60}ms">
        <div class="kpi-label"><i data-lucide="${c.icon}"></i>${c.label}</div>
        <div class="kpi-value" id="progKpi${i}">0</div>
      </div>
    `).join("");
    initIcons();
    cards.forEach((c, i) => animateCount(document.getElementById("progKpi" + i), c.numeric, { suffix: c.suffix || "", duration: 800 }));
  }

  function renderTrendChart() {
    applyChartTheme();
    const events = getAttempts(studentId).slice().sort((a, b) => a.date.localeCompare(b.date));
    const byDate = {};
    events.forEach(e => {
      byDate[e.date] = byDate[e.date] || { correct: 0, total: 0 };
      byDate[e.date].total++;
      if (e.isCorrect) byDate[e.date].correct++;
    });
    const dates = Object.keys(byDate).sort();
    const labels = dates.map(formatDate);
    const data = dates.map(d => Math.round((byDate[d].correct / byDate[d].total) * 100));
    new Chart(document.getElementById("progressTrendChart"), {
      type: "line",
      data: { labels: labels.length ? labels : ["No data yet"], datasets: [{ label: "Accuracy %", data: data.length ? data : [0], borderColor: "#2B3A67", backgroundColor: "rgba(43,58,103,0.08)", fill: true, tension: 0.35, pointRadius: 2 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + "%" } }, x: { ticks: { maxTicksLimit: 10 } } } },
    });
  }

  function renderSubjectBreakdown() {
    const mount = document.getElementById("subjectBreakdown");
    mount.innerHTML = student.subjects.map(sid => {
      const subject = getSubjectById(sid);
      const topics = getTopicsBySubject(sid).map(t => ({ ...t, ...getTopicStats(studentId, t.id) }));
      return `
        <div class="card" style="margin-bottom:18px;">
          <div class="card-header">
            <div class="row"><div class="subject-icon" style="background:${subject.color}; width:32px; height:32px;"><i data-lucide="${subject.icon}" style="width:16px;height:16px;"></i></div><div class="card-title">${subject.name}</div></div>
          </div>
          ${topics.map(t => {
            const status = classifyTopic(t.accuracy, t.total);
            return `
            <div class="topic-row">
              <div class="topic-name">${t.name}</div>
              <div class="topic-score" style="color:${status === "weak" ? "var(--danger)" : status === "strong" ? "var(--success)" : "var(--text-primary)"}">${t.accuracy !== null ? t.accuracy + "%" : "—"}</div>
              <div class="progress-track"><div class="progress-fill ${status === "weak" ? "danger" : status === "needs_improvement" ? "warning" : status === "strong" ? "success" : ""}" style="width:${t.accuracy || 0}%"></div></div>
              <span class="${statusBadgeClass(status)}">${statusLabel(status)}</span>
            </div>`;
          }).join("")}
        </div>
      `;
    }).join("");
    initIcons();
  }
})();
