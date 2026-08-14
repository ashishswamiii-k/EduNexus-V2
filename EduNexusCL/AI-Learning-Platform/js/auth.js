/**
 * AUTH.JS — index.html (login + registration) logic.
 */
document.addEventListener("DOMContentLoaded", () => {
  if (window.seedIfNeeded) seedIfNeeded();

  // If already logged in, skip straight to the right dashboard
  const existing = getCurrentUser();
  if (existing) {
    window.location.href = existing.role === "teacher" ? "teacher-dashboard.html" : "student-dashboard.html";
    return;
  }

  initLoginPanel();
  initAuthTabs();
  initStudentRegister();
  initTeacherRegister();
});

/* ==========================================================================
   Login
   ========================================================================== */
function initLoginPanel() {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorBox = document.getElementById("loginError");
  const roleTabs = document.querySelectorAll(".role-tab");
  let selectedRole = "student";

  roleTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      roleTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      selectedRole = tab.dataset.role;
      document.getElementById("demoHint").textContent = selectedRole === "teacher"
        ? "Demo login — teacher@test.com / teacher123"
        : "Demo login — student@test.com / student123";
      document.getElementById("email").placeholder = selectedRole === "teacher" ? "you@test.com or Teacher ID" : "you@test.com or Student ID";
    });
  });

  document.querySelectorAll(".fill-demo").forEach(btn => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role;
      roleTabs.forEach(t => t.classList.toggle("active", t.dataset.role === role));
      selectedRole = role;
      if (role === "teacher") {
        emailInput.value = "teacher@test.com";
        passwordInput.value = "teacher123";
      } else {
        emailInput.value = "student@test.com";
        passwordInput.value = "student123";
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.classList.remove("visible");
    const identifier = emailInput.value.trim();
    const password = passwordInput.value;

    if (selectedRole === "teacher") {
      const teacher = findTeacherForLogin(identifier);
      if (teacher && teacher.password === password) {
        setCurrentUser({ role: "teacher", id: teacher.id, name: teacher.name, email: teacher.email });
        window.location.href = "teacher-dashboard.html";
        return;
      }
    } else {
      const student = findStudentForLogin(identifier);
      if (student && student.password === password) {
        setCurrentUser({ role: "student", id: student.id, name: student.name, email: student.email });
        window.location.href = "student-dashboard.html";
        return;
      }
    }
    errorBox.textContent = "Incorrect email/ID or password for the selected role. Try the demo credentials below.";
    errorBox.classList.add("visible");
  });

  window.__prefillLogin = (role, identifier, password) => {
    roleTabs.forEach(t => t.classList.toggle("active", t.dataset.role === role));
    selectedRole = role;
    emailInput.value = identifier;
    if (password) passwordInput.value = password;
  };
}

/* ==========================================================================
   Login / Register top-level tabs
   ========================================================================== */
function initAuthTabs() {
  const tabs = document.querySelectorAll(".auth-tab");
  const panels = document.querySelectorAll(".auth-panel");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.panel).classList.add("active");
    });
  });
}

window.switchAuthTab = function (panelId) {
  document.querySelectorAll(".auth-tab").forEach(t => t.classList.toggle("active", t.dataset.panel === panelId));
  document.querySelectorAll(".auth-panel").forEach(p => p.classList.toggle("active", p.id === panelId));
};

/* ==========================================================================
   Student registration
   ========================================================================== */
