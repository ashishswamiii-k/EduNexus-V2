/**
 * APP.JS
 * Shared boot logic every page runs: seed demo data, enforce the auth
 * guard for that page's role, render the sidebar/topbar nav, theme +
 * sidebar-collapse state, and small reusable UI helpers (counters,
 * toasts, the reading-character/learning-journey widget).
 */

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("aelp_current_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem("aelp_current_user", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("aelp_current_user");
}

function logout() {
  clearCurrentUser();
  window.location.href = "index.html";
}

/** Call at the top of any protected page. Redirects to login if not authorized. */
function requireRole(role) {
  const user = getCurrentUser();
  if (!user || user.role !== role) {
    window.location.href = "index.html";
    return null;
  }
  return user;
}

/** Like requireRole, but accepts either role — used by pages shared across both (e.g. Settings). */
function requireAnyRole() {
  const user = getCurrentUser();
  if (!user || (user.role !== "student" && user.role !== "teacher")) {
    window.location.href = "index.html";
    return null;
  }
  return user;
}
function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function riskBadgeClass(level) {
  if (level === "High") return "badge badge-danger";
  if (level === "Medium") return "badge badge-warning";
  return "badge badge-success";
}

function statusBadgeClass(status) {
  if (status === "weak") return "badge badge-danger";
  if (status === "needs_improvement") return "badge badge-warning";
  if (status === "strong") return "badge badge-success";
  return "badge badge-neutral";
}

function statusLabel(status) {
  if (status === "weak") return "Weak";
  if (status === "needs_improvement") return "Needs Improvement";
  if (status === "strong") return "Strong";
  return "Not enough data";
}

/* ==========================================================================
   Theme (light / dark)
   ========================================================================== */
function getTheme() {
  return localStorage.getItem("aelp_theme") || "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  document.querySelectorAll(".theme-toggle i").forEach(i => {
    i.setAttribute("data-lucide", theme === "dark" ? "sun" : "moon");
  });
  if (window.lucide) window.lucide.createIcons();
  document.querySelectorAll(".theme-toggle-checkbox").forEach(cb => { cb.checked = theme === "dark"; });
}

function setTheme(theme) {
  localStorage.setItem("aelp_theme", theme);
  applyTheme(theme);
}

function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

/* ==========================================================================
   Reduced motion
   ========================================================================== */
function applyMotionPreference() {
  const stored = localStorage.getItem("aelp_reduced_motion");
  const systemPrefers = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reduced = stored === "true" || (stored === null && systemPrefers);
  document.documentElement.classList.toggle("reduced-motion", reduced);
  return reduced;
}

function setReducedMotion(on) {
  localStorage.setItem("aelp_reduced_motion", on ? "true" : "false");
  applyMotionPreference();
}

/* ==========================================================================
   Sidebar collapse (desktop)
   ========================================================================== */
function getSidebarCollapsed() {
  return localStorage.getItem("aelp_sidebar_collapsed") === "true";
}

function setSidebarCollapsed(collapsed) {
  localStorage.setItem("aelp_sidebar_collapsed", collapsed ? "true" : "false");
  const shell = document.querySelector(".app-shell");
  if (shell) shell.classList.toggle("sidebar-collapsed", collapsed);
}

function toggleSidebarCollapsed() {
  setSidebarCollapsed(!getSidebarCollapsed());
}

/* ==========================================================================
   Animated number counter — used for KPI cards / result score
   ========================================================================== */
function animateCount(el, target, opts) {
  opts = opts || {};
  const duration = opts.duration || 700;
  const suffix = opts.suffix || "";
  const decimals = opts.decimals || 0;
  const signed = !!opts.signed;
  const fmt = (v) => (signed && v > 0 ? "+" : "") + v.toFixed(decimals) + suffix;
  if (!el) return;
  const reduced = document.documentElement.classList.contains("reduced-motion");
  if (reduced || target === null || isNaN(target)) {
    el.textContent = (target === null || isNaN(target)) ? "—" : fmt(target);
    return;
  }
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
    const value = target * eased;
    el.textContent = fmt(value);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(target);
  }
  requestAnimationFrame(tick);
}

