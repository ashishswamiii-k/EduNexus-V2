/**
 * ANALYTICS.JS — analytics.html logic.
 */
(function () {
  const user = requireRole("teacher");
  if (!user) return;

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("teacher", "analytics.html");
    renderMobileTopbar("Analytics");
    applyChartTheme();
    renderSubjectChart();
    renderRiskChart();
    renderDifficultyChart();
    initIcons();
  });

  function renderSubjectChart() {
    const data = SUBJECTS.map(s => {
      const students = getAllStudents().filter(st => st.subjects.includes(s.id));
      const scores = students.map(st => getSubjectStats(st.id, s.id).accuracy).filter(a => a !== null);
      return { name: s.name, avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0, color: s.color };
    });
    new Chart(document.getElementById("subjectChart"), {
      type: "bar",
      data: { labels: data.map(d => d.name), datasets: [{ data: data.map(d => d.avg), backgroundColor: data.map(d => d.color), borderRadius: 6, maxBarThickness: 42 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + "%" } } } },
    });
  }

  function renderRiskChart() {
    const roster = getAllStudents().map(s => computeRiskScore(s.id).level);
    const low = roster.filter(r => r === "Low").length;
    const medium = roster.filter(r => r === "Medium").length;
    const high = roster.filter(r => r === "High").length;
    new Chart(document.getElementById("riskChart"), {
      type: "doughnut",
      data: { labels: ["Low Risk", "Medium Risk", "High Risk"], datasets: [{ data: [low, medium, high], backgroundColor: ["#1B998B", "#E8871E", "#D62839"], borderWidth: 0 }] },
      options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11.5 } } } } },
    });
  }

  function renderDifficultyChart() {
    const levels = ["easy", "medium", "hard"];
    const results = levels.map(level => {
      let correct = 0, total = 0;
      getAllStudents().forEach(s => {
        getAttempts(s.id).filter(e => e.difficulty === level).forEach(e => { total++; if (e.isCorrect) correct++; });
      });
      return total ? Math.round((correct / total) * 100) : 0;
    });
    new Chart(document.getElementById("difficultyChart"), {
      type: "bar",
      data: { labels: ["Easy", "Medium", "Hard"], datasets: [{ data: results, backgroundColor: ["#1B998B", "#E8871E", "#D62839"], borderRadius: 6, maxBarThickness: 60 }] },
      options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { min: 0, max: 100, ticks: { callback: v => v + "%" } } } },
    });
  }
})();
