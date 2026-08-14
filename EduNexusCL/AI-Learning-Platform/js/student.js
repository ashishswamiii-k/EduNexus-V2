/**
 * STUDENT.JS — student-dashboard.html logic.
 */
(function () {
  const user = requireRole("student");
  if (!user) return;
  const studentId = user.id;
  const student = getStudentById(studentId);

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("student", "student-dashboard.html");
    renderMobileTopbar("Dashboard");
    renderGreeting();
    renderKPIs();
    renderAIInsight();
    renderJourney();
    renderCharts();
    renderWeakTopics();
    renderSubjectQuickList();
    maybeShowStreakToast();
    initIcons();
  });

  function greetingWord() {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }

  function renderGreeting() {
    const firstName = student.name.split(" ")[0];
    document.getElementById("greetingText").textContent = `${greetingWord()}, ${firstName} 👋`;
    const overall = getOverallStats(studentId);
    document.getElementById("greetingSub").textContent = overall.total > 0
      ? `You're at ${overall.accuracy}% overall across ${student.subjects.length} subjects. Let's keep the momentum going.`
      : "Take your first quiz to unlock your personalized insights.";
  }

  function allEnrolledTopics() {
    let topics = [];
    student.subjects.forEach(sid => { topics = topics.concat(getTopicsBySubject(sid)); });
    return topics;
  }

  function renderKPIs() {
    const overall = getOverallStats(studentId);
    const topics = allEnrolledTopics();
    const classified = topics.map(t => classifyTopic(getTopicStats(studentId, t.id).accuracy, getTopicStats(studentId, t.id).total));
    const mastered = classified.filter(s => s === "strong").length;
    const streak = getStreak(studentId);

    // Improvement: average (recent - earlier) accuracy delta across topics with enough data
    const deltas = topics.map(t => {
      const trend = getTopicTrend(studentId, t.id);
      if (trend.earlierAccuracy === null || trend.recentAccuracy === null) return null;
      return trend.recentAccuracy - trend.earlierAccuracy;
    }).filter(d => d !== null);
    const avgDelta = deltas.length ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0;

    const cards = [
      { icon: "target", label: "Overall Performance", numeric: overall.accuracy, suffix: "%", value: overall.accuracy !== null ? `${overall.accuracy}%` : "—", isText: overall.accuracy === null },
      { icon: "check-circle-2", label: "Topics Mastered", value: `${mastered}/${topics.length}`, isText: true },
      { icon: "flame", label: "Current Streak", numeric: streak, suffix: streak === 1 ? " Day" : " Days" },
      { icon: "trending-up", label: "Improvement", numeric: avgDelta, suffix: "%", signed: true, value: `${avgDelta >= 0 ? "+" : ""}${avgDelta}%`, delta: avgDelta >= 0 ? "up" : "down" },
    ];

    document.getElementById("kpiRow").innerHTML = cards.map((c, i) => `
      <div class="card kpi-card" style="animation-delay:${i * 60}ms">
        <div class="kpi-label"><i data-lucide="${c.icon}"></i>${c.label}</div>
        <div class="kpi-value" id="kpiVal${i}">${c.isText ? c.value : "0"}</div>
        ${c.delta ? `<div class="kpi-delta ${c.delta}">${c.delta === "up" ? "↑" : "↓"} vs earlier attempts</div>` : ""}
      </div>
    `).join("");
    initIcons();
    cards.forEach((c, i) => {
      const el = document.getElementById("kpiVal" + i);
      if (c.isText) return; // e.g. "8/12" — not a single number to count
      animateCount(el, c.numeric, { suffix: c.suffix || "", duration: 800, signed: !!c.signed });
    });
  }

  function renderAIInsight() {
    const insight = generateAIInsight(studentId);
    const mount = document.getElementById("aiInsightMount");
    let chainHTML = "";
    if (insight.type === "gap") {
      chainHTML = `
        <div class="chain">
          <div class="chain-node">${insight.prerequisiteTopic.name}</div>
          <div class="chain-link broken"></div>
          <div class="chain-node gap">${insight.weakTopic.name} ⚠</div>
        </div>`;
    }
    const toneClass = insight.type === "ok" ? "tone-ok" : "";
    const icon = insight.type === "ok" ? "check" : "alert-triangle";
    const cta = insight.type !== "ok"
      ? `<div style="margin-top:14px;"><a href="learning-path.html${insight.subjectId ? "?subject=" + insight.subjectId : ""}" class="btn btn-accent btn-sm"><i data-lucide="route"></i>View Learning Path</a></div>`
      : "";
    mount.innerHTML = `
      <div class="ai-insight ${toneClass} glow-once">
        <div class="ai-insight-icon"><i data-lucide="${icon}"></i></div>
        <div style="flex:1;">
          <div class="ai-insight-title">${insight.title}</div>
          <div class="ai-insight-body">${insight.message}</div>
          ${chainHTML}
          ${cta}
        </div>
      </div>
    `;
    initIcons();
  }

  function renderJourney() {
    const mount = document.getElementById("journeyMount");
    if (!mount) return;
    const insight = generateAIInsight(studentId);
    const subjectId = insight.subjectId || student.subjects[0];
    const path = generateLearningPath(studentId, subjectId);
    const firstNotDone = path.steps.findIndex(s => !s.done);
    const nodes = path.steps.map((s, i) => ({
      label: s.label,
      status: s.done ? "done" : (i === (firstNotDone === -1 ? path.steps.length - 1 : firstNotDone) ? "current" : "upcoming"),
    }));
    renderLearningJourney(mount, nodes);
  }

  function maybeShowStreakToast() {
    const streak = getStreak(studentId);
    const lastShownKey = "aelp_streak_toast_" + studentId;
    const lastShown = localStorage.getItem(lastShownKey);
    if (streak > 0 && streak % 5 === 0 && lastShown !== String(streak)) {
      showToast("🔥", streak + "-Day Learning Streak!", "Keep the momentum going.");
      localStorage.setItem(lastShownKey, String(streak));
    }
  }

  function renderCharts() {
    applyChartTheme();
    // ---- Performance over time (last 8 chronological attempt "buckets") ----
    const events = getAttempts(studentId).slice().sort((a, b) => a.date.localeCompare(b.date));
    const byDate = {};
    events.forEach(e => {
      byDate[e.date] = byDate[e.date] || { correct: 0, total: 0 };
      byDate[e.date].total++;
      if (e.isCorrect) byDate[e.date].correct++;
    });
    const dates = Object.keys(byDate).sort();
    const recentDates = dates.slice(-10);
    const trendLabels = recentDates.map(formatDate);
    const trendData = recentDates.map(d => Math.round((byDate[d].correct / byDate[d].total) * 100));

    new Chart(document.getElementById("perfOverTimeChart"), {
      type: "line",
      data: {
        labels: trendLabels.length ? trendLabels : ["No data yet"],
        datasets: [{
          label: "Accuracy %",
          data: trendData.length ? trendData : [0],
          borderColor: "#2B3A67",
          backgroundColor: "rgba(43,58,103,0.08)",
          fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: "#2B3A67",
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + "%" } } },
      },
    });

    // ---- Topic performance bar chart ----
    const topics = allEnrolledTopics();
    const topicStats = topics.map(t => ({ name: t.name, ...getTopicStats(studentId, t.id) }))
      .filter(t => t.total > 0);
    const colorFor = (status) => status === "weak" ? "#D62839" : status === "needs_improvement" ? "#E8871E" : status === "strong" ? "#1B998B" : "#C9CCDC";

    new Chart(document.getElementById("topicPerfChart"), {
      type: "bar",
      data: {
        labels: topicStats.map(t => t.name),
        datasets: [{
          label: "Accuracy %",
          data: topicStats.map(t => t.accuracy),
          backgroundColor: topicStats.map(t => colorFor(classifyTopic(t.accuracy, t.total))),
          borderRadius: 6,
          maxBarThickness: 34,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + "%" } }, x: { ticks: { autoSkip: false, font: { size: 10 } } } },
      },
    });
  }

  function renderWeakTopics() {
    const mount = document.getElementById("weakTopicsList");
    const topics = allEnrolledTopics();
    const classified = topics.map(t => ({ ...getTopicStats(studentId, t.id), meta: t, status: classifyTopic(getTopicStats(studentId, t.id).accuracy, getTopicStats(studentId, t.id).total) }))
      .filter(t => t.status === "weak" || t.status === "needs_improvement")
      .sort((a, b) => a.accuracy - b.accuracy);

    if (classified.length === 0) {
      mount.innerHTML = `<div class="empty-state"><i data-lucide="party-popper" style="width:28px;height:28px;margin:0 auto 10px;"></i><p>No weak topics right now. Great work!</p></div>`;
      initIcons();
      return;
    }

    mount.innerHTML = classified.slice(0, 6).map(t => `
      <div class="topic-row">
        <div>
          <div class="topic-name">${t.meta.name}</div>
          <div class="topic-name-sub">${getSubjectById(t.meta.subjectId).name}</div>
        </div>
        <div class="topic-score" style="color:${t.status === "weak" ? "var(--danger)" : "var(--warning)"}">${t.accuracy}%</div>
        <div class="progress-track"><div class="progress-fill ${t.status === "weak" ? "danger" : "warning"}" style="width:${t.accuracy}%"></div></div>
        <span class="${statusBadgeClass(t.status)}">${statusLabel(t.status)}</span>
      </div>
    `).join("");
  }

  function renderSubjectQuickList() {
    const mount = document.getElementById("subjectQuickList");
    mount.innerHTML = student.subjects.map(sid => {
      const subject = getSubjectById(sid);
      const stats = getSubjectStats(studentId, sid);
      return `
        <div class="card subject-card" style="padding:16px;" onclick="window.location.href='subjects.html?subject=${sid}'">
          <div class="subject-icon" style="background:${subject.color}"><i data-lucide="${subject.icon}"></i></div>
          <div>
            <div style="font-weight:600; font-size:14px;">${subject.name}</div>
            <div class="subject-topics-count">${getTopicsBySubject(sid).length} topics · ${stats.accuracy !== null ? stats.accuracy + "%" : "Not started"}</div>
          </div>
        </div>
      `;
    }).join("");
    initIcons();
  }
})();
