/**
 * TEACHER-SUBJECTS.JS — teacher-subjects.html logic. Read-only reference
 * view of the curriculum structure (subjects → topics → prerequisite chain).
 */
(function () {
  const user = requireRole("teacher");
  if (!user) return;

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("teacher", "teacher-subjects.html");
    renderMobileTopbar("Subjects");
    render();
    initIcons();
  });

  function render() {
    document.getElementById("subjectList").innerHTML = SUBJECTS.map(subject => {
      const topics = getTopicsBySubject(subject.id);
      const enrolledCount = getAllStudents().filter(s => s.subjects.includes(subject.id)).length;
      return `
        <div class="card">
          <div class="card-header">
            <div class="row">
              <div class="subject-icon" style="background:${subject.color}"><i data-lucide="${subject.icon}"></i></div>
              <div>
                <div class="card-title">${subject.name}</div>
                <div class="text-muted" style="font-size:12.5px;">${topics.length} topics · ${enrolledCount} students enrolled</div>
              </div>
            </div>
          </div>
          ${topics.map(t => {
            const prereq = getPrerequisiteTopic(t.id);
            const qCount = getQuestionsByTopic(t.id).length;
            return `
              <div class="topic-row" style="grid-template-columns: 1fr auto;">
                <div>
                  <div class="topic-name">${t.name}</div>
                  <div class="topic-name-sub">${prereq ? "Prerequisite: " + prereq.name : "No prerequisite"} · ${qCount} questions</div>
                </div>
                <span class="badge badge-neutral">${qCount} Qs</span>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }).join("");
    initIcons();
  }
})();