/* ==========================================================================
   Toasts (gamified micro-feedback — milestones, streaks, achievements)
   ========================================================================== */
function showToast(emoji, text, sub) {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML =
    '<div class="toast-emoji">' + emoji + '</div>' +
    '<div><div class="toast-text">' + text + '</div>' +
    (sub ? '<div class="toast-sub">' + sub + '</div>' : "") + '</div>';
  stack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("leaving");
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

/* ==========================================================================
   Reading character + Learning Journey
   A small character that walks left-to-right along the journey track,
   does a 360 spin at each end, then reverses. Purely decorative —
   positioned inside its own track so it never overlaps content.
   ========================================================================== */
function renderReadingCharacter(containerEl) {
  if (!containerEl) return;
  const char = document.createElement("div");
  char.className = "reading-character";
  char.innerHTML =
    '<svg class="char-flip" viewBox="0 0 48 48" width="46" height="46">' +
    '<circle cx="24" cy="14" r="7" fill="#F0A24E"/>' +
    '<rect x="14" y="22" width="20" height="18" rx="6" fill="#2B3A67"/>' +
    '<rect x="10" y="27" width="10" height="7" rx="3" fill="#E8871E"/>' +
    '<rect x="17" y="30" width="14" height="10" rx="1.5" fill="#fff" opacity="0.92"/>' +
    '<rect x="19" y="33" width="10" height="1.6" fill="#C9CCDC"/>' +
    '<rect x="19" y="36" width="7" height="1.6" fill="#C9CCDC"/>' +
    '</svg>';
  containerEl.appendChild(char);

  if (document.documentElement.classList.contains("reduced-motion")) return;

  function trackWidth() { return Math.max(40, containerEl.clientWidth - 46); }
  let goingRight = true;

  function step() {
    const dist = trackWidth();
    char.style.transition = "left " + Math.max(2.2, dist / 70) + "s linear";
    char.style.left = (goingRight ? dist : 0) + "px";
    char.classList.toggle("facing-left", !goingRight);
  }

  char.style.left = "0px";
  requestAnimationFrame(() => requestAnimationFrame(step));

  char.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "left") return;
    char.classList.add("spinning");
    setTimeout(() => {
      char.classList.remove("spinning");
      goingRight = !goingRight;
      step();
    }, 650);
  });
}

/** Renders the "Your Learning Journey" node path (used on the student dashboard). */
function renderLearningJourney(containerEl, nodes) {
  if (!containerEl) return;
  const doneCount = nodes.filter(n => n.status === "done").length;
  const currentIdx = nodes.findIndex(n => n.status === "current");
  const fillPct = nodes.length > 1 ? (Math.max(0, currentIdx === -1 ? doneCount - 1 : currentIdx) / (nodes.length - 1)) * 100 : 0;

  containerEl.innerHTML =
    '<div class="journey-track-wrap"><div class="journey-track">' +
    '<div class="journey-track-fill" style="width:' + fillPct + '%"></div>' +
    nodes.map(n =>
      '<div class="journey-node ' + n.status + '">' +
      '<div class="journey-dot">' + (n.status === "done" ? '<i data-lucide="check"></i>' : n.status === "current" ? '<i data-lucide="target"></i>' : '<i data-lucide="circle"></i>') + '</div>' +
      '<div class="journey-label">' + n.label + '</div></div>'
    ).join("") +
    '</div></div>';
  if (window.lucide) window.lucide.createIcons();
  renderReadingCharacter(containerEl.querySelector(".journey-track-wrap"));
}

/* ==========================================================================
   Sidebar / topbar
   ========================================================================== */
