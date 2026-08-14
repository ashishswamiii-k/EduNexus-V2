/**
 * EARLY-INTERVENTION.JS — early-intervention.html logic. The filtered,
 * action-oriented view of the same risk data the class dashboard shows.
 */
(function () {
  const user = requireRole("teacher");
  if (!user) return;

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("teacher", "early-intervention.html");
    renderMobileTopbar("Early Intervention");
    render();
    initIcons();
  });

  function render() {
    const roster = getAllStudents().map(s => {
      const risk = computeRiskScore(s.id);
      const overall = getOverallStats(s.id);
      return { student: s, risk, overall };
    }).filter(r => r.risk.level !== "Low")
      .sort((a, b) => b.risk.score - a.risk.score);

    const mount = document.getElementById("interventionList");
    if (roster.length === 0) {
      mount.innerHTML = `
        <div class="card empty-state">
          <i data-lucide="party-popper" style="width:30px;height:30px;margin-bottom:10px;"></i>
          <p>No students currently need early intervention.</p>
        </div>`;
      initIcons();
      return;
    }

    mount.innerHTML = roster.map((r, i) => {
      const gap = findPrimaryGap(r.student.id);
      const rec = generateInterventionRecommendation(r.student.id);
      return `
        <div class="card reveal-section" style="animation-delay:${i * 70}ms;">
          <div class="row-between" style="margin-bottom:10px;">
            <div class="row">
              <div class="avatar">${initials(r.student.name)}</div>
              <div>
                <div style="font-weight:600;">${r.student.name}</div>
                <div class="text-muted" style="font-size:12.5px;">${r.student.subjects.map(sid => getSubjectById(sid).name).join(" · ")}</div>
              </div>
            </div>
            <span class="${riskBadgeClass(r.risk.level)}" style="font-size:12.5px; padding:6px 12px;"><span class="badge-dot"></span>${r.risk.level.toUpperCase()} · ${r.risk.score}</span>
          </div>
          ${gap ? `<div class="chain" style="margin:8px 0 10px;"><div class="chain-node">${gap.prerequisiteTopic.name}</div><div class="chain-link broken"></div><div class="chain-node gap">${gap.weakTopic.name} ⚠</div></div>` : ""}
          <div class="ai-insight tone-ok" style="padding:12px 14px;">
            <div class="ai-insight-icon" style="width:30px;height:30px;"><i data-lucide="lightbulb" style="width:15px;height:15px;"></i></div>
            <div style="flex:1;"><div class="ai-insight-body" style="font-size:13px;">${rec}</div></div>
          </div>
          <div style="margin-top:12px;"><a href="student-analysis.html?student=${r.student.id}" class="btn btn-outline btn-sm"><i data-lucide="external-link"></i>Full Analysis</a></div>
        </div>
      `;
    }).join("");
    initIcons();
  }
})();
