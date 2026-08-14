/**
 * LEARNING-PATH.JS — learning-path.html logic.
 * Renders the AI-generated, prerequisite-aware step sequence for
 * whichever subject is selected (via ?subject= or a same-page tab).
 */
(function () {
  const user = requireRole("student");
  if (!user) return;
  const studentId = user.id;
  const student = getStudentById(studentId);

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("student", "learning-path.html");
    renderMobileTopbar("Learning Path");

    const params = new URLSearchParams(window.location.search);
    let subjectId = params.get("subject");
    if (!subjectId || !student.subjects.includes(subjectId)) {
      const gap = findPrimaryGap(studentId);
      subjectId = gap ? gap.subjectId : student.subjects[0];
    }
    render(subjectId);
    initIcons();
  });

  const STEP_ICONS = { review: "book-open", revise: "rotate-ccw", practice: "pencil", assessment: "clipboard-check", learn: "graduation-cap", adaptive: "zap" };

  function render(subjectId) {
    const subject = getSubjectById(subjectId);
    const path = generateLearningPath(studentId, subjectId);

    const tabs = student.subjects.map(sid => {
      const s = getSubjectById(sid);
      return `<div class="role-tab ${sid === subjectId ? "active" : ""}" data-sid="${sid}" style="cursor:pointer;">${s.name}</div>`;
    }).join("");

    let gapBanner = "";
    if (path.hasGap) {
      gapBanner = `
        <div class="ai-insight" style="margin-bottom:22px;">
          <div class="ai-insight-icon"><i data-lucide="alert-triangle"></i></div>
          <div style="flex:1;">
            <div class="ai-insight-title">Learning Gap Detected</div>
            <div class="ai-insight-body">Your performance suggests that revising ${path.gap.prerequisiteTopic.name} may help before continuing with advanced ${path.gap.weakTopic.name}.</div>
            <div class="chain">
              <div class="chain-node">${path.gap.prerequisiteTopic.name}</div>
              <div class="chain-link broken"></div>
              <div class="chain-node gap">${path.gap.weakTopic.name} ⚠</div>
            </div>
          </div>
        </div>`;
    }

    document.getElementById("pageContent").innerHTML = `
      <div class="topbar">
        <div>
          <div class="page-eyebrow">Personalized Path</div>
          <h1 class="page-title">Your Learning Path</h1>
          <p class="page-sub">Generated from your quiz performance in ${subject.name}.</p>
        </div>
      </div>
      ${student.subjects.length > 1 ? `<div class="role-tabs" id="subjectTabs" style="max-width:520px;">${tabs}</div>` : ""}
      ${gapBanner}
      <div class="card">
        <div class="card-header"><div class="card-title">Recommended Steps</div></div>
        <div id="stepper"></div>
      </div>
    `;

    document.getElementById("stepper").innerHTML = path.steps.map((step, i) => `
      <div class="path-step reveal-section ${step.done ? "done" : i === firstNotDone(path.steps) ? "focus" : ""}" style="animation-delay:${i * 110}ms">
        <div class="path-line"></div>
        <div class="path-marker">${step.done ? '<i data-lucide="check"></i>' : `<i data-lucide="${STEP_ICONS[step.type] || "circle"}"></i>`}</div>
        <div class="path-step-body">
          <div class="path-step-title">${step.label}</div>
          <div class="path-step-tag">${step.type}</div>
        </div>
      </div>
    `).join("");

    const tabEls = document.querySelectorAll("#subjectTabs .role-tab");
    tabEls.forEach(el => el.addEventListener("click", () => render(el.dataset.sid)));

    // CTA at the bottom to actually go take the adaptive quiz
    const lastStep = path.steps[path.steps.length - 1];
    const focusTopicId = path.focusTopic ? path.focusTopic.topicId : (path.gap ? path.gap.weakTopic.id : null);
    document.getElementById("stepper").insertAdjacentHTML("afterend", `
      <div style="margin-top:20px; text-align:center;">
        <a href="quiz.html?subject=${subjectId}${path.hasGap ? "&topic=" + path.gap.prerequisiteTopic.id : (focusTopicId ? "&topic=" + focusTopicId : "")}" class="btn btn-accent"><i data-lucide="zap"></i><span>Take Adaptive Quiz</span></a>
      </div>
    `);
    initIcons();
  }

  function firstNotDone(steps) {
    const idx = steps.findIndex(s => !s.done);
    return idx === -1 ? steps.length - 1 : idx;
  }
})();
