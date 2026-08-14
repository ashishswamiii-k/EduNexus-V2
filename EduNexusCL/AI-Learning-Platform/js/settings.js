/**
 * SETTINGS.JS — settings.html logic. Shared page for both student and
 * teacher accounts.
 */
(function () {
  const user = requireAnyRole();
  if (!user) return;

  document.addEventListener("DOMContentLoaded", () => {
    renderSidebar(user.role, "settings.html");
    renderMobileTopbar("Settings");

    const darkSwitch = document.getElementById("darkModeSwitch");
    darkSwitch.checked = getTheme() === "dark";
    darkSwitch.addEventListener("change", () => setTheme(darkSwitch.checked ? "dark" : "light"));

    const motionSwitch = document.getElementById("motionSwitch");
    motionSwitch.checked = document.documentElement.classList.contains("reduced-motion");
    motionSwitch.addEventListener("change", () => setReducedMotion(motionSwitch.checked));

    document.getElementById("settingsLogoutBtn").addEventListener("click", logout);

    renderAccountInfo();
    initIcons();
  });

  function renderAccountInfo() {
    const mount = document.getElementById("accountInfo");
    const rows = [
      { label: "Name", value: user.name },
      { label: user.role === "teacher" ? "Teacher ID" : "Student ID", value: user.id },
      { label: "Role", value: user.role === "teacher" ? "Teacher" : "Student" },
    ];
    if (user.role === "student") {
      const s = getStudentById(user.id);
      if (s) {
        rows.push({ label: "Enrolled Subjects", value: s.subjects.map(sid => getSubjectById(sid).name).join(", ") });
        if (s.schoolName) rows.push({ label: "School", value: s.schoolName });
      }
    } else {
      const t = getAllTeachers().find(x => x.id === user.id);
      if (t && t.schoolName) rows.push({ label: "School", value: t.schoolName });
    }
    mount.innerHTML = rows.map(r => `
      <div class="settings-row">
        <div class="settings-row-title">${r.label}</div>
        <div class="text-secondary mono" style="font-size:13px;">${r.value}</div>
      </div>
    `).join("");
  }
})();
