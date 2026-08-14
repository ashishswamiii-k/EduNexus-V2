/**
 * TOPICS
 * Each topic belongs to one subject and may declare a `prerequisite`
 * (the topicId that should be mastered before this one). This chain
 * is what powers the prerequisite-gap-detection feature in ai-engine.js.
 */
const TOPICS = [
  // ---------------- Mathematics ----------------
  { id: "t_algebra",     subjectId: "sub_math", name: "Algebra",              prerequisite: null },
  { id: "t_linear_eq",   subjectId: "sub_math", name: "Linear Equations",     prerequisite: "t_algebra" },
  { id: "t_factorization",subjectId: "sub_math", name: "Factorization",       prerequisite: "t_algebra" },
  { id: "t_quadratic",   subjectId: "sub_math", name: "Quadratic Equations",  prerequisite: "t_factorization" },

  // ---------------- Programming ----------------
  { id: "t_variables",   subjectId: "sub_prog", name: "Variables",            prerequisite: null },
  { id: "t_conditions",  subjectId: "sub_prog", name: "Conditions",           prerequisite: "t_variables" },
  { id: "t_loops",       subjectId: "sub_prog", name: "Loops",                prerequisite: "t_conditions" },
  { id: "t_arrays",      subjectId: "sub_prog", name: "Arrays",               prerequisite: "t_loops" },
  { id: "t_functions",   subjectId: "sub_prog", name: "Functions",            prerequisite: "t_arrays" },

  // ---------------- DBMS ----------------
  { id: "t_sql",         subjectId: "sub_dbms", name: "SQL",                  prerequisite: null },
  { id: "t_normalization",subjectId: "sub_dbms", name: "Normalization",       prerequisite: "t_sql" },
  { id: "t_er_diagrams", subjectId: "sub_dbms", name: "ER Diagrams",          prerequisite: "t_sql" },

  // ---------------- Physics ----------------
  { id: "t_kinematics",  subjectId: "sub_phy",  name: "Kinematics",           prerequisite: null },
  { id: "t_newtons_laws",subjectId: "sub_phy",  name: "Newton's Laws",        prerequisite: "t_kinematics" },
  { id: "t_energy",      subjectId: "sub_phy",  name: "Work & Energy",        prerequisite: "t_newtons_laws" },

  // ---------------- Digital Electronics ----------------
  { id: "t_number_sys",  subjectId: "sub_de",   name: "Number Systems",       prerequisite: null },
  { id: "t_logic_gates", subjectId: "sub_de",   name: "Logic Gates",          prerequisite: "t_number_sys" },
  { id: "t_boolean_alg", subjectId: "sub_de",   name: "Boolean Algebra",      prerequisite: "t_logic_gates" },
];

function getTopicById(topicId) {
  return TOPICS.find(t => t.id === topicId) || null;
}

function getTopicsBySubject(subjectId) {
  return TOPICS.filter(t => t.subjectId === subjectId);
}

// Walk backwards to find the immediate prerequisite topic (if any)
function getPrerequisiteTopic(topicId) {
  const topic = getTopicById(topicId);
  if (!topic || !topic.prerequisite) return null;
  return getTopicById(topic.prerequisite);
}

window.TOPICS = TOPICS;
window.getTopicById = getTopicById;
window.getTopicsBySubject = getTopicsBySubject;
window.getPrerequisiteTopic = getPrerequisiteTopic;