const STUDENT_NAV = [
  { section: "Learn" },
  { href: "student-dashboard.html", icon: "layout-dashboard", label: "Dashboard" },
  { href: "subjects.html", icon: "book-open", label: "My Subjects" },
  { href: "quizzes.html", icon: "pencil-line", label: "Quizzes" },
  { href: "learning-path.html", icon: "route", label: "Learning Path" },
  { section: "Insights" },
  { href: "progress.html", icon: "line-chart", label: "Progress" },
  { href: "ai-insights.html", icon: "sparkles", label: "AI Insights" },
  { href: "achievements.html", icon: "trophy", label: "Achievements" },
  { section: "Account" },
  { href: "settings.html", icon: "settings", label: "Settings" },
];

const TEACHER_NAV = [
  { section: "Overview" },
  { href: "teacher-dashboard.html", icon: "layout-dashboard", label: "Dashboard" },
  { href: "teacher-dashboard.html#rosterSection", icon: "users", label: "Students" },
  { href: "analytics.html", icon: "bar-chart-3", label: "Analytics" },
  { href: "early-intervention.html", icon: "alert-triangle", label: "Early Intervention" },
  { section: "Content" },
  { href: "teacher-subjects.html", icon: "book-open", label: "Subjects" },
  { href: "question-bank.html", icon: "library", label: "Question Bank" },
  { section: "Account" },
  { href: "settings.html", icon: "settings", label: "Settings" },
];

/** Renders the left sidebar nav. Highlights the current page automatically. */
function renderSidebar(role, activePage) {
  const mount = document.getElementById("sidebar");
  if (!mount) return;
  const user = getCurrentUser();
  const name = user ? user.name : "";
  const roleLabel = role === "teacher" ? "Teacher" : "Student";
  const navItems = role === "teacher" ? TEACHER_NAV : STUDENT_NAV;

  mount.innerHTML =
    '<div class="sidebar-toggle-row">' +
      '<div class="sidebar-brand">' +
        '<div class="brand-mark" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 8L12 4L21 8L12 12L3 8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 10.5V16C7 16 9 18 12 18C15 18 17 16 17 16V10.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 8V13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></div>' +
        '<div class="sidebar-brand-text"><div class="brand-name">EduNexus</div><div class="brand-sub">AI Learning Platform</div></div>' +
      '</div>' +
      '<button class="sidebar-toggle-btn" id="sidebarToggleBtn" aria-label="Toggle sidebar"><i data-lucide="menu"></i></button>' +
    '</div>' +
    '<nav class="sidebar-nav">' +
      navItems.map(l => l.section
        ? '<div class="sidebar-section-label">' + l.section + '</div>'
        : '<a href="' + l.href + '" class="sidebar-link ' + (activePage === l.href ? "active" : "") + '">' +
            '<i data-lucide="' + l.icon + '"></i><span>' + l.label + '</span>' +
            '<span class="sidebar-tooltip">' + l.label + '</span></a>'
      ).join("") +
    '</nav>' +
    '<div class="sidebar-footer">' +
      '<div class="sidebar-user">' +
        '<div class="avatar">' + (user ? initials(name) : "") + '</div>' +
        '<div class="sidebar-user-text"><div class="sidebar-user-name">' + name + '</div><div class="sidebar-user-role">' + roleLabel + '</div></div>' +
      '</div>' +
      '<button class="btn btn-ghost btn-block" id="logoutBtn"><i data-lucide="log-out"></i><span>Log Out</span></button>' +
    '</div>';

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  const toggleBtn = document.getElementById("sidebarToggleBtn");
  if (toggleBtn) toggleBtn.addEventListener("click", toggleSidebarCollapsed);
  const shell = document.querySelector(".app-shell");
  if (shell) shell.classList.toggle("sidebar-collapsed", getSidebarCollapsed());
  if (window.lucide) window.lucide.createIcons();
}

