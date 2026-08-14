/**
 * SUBJECTS.JS — subjects.html logic.
 * With no ?subject= param: grid of every subject the student is enrolled in.
 * With ?subject=<id>: full topic-by-topic breakdown for that subject
 * (section 18 of the brief), each topic clickable into a focused quiz.
 */
(function () {
  const user = requireRole("student");
  if (!user) return;
  const studentId = user.id;
  const student = getStudentById(studentId);

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("student", "subjects.html");
    renderMobileTopbar("My Subjects");

    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get("subject");

    if (subjectId && student.subjects.includes(subjectId)) {
      renderSubjectDetail(subjectId);
    } else {
      renderSubjectGrid();
    }
    initIcons();
  });

  function renderSubjectGrid() {
    const mount = document.getElementById("pageContent");
    mount.innerHTML = `
      <div class="topbar">
        <div>
          <div class="page-eyebrow">Enrolled Subjects</div>
          <h1 class="page-title">My Subjects</h1>
          <p class="page-sub">${student.subjects.length} subjects assigned to you.</p>
        </div>
      </div>
      <div class="grid grid-3" id="subjectGrid"></div>
    `;
    document.getElementById("subjectGrid").innerHTML = student.subjects.map(sid => {
      const subject = getSubjectById(sid);
      const stats = getSubjectStats(studentId, sid);
      const topicCount = getTopicsBySubject(sid).length;
      return `
        <div class="card subject-card" onclick="window.location.href='subjects.html?subject=${sid}'">
          <div class="row-between">
            <div class="subject-icon" style="background:${subject.color}"><i data-lucide="${subject.icon}"></i></div>
            ${stats.accuracy !== null ? `<span class="${statusBadgeClass(classifyTopic(stats.accuracy, stats.total))}">${stats.accuracy}%</span>` : `<span class="badge badge-neutral">New</span>`}
          </div>
          <div>
            <div style="font-weight:600; font-size:16px; margin-top:6px;">${subject.name}</div>
            <div class="subject-topics-count">${topicCount} topics</div>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${stats.accuracy || 0}%; background:${subject.color}"></div></div>
        </div>
      `;
    }).join("");
    initIcons();
  }

  function renderSubjectDetail(subjectId) {
    const subject = getSubjectById(subjectId);
    const stats = getSubjectStats(studentId, subjectId);
    const topics = getTopicsBySubject(subjectId).map(t => {
      const tStats = getTopicStats(studentId, t.id);
      return { ...t, ...tStats, status: classifyTopic(tStats.accuracy, tStats.total) };
    });

    const mount = document.getElementById("pageContent");
    mount.innerHTML = `
      <a href="subjects.html" class="text-secondary" style="font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px; margin-bottom:16px;"><i data-lucide="arrow-left" style="width:15px;height:15px;"></i> All Subjects</a>
      <div class="topbar">
        <div class="row">
          <div class="subject-icon" style="background:${subject.color}; width:52px; height:52px;"><i data-lucide="${subject.icon}" style="width:24px;height:24px;"></i></div>
          <div>
            <h1 class="page-title">${subject.name}</h1>
            <p class="page-sub">Overall: <strong style="color:var(--text-primary)">${stats.accuracy !== null ? stats.accuracy + "%" : "Not started"}</strong> · ${topics.length} topics</p>
          </div>
        </div>
        <a href="quiz.html?subject=${subjectId}" class="btn btn-primary"><i data-lucide="zap"></i><span>Start Adaptive Quiz</span></a>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Topics</div></div>
        <div id="topicList"></div>
      </div>
    `;

    document.getElementById("topicList").innerHTML = topics.map(t => `
      <div class="topic-row" style="cursor:pointer;" onclick="window.location.href='quiz.html?subject=${subjectId}&topic=${t.id}'">
        <div>
          <div class="topic-name">${t.name}</div>
          <div class="topic-name-sub">${t.total > 0 ? `${t.total} questions attempted` : "Not attempted yet"}</div>
        </div>
        <div class="topic-score" style="color:${t.status === "weak" ? "var(--danger)" : t.status === "strong" ? "var(--success)" : "var(--text-primary)"}">${t.accuracy !== null ? t.accuracy + "%" : "—"}</div>
        <div class="progress-track"><div class="progress-fill ${t.status === "weak" ? "danger" : t.status === "needs_improvement" ? "warning" : t.status === "strong" ? "success" : ""}" style="width:${t.accuracy || 0}%"></div></div>
        <span class="${statusBadgeClass(t.status)}">${statusLabel(t.status)}</span>
      </div>
    `).join("");
    initIcons();
  }
})();