function initStudentRegister() {
  const form = document.getElementById("studentRegisterForm");
  if (!form) return;
  const schoolEl = document.getElementById("regSchool");
  const rollEl = document.getElementById("regRoll");
  const nameEl = document.getElementById("regName");
  const passEl = document.getElementById("regPassword");
  const confirmEl = document.getElementById("regConfirm");
  const idHint = document.getElementById("studentIdHint");
  const errorBox = document.getElementById("studentRegError");
  const reveal = document.getElementById("studentIdReveal");

  function updateIdPreview() {
    if (!schoolEl.value.trim() || !rollEl.value.trim()) { idHint.innerHTML = ""; return; }
    const id = generateStudentId(schoolEl.value, rollEl.value);
    if (isStudentIdTaken(id)) {
      idHint.className = "field-hint bad";
      idHint.innerHTML = '<i data-lucide="alert-triangle"></i> Student ID already exists: ' + id + ' — check the roll number.';
    } else {
      idHint.className = "field-hint ok";
      idHint.innerHTML = '<i data-lucide="check-circle-2"></i> Student ID available: ' + id;
    }
    initIcons();
  }
  schoolEl.addEventListener("input", updateIdPreview);
  rollEl.addEventListener("input", updateIdPreview);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.classList.remove("visible");

    const schoolName = schoolEl.value.trim();
    const name = nameEl.value.trim();
    const roll = rollEl.value.trim();
    const password = passEl.value;
    const confirm = confirmEl.value;

    if (!schoolName || !name || !roll || !password || !confirm) {
      return showRegError(errorBox, "Please fill in every field.");
    }
    if (!/^[A-Za-z0-9]+$/.test(roll)) {
      return showRegError(errorBox, "Roll number should contain only letters and numbers.");
    }
    if (password.length < 6) {
      return showRegError(errorBox, "Password must be at least 6 characters.");
    }
    if (password !== confirm) {
      return showRegError(errorBox, "Passwords do not match.");
    }

    const result = registerStudent({ schoolName, name, rollNumber: roll, password });
    if (!result.ok) {
      return showRegError(errorBox, "Student ID " + result.id + " already exists. Please check the roll number.");
    }

    form.style.display = "none";
    reveal.classList.remove("hidden");
    reveal.innerHTML =
      '<div class="id-reveal-label">Your Student ID</div>' +
      '<div class="id-reveal-value">' + result.id + '</div>' +
      '<div class="id-reveal-hint">Use this ID (or your password) to log in any time.</div>' +
      '<button type="button" class="btn btn-primary btn-block" style="margin-top:14px;" id="goToLoginBtn">Continue to Log In</button>';
    document.getElementById("goToLoginBtn").addEventListener("click", () => {
      switchAuthTab("panel-login");
      window.__prefillLogin("student", result.id, password);
    });
  });
}

/* ==========================================================================
   Teacher registration
   ========================================================================== */
function initTeacherRegister() {
  const form = document.getElementById("teacherRegisterForm");
  if (!form) return;
  const schoolEl = document.getElementById("regTSchool");
  const mobileEl = document.getElementById("regMobile");
  const nameEl = document.getElementById("regTName");
  const passEl = document.getElementById("regTPassword");
  const confirmEl = document.getElementById("regTConfirm");
  const idHint = document.getElementById("teacherIdHint");
  const errorBox = document.getElementById("teacherRegError");
  const reveal = document.getElementById("teacherIdReveal");

  function updateIdPreview() {
    const digits = mobileEl.value.replace(/\D/g, "");
    if (!schoolEl.value.trim() || digits.length < 4) { idHint.innerHTML = ""; return; }
    const id = generateTeacherId(schoolEl.value, mobileEl.value);
    if (isTeacherIdTaken(id)) {
      idHint.className = "field-hint bad";
      idHint.innerHTML = '<i data-lucide="alert-triangle"></i> Teacher ID already exists: ' + id;
    } else {
      idHint.className = "field-hint ok";
      idHint.innerHTML = '<i data-lucide="check-circle-2"></i> Teacher ID available: ' + id;
    }
    initIcons();
  }
  schoolEl.addEventListener("input", updateIdPreview);
  mobileEl.addEventListener("input", updateIdPreview);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.classList.remove("visible");

    const schoolName = schoolEl.value.trim();
    const name = nameEl.value.trim();
    const mobile = mobileEl.value.trim();
    const password = passEl.value;
    const confirm = confirmEl.value;

    if (!schoolName || !name || !mobile || !password || !confirm) {
      return showRegError(errorBox, "Please fill in every field.");
    }
    if (!/^\d{10}$/.test(mobile.replace(/\D/g, ""))) {
      return showRegError(errorBox, "Enter a valid 10-digit mobile number.");
    }
    if (password.length < 6) {
      return showRegError(errorBox, "Password must be at least 6 characters.");
    }
    if (password !== confirm) {
      return showRegError(errorBox, "Passwords do not match.");
    }

    const result = registerTeacher({ schoolName, name, mobile, password });
    if (!result.ok) {
      return showRegError(errorBox, "Teacher ID " + result.id + " already exists.");
    }

    form.style.display = "none";
    reveal.classList.remove("hidden");
    reveal.innerHTML =
      '<div class="id-reveal-label">Your Teacher ID</div>' +
      '<div class="id-reveal-value">' + result.id + '</div>' +
      '<div class="id-reveal-hint">Use this ID (or your password) to log in any time.</div>' +
      '<button type="button" class="btn btn-primary btn-block" style="margin-top:14px;" id="goToLoginBtnT">Continue to Log In</button>';
    document.getElementById("goToLoginBtnT").addEventListener("click", () => {
      switchAuthTab("panel-login");
      window.__prefillLogin("teacher", result.id, password);
    });
  });
}

function showRegError(errorBox, msg) {
  errorBox.textContent = msg;
  errorBox.classList.add("visible");
}
