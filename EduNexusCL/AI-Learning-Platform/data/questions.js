/**
 * QUESTION BANK
 * Every question is tagged with subject + topic + difficulty so the
 * quiz engine and AI engine can compute topic-wise and difficulty-wise
 * analytics. difficulty: "easy" | "medium" | "hard"
 */
const QUESTIONS = [
  // ---------------- Algebra ----------------
  { id:"q001", subject:"sub_math", topic:"t_algebra", difficulty:"easy",
    question:"Simplify: 3x + 5x", options:["8x","15x","8x^2","3x+5"], correct:0,
    explanation:"Like terms add directly: 3x + 5x = 8x." },
  { id:"q002", subject:"sub_math", topic:"t_algebra", difficulty:"easy",
    question:"If x = 4, what is 2x + 3?", options:["7","11","14","10"], correct:1,
    explanation:"2(4) + 3 = 8 + 3 = 11." },
  { id:"q003", subject:"sub_math", topic:"t_algebra", difficulty:"medium",
    question:"Simplify: 2(x + 3) - 4", options:["2x+2","2x+10","2x-2","2x+6"], correct:0,
    explanation:"2x + 6 - 4 = 2x + 2." },
  { id:"q004", subject:"sub_math", topic:"t_algebra", difficulty:"medium",
    question:"Solve for x: 5x - 2 = 3x + 8", options:["3","5","4","10"], correct:1,
    explanation:"5x-3x = 8+2 → 2x=10 → x=5." },
  { id:"q005", subject:"sub_math", topic:"t_algebra", difficulty:"hard",
    question:"Simplify: (2x^2y)(3xy^2)", options:["6x^3y^3","5x^3y^3","6x^2y^2","6x^3y^2"], correct:0,
    explanation:"Multiply coefficients and add exponents: 2·3=6, x^(2+1)=x^3, y^(1+2)=y^3." },

  // ---------------- Linear Equations ----------------
  { id:"q006", subject:"sub_math", topic:"t_linear_eq", difficulty:"easy",
    question:"Solve: x + 7 = 12", options:["5","19","7","-5"], correct:0,
    explanation:"x = 12 - 7 = 5." },
  { id:"q007", subject:"sub_math", topic:"t_linear_eq", difficulty:"medium",
    question:"Solve: 2x + 3 = 11", options:["3","4","5","7"], correct:1,
    explanation:"2x = 8 → x = 4." },
  { id:"q008", subject:"sub_math", topic:"t_linear_eq", difficulty:"medium",
    question:"Which point lies on the line y = 2x + 1?", options:["(1,2)","(2,5)","(0,0)","(3,5)"], correct:1,
    explanation:"y = 2(2)+1 = 5, so (2,5) satisfies the equation." },
  { id:"q009", subject:"sub_math", topic:"t_linear_eq", difficulty:"hard",
    question:"Solve the system: x+y=10, x-y=2", options:["x=6,y=4","x=4,y=6","x=5,y=5","x=8,y=2"], correct:0,
    explanation:"Adding both equations: 2x=12 → x=6, then y=10-6=4." },

  // ---------------- Factorization ----------------
  { id:"q010", subject:"sub_math", topic:"t_factorization", difficulty:"easy",
    question:"Factorize: x^2 + 5x", options:["x(x+5)","x^2(x+5)","5(x+x)","x(5x)"], correct:0,
    explanation:"Take common factor x: x(x+5)." },
  { id:"q011", subject:"sub_math", topic:"t_factorization", difficulty:"medium",
    question:"Factorize: x^2 - 9", options:["(x-3)(x+3)","(x-9)(x+1)","(x-3)^2","(x+9)(x-1)"], correct:0,
    explanation:"Difference of squares: a^2-b^2=(a-b)(a+b)." },
  { id:"q012", subject:"sub_math", topic:"t_factorization", difficulty:"medium",
    question:"Factorize: x^2 + 7x + 12", options:["(x+3)(x+4)","(x+2)(x+6)","(x+1)(x+12)","(x+5)(x+2)"], correct:0,
    explanation:"3×4=12 and 3+4=7, so (x+3)(x+4)." },
  { id:"q013", subject:"sub_math", topic:"t_factorization", difficulty:"hard",
    question:"Factorize: 2x^2 - 5x - 3", options:["(2x+1)(x-3)","(2x-1)(x+3)","(x+1)(2x-3)","(2x-3)(x-1)"], correct:0,
    explanation:"Split the middle term: 2x^2-6x+x-3 = 2x(x-3)+1(x-3) = (2x+1)(x-3)." },
  { id:"q014", subject:"sub_math", topic:"t_factorization", difficulty:"hard",
    question:"Factorize: x^3 - 8", options:["(x-2)(x^2+2x+4)","(x-2)^3","(x+2)(x^2-2x+4)","(x-2)(x^2-2x+4)"], correct:0,
    explanation:"Difference of cubes: a^3-b^3=(a-b)(a^2+ab+b^2), here a=x, b=2." },

  // ---------------- Quadratic Equations ----------------
  { id:"q015", subject:"sub_math", topic:"t_quadratic", difficulty:"easy",
    question:"What is the standard form of a quadratic equation?", options:["ax^2+bx+c=0","ax+b=0","ax^3+bx=0","a/x+b=0"], correct:0,
    explanation:"A quadratic equation has the form ax^2+bx+c=0, where a≠0." },
  { id:"q016", subject:"sub_math", topic:"t_quadratic", difficulty:"medium",
    question:"Solve: x^2 - 5x + 6 = 0", options:["x=2,3","x=1,6","x=-2,-3","x=2,-3"], correct:0,
    explanation:"Factorize as (x-2)(x-3)=0 → x=2 or x=3." },
  { id:"q017", subject:"sub_math", topic:"t_quadratic", difficulty:"medium",
    question:"What is the discriminant of x^2+4x+4=0?", options:["0","16","4","-4"], correct:0,
    explanation:"D=b^2-4ac = 16-16 = 0 (equal roots)." },
  { id:"q018", subject:"sub_math", topic:"t_quadratic", difficulty:"hard",
    question:"Solve using the quadratic formula: x^2 - 4x - 5 = 0", options:["x=5,-1","x=4,-1","x=5,1","x=-5,1"], correct:0,
    explanation:"x=(4±√(16+20))/2=(4±6)/2 → x=5 or x=-1." },
  { id:"q019", subject:"sub_math", topic:"t_quadratic", difficulty:"hard",
    question:"For which value of k does x^2+kx+9=0 have equal roots?", options:["±6","±3","±9","±18"], correct:0,
    explanation:"Equal roots require D=0: k^2-36=0 → k=±6." },

  // ---------------- Variables (Programming) ----------------
  { id:"q020", subject:"sub_prog", topic:"t_variables", difficulty:"easy",
    question:"Which keyword declares a variable in JavaScript?", options:["let","print","func","class"], correct:0,
    explanation:"`let` (and `var`, `const`) declare variables in JavaScript." },
  { id:"q021", subject:"sub_prog", topic:"t_variables", difficulty:"easy",
    question:"What is the value of x after: let x = 5; x = x + 1;", options:["6","5","1","undefined"], correct:0,
    explanation:"x is reassigned to 5+1=6." },
  { id:"q022", subject:"sub_prog", topic:"t_variables", difficulty:"medium",
    question:"Which of these is a valid variable name?", options:["_score1","1score","score-1","score 1"], correct:0,
    explanation:"Identifiers can start with a letter or underscore, not a digit or contain spaces/hyphens." },

  // ---------------- Conditions ----------------
  { id:"q023", subject:"sub_prog", topic:"t_conditions", difficulty:"easy",
    question:"Which statement checks a condition?", options:["if","for","while","function"], correct:0,
    explanation:"`if` evaluates a condition and branches execution." },
  { id:"q024", subject:"sub_prog", topic:"t_conditions", difficulty:"medium",
    question:"What does `else if` allow you to do?", options:["Check another condition if the first is false","Repeat a block","Declare a variable","Exit a loop"], correct:0,
    explanation:"`else if` chains additional condition checks." },
  { id:"q025", subject:"sub_prog", topic:"t_conditions", difficulty:"hard",
    question:"What is the output of: if (0) { console.log('A') } else { console.log('B') }", options:["B","A","Error","Nothing"], correct:0,
    explanation:"0 is falsy in JavaScript, so the else branch ('B') runs." },

  // ---------------- Loops ----------------
  { id:"q026", subject:"sub_prog", topic:"t_loops", difficulty:"easy",
    question:"Which loop runs a fixed number of times most naturally?", options:["for","if","switch","try"], correct:0,
    explanation:"A `for` loop is designed for counted iteration." },
  { id:"q027", subject:"sub_prog", topic:"t_loops", difficulty:"medium",
    question:"How many times does this loop run? for(let i=0;i<5;i++)", options:["5","4","6","Infinite"], correct:0,
    explanation:"i goes 0,1,2,3,4 — 5 iterations." },
  { id:"q028", subject:"sub_prog", topic:"t_loops", difficulty:"hard",
    question:"What does `break` do inside a loop?", options:["Exits the loop immediately","Skips to the next iteration","Restarts the loop","Pauses execution"], correct:0,
    explanation:"`break` terminates the nearest enclosing loop immediately." },

  // ---------------- Arrays ----------------
  { id:"q029", subject:"sub_prog", topic:"t_arrays", difficulty:"easy",
    question:"What is the index of the first element in an array?", options:["0","1","-1","undefined"], correct:0,
    explanation:"Arrays are zero-indexed in most languages including JS." },
  { id:"q030", subject:"sub_prog", topic:"t_arrays", difficulty:"medium",
    question:"What does arr.push(6) do?", options:["Adds 6 to the end of arr","Removes 6 from arr","Sorts arr","Finds index of 6"], correct:0,
    explanation:"push() appends an element to the end of the array." },
  { id:"q031", subject:"sub_prog", topic:"t_arrays", difficulty:"hard",
    question:"What is the output? [1,2,3].map(x => x*2)", options:["[2,4,6]","[1,2,3]","[1,4,9]","undefined"], correct:0,
    explanation:"map() applies the function to each element, doubling each value." },

  // ---------------- Functions ----------------
  { id:"q032", subject:"sub_prog", topic:"t_functions", difficulty:"easy",
    question:"Which keyword defines a function in JavaScript?", options:["function","def","func","method"], correct:0,
    explanation:"`function` is the standard keyword to declare a function in JS." },
  { id:"q033", subject:"sub_prog", topic:"t_functions", difficulty:"medium",
    question:"What does a `return` statement do?", options:["Sends a value back to the caller","Prints to console","Declares a variable","Ends the program"], correct:0,
    explanation:"`return` passes a value back out of the function and ends its execution." },
  { id:"q034", subject:"sub_prog", topic:"t_functions", difficulty:"hard",
    question:"What is a closure?", options:["A function that remembers variables from its outer scope","A loop that never ends","A type of array","A syntax error"], correct:0,
    explanation:"A closure is a function bundled with references to its surrounding lexical scope." },

  // ---------------- SQL ----------------
  { id:"q035", subject:"sub_dbms", topic:"t_sql", difficulty:"easy",
    question:"Which SQL keyword retrieves data from a table?", options:["SELECT","GET","FETCH","SHOW"], correct:0,
    explanation:"SELECT is used to query rows from a table." },
  { id:"q036", subject:"sub_dbms", topic:"t_sql", difficulty:"medium",
    question:"Which clause filters rows before grouping?", options:["WHERE","HAVING","GROUP BY","ORDER BY"], correct:0,
    explanation:"WHERE filters individual rows before any GROUP BY aggregation." },
  { id:"q037", subject:"sub_dbms", topic:"t_sql", difficulty:"hard",
    question:"Which JOIN returns rows only when there is a match in both tables?", options:["INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL JOIN"], correct:0,
    explanation:"INNER JOIN returns only matching rows from both tables." },

  // ---------------- Normalization ----------------
  { id:"q038", subject:"sub_dbms", topic:"t_normalization", difficulty:"easy",
    question:"What is the main goal of normalization?", options:["Reduce data redundancy","Increase table count","Speed up hardware","Encrypt data"], correct:0,
    explanation:"Normalization organizes data to minimize redundancy and dependency issues." },
  { id:"q039", subject:"sub_dbms", topic:"t_normalization", difficulty:"medium",
    question:"1NF requires that each column contains:", options:["Atomic (indivisible) values","Only numbers","Unique table names","Foreign keys"], correct:0,
    explanation:"First Normal Form requires atomic, single-valued columns." },
  { id:"q040", subject:"sub_dbms", topic:"t_normalization", difficulty:"hard",
    question:"A table in 2NF but not 3NF has:", options:["Transitive dependency on the primary key","Repeating groups","No primary key","Multi-valued attributes"], correct:0,
    explanation:"3NF removes transitive dependencies that remain after 2NF." },

  // ---------------- ER Diagrams ----------------
  { id:"q041", subject:"sub_dbms", topic:"t_er_diagrams", difficulty:"easy",
    question:"In an ER diagram, a rectangle typically represents:", options:["An entity","A relationship","An attribute","A key"], correct:0,
    explanation:"Rectangles represent entities (objects) in ER modeling." },
  { id:"q042", subject:"sub_dbms", topic:"t_er_diagrams", difficulty:"medium",
    question:"A diamond shape in an ER diagram represents:", options:["A relationship","An entity","An attribute","A primary key"], correct:0,
    explanation:"Diamonds denote relationships between entities." },

  // ---------------- Kinematics ----------------
  { id:"q043", subject:"sub_phy", topic:"t_kinematics", difficulty:"easy",
    question:"What is the SI unit of velocity?", options:["m/s","m/s^2","kg·m/s","N"], correct:0,
    explanation:"Velocity is displacement over time: metres per second." },
  { id:"q044", subject:"sub_phy", topic:"t_kinematics", difficulty:"medium",
    question:"A car accelerates from 0 to 20 m/s in 5s. What is its acceleration?", options:["4 m/s^2","5 m/s^2","20 m/s^2","100 m/s^2"], correct:0,
    explanation:"a = Δv/Δt = 20/5 = 4 m/s^2." },
  { id:"q045", subject:"sub_phy", topic:"t_kinematics", difficulty:"hard",
    question:"Using v^2=u^2+2as, find v if u=0, a=2 m/s^2, s=25m", options:["10 m/s","5 m/s","50 m/s","100 m/s"], correct:0,
    explanation:"v^2 = 0 + 2(2)(25) = 100 → v = 10 m/s." },

  // ---------------- Newton's Laws ----------------
  { id:"q046", subject:"sub_phy", topic:"t_newtons_laws", difficulty:"easy",
    question:"Newton's First Law is also called the law of:", options:["Inertia","Gravity","Momentum","Energy"], correct:0,
    explanation:"An object at rest/motion stays that way unless acted on by a force — inertia." },
  { id:"q047", subject:"sub_phy", topic:"t_newtons_laws", difficulty:"medium",
    question:"F = ma. If m=2kg and a=3m/s^2, what is F?", options:["6N","5N","1.5N","9N"], correct:0,
    explanation:"F = 2×3 = 6 Newtons." },

  // ---------------- Number Systems ----------------
  { id:"q048", subject:"sub_de", topic:"t_number_sys", difficulty:"easy",
    question:"What is (10)_2 in decimal?", options:["2","10","1","4"], correct:0,
    explanation:"Binary 10 = 1×2^1 + 0×2^0 = 2." },
  { id:"q049", subject:"sub_de", topic:"t_number_sys", difficulty:"medium",
    question:"Convert decimal 13 to binary.", options:["1101","1011","1110","1001"], correct:0,
    explanation:"13 = 8+4+1 = 1101 in binary." },

  // ---------------- Work & Energy ----------------
  { id:"q052", subject:"sub_phy", topic:"t_energy", difficulty:"easy",
    question:"What is the SI unit of energy?", options:["Joule","Newton","Watt","Pascal"], correct:0,
    explanation:"Energy is measured in Joules (J)." },
  { id:"q053", subject:"sub_phy", topic:"t_energy", difficulty:"medium",
    question:"A 2kg object moving at 3m/s has kinetic energy of:", options:["9 J","6 J","18 J","3 J"], correct:0,
    explanation:"KE = 1/2 mv^2 = 0.5×2×9 = 9 J." },
  { id:"q054", subject:"sub_phy", topic:"t_energy", difficulty:"hard",
    question:"A 5kg mass is lifted 2m against gravity (g=10m/s^2). What is the work done?", options:["100 J","50 J","20 J","10 J"], correct:0,
    explanation:"W = mgh = 5×10×2 = 100 J." },

  // ---------------- Logic Gates ----------------
  { id:"q050", subject:"sub_de", topic:"t_logic_gates", difficulty:"easy",
    question:"Which gate outputs 1 only when both inputs are 1?", options:["AND","OR","NOT","XOR"], correct:0,
    explanation:"AND gate output is 1 only if all inputs are 1." },
  { id:"q051", subject:"sub_de", topic:"t_logic_gates", difficulty:"medium",
    question:"A NOT gate is also known as a(n):", options:["Inverter","Buffer","Comparator","Adder"], correct:0,
    explanation:"NOT gate inverts the input signal, hence 'inverter'." },

  // ---------------- Boolean Algebra ----------------
  { id:"q055", subject:"sub_de", topic:"t_boolean_alg", difficulty:"easy",
    question:"What is A + 0 equal to in Boolean algebra?", options:["A","0","1","A'"], correct:0,
    explanation:"The identity law: A OR 0 always equals A." },
  { id:"q056", subject:"sub_de", topic:"t_boolean_alg", difficulty:"medium",
    question:"Simplify: A + A·B", options:["A","B","A·B","A+B"], correct:0,
    explanation:"Absorption law: A + A·B = A." },
  { id:"q057", subject:"sub_de", topic:"t_boolean_alg", difficulty:"hard",
    question:"What does De Morgan's theorem state for (A·B)'?", options:["A' + B'","A' · B'","A + B","AB"], correct:0,
    explanation:"De Morgan's: (A·B)' = A' + B'." },
];

function getQuestionsByTopic(topicId) {
  return QUESTIONS.filter(q => q.topic === topicId);
}

function getQuestionsBySubject(subjectId) {
  return QUESTIONS.filter(q => q.subject === subjectId);
}

window.QUESTIONS = QUESTIONS;
window.getQuestionsByTopic = getQuestionsByTopic;
window.getQuestionsBySubject = getQuestionsBySubject;
