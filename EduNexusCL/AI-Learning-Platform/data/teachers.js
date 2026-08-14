/**
 * TEACHERS
 * A teacher is scoped to the full student roster for this prototype
 * (a single "class"). Easy to extend to per-class rosters later.
 */
const TEACHERS = [
  { id:"tch_001", name:"Dr. Anjali Mishra", email:"teacher@test.com", password:"teacher123", subject:"Class Coordinator" },
];

function getCustomTeachers() {
  try {
    const raw = localStorage.getItem("aelp_custom_teachers");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function getAllTeachers() {
  return TEACHERS.concat(getCustomTeachers());
}

function getTeacherByEmail(email) {
  return getAllTeachers().find(t => t.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function isTeacherIdTaken(id) {
  return getAllTeachers().some(t => t.id.toUpperCase() === String(id).toUpperCase());
}

/** Login can use either the registered email or the generated Teacher ID. */
function findTeacherForLogin(identifier) {
  const val = String(identifier || "").trim();
  if (!val) return null;
  if (val.includes("@")) return getTeacherByEmail(val);
  return getAllTeachers().find(t => t.id.toLowerCase() === val.toLowerCase()) || null;
}

/** First 4 letters of school name + last 4 digits of mobile number. Only the last 4 digits are ever stored/shown, per the prototype's privacy note. */
function generateTeacherId(schoolName, mobile) {
  const code = schoolCode(schoolName);
  const digits = String(mobile || "").replace(/\D/g, "");
  const last4 = digits.slice(-4).padStart(4, "0");
  return code + last4;
}

function registerTeacher({ schoolName, name, mobile, password }) {
  const id = generateTeacherId(schoolName, mobile);
  if (isTeacherIdTaken(id)) {
    return { ok: false, error: "duplicate", id };
  }
  const last4 = String(mobile || "").replace(/\D/g, "").slice(-4);
  const record = {
    id,
    name,
    email: id.toLowerCase() + "@edunexus.local",
    password,
    subject: "Class Coordinator",
    schoolName,
    mobileLast4: last4, // only the last 4 digits are ever retained
  };
  const custom = getCustomTeachers();
  custom.push(record);
  localStorage.setItem("aelp_custom_teachers", JSON.stringify(custom));
  return { ok: true, id, record };
}

window.TEACHERS = TEACHERS;
window.getTeacherByEmail = getTeacherByEmail;
window.getCustomTeachers = getCustomTeachers;
window.getAllTeachers = getAllTeachers;
window.isTeacherIdTaken = isTeacherIdTaken;
window.findTeacherForLogin = findTeacherForLogin;
window.generateTeacherId = generateTeacherId;
window.registerTeacher = registerTeacher;