function initIcons() {
  if (window.lucide) window.lucide.createIcons();
}

/** Renders the small hamburger topbar shown only on mobile widths, and wires it to open the sidebar drawer. */
function renderMobileTopbar(title) {
  const mount = document.getElementById("mobileTopbar");
  if (!mount) return;
  mount.innerHTML =
    '<div class="row" style="gap:10px;">' +
      '<button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu"><i data-lucide="menu"></i></button>' +
      '<div class="brand-name" style="color:var(--text-primary); font-size:15px;">' + (title || "EduNexus") + '</div>' +
    '</div>' +
    '<button class="theme-toggle" id="mobileThemeToggle" aria-label="Toggle theme"><i data-lucide="moon"></i></button>';

  const sidebar = document.querySelector(".sidebar");
  let scrim = document.querySelector(".sidebar-scrim");
  if (!scrim) {
    scrim = document.createElement("div");
    scrim.className = "sidebar-scrim";
    document.body.appendChild(scrim);
  }
  const open = () => { sidebar.classList.add("open"); scrim.classList.add("open"); };
  const close = () => { sidebar.classList.remove("open"); scrim.classList.remove("open"); };
  document.getElementById("mobileMenuBtn").addEventListener("click", open);
  scrim.addEventListener("click", close);
  document.getElementById("mobileThemeToggle").addEventListener("click", toggleTheme);
  applyTheme(getTheme());
  if (window.lucide) window.lucide.createIcons();
}

/** Syncs Chart.js's default tick/grid colors with the current light/dark theme. Call before creating any chart. */
function applyChartTheme() {
  if (!window.Chart) return;
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  Chart.defaults.color = dark ? "#ABAFC2" : "#5B6072";
  Chart.defaults.borderColor = dark ? "#2C3040" : "#E1E3EE";
  Chart.defaults.font.family = "'Inter', 'Segoe UI', system-ui, sans-serif";
}

document.addEventListener("DOMContentLoaded", () => {
  applyMotionPreference();
  applyTheme(getTheme());
  if (window.seedIfNeeded) seedIfNeeded();
  injectGlobalThemeToggle();
  initIcons();
});

/** A small fixed top-right toggle, always reachable regardless of page-specific topbar markup. Hidden on mobile (the mobile topbar has its own). */
function injectGlobalThemeToggle() {
  if (document.querySelector(".global-theme-toggle") || !document.getElementById("sidebar")) return;
  const btn = document.createElement("button");
  btn.className = "theme-toggle global-theme-toggle";
  btn.setAttribute("aria-label", "Toggle light/dark theme");
  btn.innerHTML = '<i data-lucide="moon"></i>';
  btn.addEventListener("click", toggleTheme);
  document.body.appendChild(btn);
  applyTheme(getTheme());
  if (window.lucide) window.lucide.createIcons();
}

window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.clearCurrentUser = clearCurrentUser;
window.logout = logout;
window.requireRole = requireRole;
window.requireAnyRole = requireAnyRole;
window.formatDate = formatDate;
window.riskBadgeClass = riskBadgeClass;
window.statusBadgeClass = statusBadgeClass;
window.statusLabel = statusLabel;
window.getTheme = getTheme;
window.setTheme = setTheme;
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.applyMotionPreference = applyMotionPreference;
window.setReducedMotion = setReducedMotion;
window.getSidebarCollapsed = getSidebarCollapsed;
window.setSidebarCollapsed = setSidebarCollapsed;
window.toggleSidebarCollapsed = toggleSidebarCollapsed;
window.animateCount = animateCount;
window.applyChartTheme = applyChartTheme;
window.showToast = showToast;
window.renderReadingCharacter = renderReadingCharacter;
window.renderLearningJourney = renderLearningJourney;
window.renderSidebar = renderSidebar;
window.renderMobileTopbar = renderMobileTopbar;
window.initIcons = initIcons;
