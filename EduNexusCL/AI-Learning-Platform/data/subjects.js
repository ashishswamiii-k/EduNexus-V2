/**
 * SUBJECTS
 * Students are enrolled in a subset of these (see students.js).
 * The student dashboard/subjects page must only ever show subjects
 * the logged-in student is enrolled in.
 */
const SUBJECTS = [
  { id: "sub_math", name: "Mathematics",          icon: "sigma",       color: "#2B3A67" },
  { id: "sub_prog", name: "Programming",          icon: "code-2",      color: "#1B998B" },
  { id: "sub_dbms", name: "DBMS",                 icon: "database",    color: "#6C4AB6" },
  { id: "sub_phy",  name: "Physics",               icon: "atom",        color: "#E8871E" },
  { id: "sub_de",   name: "Digital Electronics",  icon: "cpu",         color: "#0F7C82" },
];

function getSubjectById(subjectId) {
  return SUBJECTS.find(s => s.id === subjectId) || null;
}

window.SUBJECTS = SUBJECTS;
window.getSubjectById = getSubjectById;
