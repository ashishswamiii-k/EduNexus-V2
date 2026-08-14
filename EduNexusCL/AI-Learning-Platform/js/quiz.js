/**
 * QUIZ.JS — quiz.html logic.
 * Reads ?subject=<id>&topic=<id optional> from the URL, adaptively picks
 * a question set based on the student's own accuracy in that scope, then
 * runs a full next/previous/timer/submit flow before handing off to
 * result.html via sessionStorage.
 */
(function () {
  const user = requireRole("student");
  if (!user) return;
  const studentId = user.id;
  const student = getStudentById(studentId);

  const params = new URLSearchParams(window.location.search);
  const subjectId = params.get("subject");
  const topicId = params.get("topic"); // optional

  if (!subjectId || !student.subjects.includes(subjectId)) {
    window.location.href = "subjects.html";
    return;
  }

  const MAX_QUESTIONS = 10;
  let questions = [];
  let answers = {};       // questionId -> { selectedIndex, responseTime, questionStartedAt }
  let current = 0;
  let sessionId = `q_${Date.now()}`;
  let questionShownAt = Date.now();
  let submitted = false;

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("student", "subjects.html");
    renderMobileTopbar("Quiz");
    buildQuestionSet();
    if (questions.length === 0) {
      renderNoQuestions();
      return;
    }
    renderQuizFrame();
    renderQuestion();
    wireModal();
    initIcons();
  });

  // ---------------- Adaptive selection ----------------
  function pickDifficultyBand() {
    if (topicId) {
      const stats = getTopicStats(studentId, topicId);
      const acc = stats.accuracy;
      if (acc === null) return "easy";
      if (acc < 40) return "easy";
      if (acc <= 70) return "medium";
      return "hard";
    }
    return getAdaptiveDifficulty(studentId, subjectId);
  }

  function buildQuestionSet() {
    const pool = topicId ? getQuestionsByTopic(topicId) : getQuestionsBySubject(subjectId);
    const band = pickDifficultyBand();
    const order = { easy: ["easy", "medium", "hard"], medium: ["medium", "easy", "hard"], hard: ["hard", "medium", "easy"] }[band];

    let picked = [];
    order.forEach(diff => {
      if (picked.length >= MAX_QUESTIONS) return;
      const shuffled = pool.filter(q => q.difficulty === diff).sort(() => Math.random() - 0.5);
      picked = picked.concat(shuffled.filter(q => !picked.includes(q)));
    });
    questions = picked.slice(0, MAX_QUESTIONS);
    window.__quizBand = band;
  }

  function renderNoQuestions() {
    document.getElementById("quizShell").innerHTML = `
      <div class="card empty-state">
        <i data-lucide="inbox" style="width:30px;height:30px;margin-bottom:10px;"></i>
        <p>No questions are available for this selection yet.</p>
        <a href="subjects.html" class="btn btn-outline" style="margin-top:14px;">Back to Subjects</a>
      </div>`;
    initIcons();
  }

  // ---------------- Frame ----------------
  function renderQuizFrame() {
    const subject = getSubjectById(subjectId);
    const topic = topicId ? getTopicById(topicId) : null;
    document.getElementById("quizShell").innerHTML = `
      <div class="quiz-top">
        <div>
          <div class="quiz-progress-label" id="progressLabel"></div>
          <div class="text-muted" style="font-size:12.5px; margin-top:2px;">${subject.name}${topic ? " · " + topic.name : ""} · Adaptive difficulty: <strong style="color:var(--text-primary); text-transform:capitalize;">${window.__quizBand}</strong></div>
        </div>
        <div class="quiz-timer"><i data-lucide="timer"></i><span id="timerText">00:00</span></div>
      </div>
      <div class="quiz-progress-track"><div class="quiz-progress-fill" id="quizProgressFill"></div></div>
      <div class="card">
        <div class="quiz-question-wrap" id="quizCardBody">
          <div class="quiz-meta" id="quizMeta"></div>
          <div class="quiz-question" id="quizQuestionText"></div>
          <div id="quizOptions"></div>
        </div>
      </div>
      <div class="quiz-jump" id="quizJump"></div>
      <div class="quiz-nav">
        <button class="btn btn-outline" id="prevBtn"><i data-lucide="arrow-left"></i><span>Previous</span></button>
        <button class="btn btn-primary" id="nextBtn"><span>Next</span><i data-lucide="arrow-right"></i></button>
      </div>
    `;
    document.getElementById("prevBtn").addEventListener("click", goPrev);
    document.getElementById("nextBtn").addEventListener("click", goNext);
    startTimerTick();
  }

  let timerInterval = null;
  function startTimerTick() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const secs = Math.floor((Date.now() - questionShownAt) / 1000);
      const mm = String(Math.floor(secs / 60)).padStart(2, "0");
      const ss = String(secs % 60).padStart(2, "0");
      const el = document.getElementById("timerText");
      if (el) el.textContent = `${mm}:${ss}`;
    }, 1000);
  }

  function retriggerAnimation(el) {
    if (!el) return;
    el.style.animation = "none";
    void el.offsetWidth; // force reflow
    el.style.animation = "";
  }

  // ---------------- Question rendering ----------------
  function renderQuestion() {
    retriggerAnimation(document.getElementById("quizCardBody"));
    const q = questions[current];
    document.getElementById("progressLabel").textContent = `Question ${current + 1} / ${questions.length}`;
    document.getElementById("quizProgressFill").style.width = `${((current + 1) / questions.length) * 100}%`;
    document.getElementById("quizMeta").innerHTML = `
      <span class="badge badge-neutral" style="text-transform:capitalize;">${q.difficulty}</span>
      <span class="badge badge-neutral">${getTopicById(q.topic).name}</span>
    `;
    document.getElementById("quizQuestionText").textContent = q.question;

    const existing = answers[q.id];
    document.getElementById("quizOptions").innerHTML = q.options.map((opt, i) => `
      <div class="option ${existing && existing.selectedIndex === i ? "selected" : ""}" data-index="${i}">
        <div class="option-dot"></div>
        <div>${opt}</div>
      </div>
    `).join("");

    document.querySelectorAll(".option").forEach(el => {
      el.addEventListener("click", () => selectOption(q, parseInt(el.dataset.index, 10)));
    });

    document.getElementById("prevBtn").disabled = current === 0;
    document.getElementById("nextBtn").innerHTML = current === questions.length - 1
      ? `<span>Submit Quiz</span><i data-lucide="check"></i>`
      : `<span>Next</span><i data-lucide="arrow-right"></i>`;

    renderJumpDots();
    questionShownAt = Date.now();
    initIcons();
  }

  function renderJumpDots() {
    document.getElementById("quizJump").innerHTML = questions.map((q, i) => `
      <div class="quiz-jump-item ${i === current ? "current" : ""} ${answers[q.id] ? "answered" : ""}" data-i="${i}">${i + 1}</div>
    `).join("");
    document.querySelectorAll(".quiz-jump-item").forEach(el => {
      el.addEventListener("click", () => { commitTimeForCurrent(); current = parseInt(el.dataset.i, 10); renderQuestion(); });
    });
  }

  function selectOption(q, index) {
    const prevTime = answers[q.id] ? answers[q.id].responseTime : 0;
    answers[q.id] = { selectedIndex: index, responseTime: prevTime + Math.max(1, Math.round((Date.now() - questionShownAt) / 1000)) };
    questionShownAt = Date.now();
    renderQuestion();
  }

  function commitTimeForCurrent() {
    const q = questions[current];
    if (answers[q.id]) {
      answers[q.id].responseTime += Math.max(0, Math.round((Date.now() - questionShownAt) / 1000));
    }
  }

  function goPrev() {
    if (current === 0) return;
    commitTimeForCurrent();
    current--;
    renderQuestion();
  }

  function goNext() {
    commitTimeForCurrent();
    if (current < questions.length - 1) {
      current++;
      renderQuestion();
    } else {
      openSubmitModal();
    }
  }

  // ---------------- Submit ----------------
  function wireModal() {
    document.getElementById("cancelSubmit").addEventListener("click", closeSubmitModal);
    document.getElementById("confirmSubmit").addEventListener("click", doSubmit);
  }

  function openSubmitModal() {
    const answeredCount = Object.keys(answers).length;
    const unanswered = questions.length - answeredCount;
    document.getElementById("submitModalText").textContent = unanswered > 0
      ? `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?`
      : "You're about to submit your answers. This can't be undone.";
    document.getElementById("submitModal").classList.add("open");
  }
  function closeSubmitModal() { document.getElementById("submitModal").classList.remove("open"); }

  function doSubmit() {
    if (submitted) return;
    submitted = true;
    clearInterval(timerInterval);
    closeSubmitModal();

    const today = new Date().toISOString().slice(0, 10);
    const events = questions.map(q => {
      const a = answers[q.id];
      const selectedIndex = a ? a.selectedIndex : -1;
      return {
        id: `${sessionId}_${q.id}`,
        date: today,
        sessionId,
        subjectId: q.subject,
        topicId: q.topic,
        questionId: q.id,
        selectedIndex,
        isCorrect: selectedIndex === q.correct,
        difficulty: q.difficulty,
        responseTime: a ? Math.max(1, a.responseTime) : 0,
      };
    });

    appendAttempts(studentId, events);

    const correctCount = events.filter(e => e.isCorrect).length;
    const summary = {
      sessionId,
      subjectId,
      topicId: topicId || null,
      total: events.length,
      correct: correctCount,
      score: Math.round((correctCount / events.length) * 100),
      avgResponseTime: Math.round(events.reduce((s, e) => s + e.responseTime, 0) / events.length),
      questionIds: events.map(e => e.questionId),
      topicIds: [...new Set(events.map(e => e.topicId))],
    };
    sessionStorage.setItem("aelp_last_result", JSON.stringify(summary));

    showAnalyzingThenRedirect();
  }

  function showAnalyzingThenRedirect() {
    document.getElementById("quizShell").innerHTML = `
      <div class="card analyzing-wrap">
        <div class="analyzing-dots" id="analyzingDots"><span></span><span></span><span></span></div>
        <div class="analyzing-text" id="analyzingText">Analyzing your performance…</div>
      </div>
    `;
    const reduced = document.documentElement.classList.contains("reduced-motion");
    const delay = reduced ? 50 : 900;
    setTimeout(() => {
      document.getElementById("analyzingDots").style.display = "none";
      document.getElementById("analyzingText").outerHTML = '<div class="analyzing-done" id="analyzingText"><i data-lucide="check-circle-2"></i> Analysis Complete</div>';
      initIcons();
      setTimeout(() => { window.location.href = "result.html"; }, reduced ? 50 : 500);
    }, delay);
  }
})();
