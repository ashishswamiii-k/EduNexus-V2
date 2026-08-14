/**
 * QUESTION-BANK.JS — question-bank.html logic.
 */
(function () {
  const user = requireRole("teacher");
  if (!user) return;

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("teacher", "question-bank.html");
    renderMobileTopbar("Question Bank");

    const filter = document.getElementById("subjectFilter");
    SUBJECTS.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      filter.appendChild(opt);
    });
    filter.addEventListener("change", () => render(filter.value));

    render("all");
    initIcons();
  });

  function render(subjectId) {
    const questions = subjectId === "all" ? QUESTIONS : getQuestionsBySubject(subjectId);
    document.getElementById("qCountSub").textContent = `${questions.length} questions across ${subjectId === "all" ? SUBJECTS.length + " subjects" : getSubjectById(subjectId).name}.`;

    const diffBadge = (d) => d === "easy" ? "badge badge-success" : d === "medium" ? "badge badge-warning" : "badge badge-danger";

    document.getElementById("questionTable").innerHTML = `
      <table>
        <thead><tr><th>Question</th><th>Subject</th><th>Topic</th><th>Difficulty</th></tr></thead>
        <tbody>
          ${questions.map(q => `
            <tr>
              <td style="max-width:360px;">${q.question}</td>
              <td>${getSubjectById(q.subject).name}</td>
              <td>${getTopicById(q.topic).name}</td>
              <td><span class="${diffBadge(q.difficulty)}" style="text-transform:capitalize;">${q.difficulty}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
})();
