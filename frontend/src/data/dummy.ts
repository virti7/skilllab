// ---- Shared ----
export const classes = [
  { id: 1, title: "Excel Mastery", description: "Advanced spreadsheet techniques & formulas", icon: "📊", color: "card-green", tasks: 4 },
  { id: 2, title: "Tally Prime", description: "Complete accounting & GST management", icon: "📒", color: "card-blue", tasks: 3 },
  { id: 3, title: "Coding Basics", description: "Python programming fundamentals", icon: "💻", color: "card-orange", tasks: 5 },
];

export const todayTests = [
  { id: 1, name: "Excel Formulas Quiz", course: "Excel Mastery", status: "pending" as const, type: "Quiz" },
  { id: 2, name: "GST Returns Practice", course: "Tally Prime", status: "completed" as const, type: "Theory" },
  { id: 3, name: "Python Variables Test", course: "Coding Basics", status: "pending" as const, type: "Task" },
  { id: 4, name: "VLOOKUP Challenge", course: "Excel Mastery", status: "pending" as const, type: "Task" },
  { id: 5, name: "Ledger Basics", course: "Tally Prime", status: "completed" as const, type: "Theory" },
];

export const upcomingTests = [
  { id: 1, name: "Excel Final Exam", date: "19 Jan", duration: "45 Minutes", color: "primary" },
  { id: 2, name: "Tally Assessment", date: "20 - 21 Jan", duration: "3 Hours", color: "info" },
  { id: 3, name: "Coding Challenge", date: "22 Jan", duration: "50 Minutes", color: "success" },
];

export const leaderboard = [
  { rank: 1, name: "Ananya Sharma", score: 985, avatar: "AS" },
  { rank: 2, name: "Rahul Verma", score: 960, avatar: "RV" },
  { rank: 3, name: "Priya Patel", score: 942, avatar: "PP" },
  { rank: 4, name: "Arjun Singh", score: 920, avatar: "AR" },
  { rank: 5, name: "Meera Joshi", score: 905, avatar: "MJ" },
  { rank: 6, name: "Karan Mehta", score: 890, avatar: "KM" },
  { rank: 7, name: "Sneha Gupta", score: 875, avatar: "SG" },
  { rank: 8, name: "Vikram Rao", score: 860, avatar: "VR" },
];

export const testQuestions = [
  { id: 1, question: "What function is used to look up a value in the first column of a table?", options: ["HLOOKUP", "VLOOKUP", "INDEX", "MATCH"], correct: 1 },
  { id: 2, question: "Which shortcut key is used to insert a new worksheet in Excel?", options: ["Ctrl+N", "Shift+F11", "Ctrl+Shift+N", "Alt+F1"], correct: 1 },
  { id: 3, question: "What does the CONCATENATE function do?", options: ["Adds numbers", "Joins text strings", "Finds average", "Counts cells"], correct: 1 },
  { id: 4, question: "Which chart type is best for showing trends over time?", options: ["Pie Chart", "Bar Chart", "Line Chart", "Scatter Plot"], correct: 2 },
  { id: 5, question: "What is the maximum number of rows in an Excel worksheet?", options: ["65,536", "1,048,576", "500,000", "2,000,000"], correct: 1 },
];

export const performanceCards = [
  { title: "Tests Taken", value: "24", change: "+3 this week", icon: "📝" },
  { title: "Average Score", value: "87%", change: "+5% improvement", icon: "📈" },
  { title: "Current Rank", value: "#4", change: "Up 2 places", icon: "🏆" },
  { title: "Completion", value: "92%", change: "8 remaining", icon: "✅" },
];

export const recentTests = [
  { name: "Excel Formulas", score: 92, total: 100, date: "Jan 15" },
  { name: "Tally Basics", score: 85, total: 100, date: "Jan 13" },
  { name: "Python Quiz", score: 78, total: 100, date: "Jan 10" },
  { name: "Data Entry", score: 95, total: 100, date: "Jan 8" },
];

// ---- Super Admin ----
export const superAdminStats = [
  { title: "Total Institutes", value: "48", change: "+5 this month", icon: "🏫" },
  { title: "Total Students", value: "12,450", change: "+320 this week", icon: "👨‍🎓" },
  { title: "Total Revenue", value: "₹18.5L", change: "+12% MoM", icon: "💰" },
  { title: "Active Plans", value: "42", change: "6 expired", icon: "📋" },
];

export const institutes = [
  { id: 1, name: "Tech Academy", city: "Mumbai", students: 450, plan: "Premium", status: "active" as const },
  { id: 2, name: "Digital Skills Hub", city: "Delhi", students: 320, plan: "Standard", status: "active" as const },
  { id: 3, name: "Future Learn Institute", city: "Bangalore", students: 280, plan: "Premium", status: "active" as const },
  { id: 4, name: "Smart Education Center", city: "Pune", students: 190, plan: "Basic", status: "expired" as const },
  { id: 5, name: "Skill Bridge Academy", city: "Hyderabad", students: 410, plan: "Premium", status: "active" as const },
  { id: 6, name: "EduTech Solutions", city: "Chennai", students: 150, plan: "Standard", status: "active" as const },
];

export const allUsers = [
  { id: 1, name: "Priya Sharma", email: "priya@techacademy.in", role: "Admin", institute: "Tech Academy", status: "active" as const },
  { id: 2, name: "Rahul Verma", email: "rahul@dsh.in", role: "Admin", institute: "Digital Skills Hub", status: "active" as const },
  { id: 3, name: "Arjun Singh", email: "arjun@student.in", role: "Student", institute: "Tech Academy", status: "active" as const },
  { id: 4, name: "Meera Joshi", email: "meera@student.in", role: "Student", institute: "Future Learn", status: "active" as const },
  { id: 5, name: "Karan Mehta", email: "karan@sec.in", role: "Admin", institute: "Smart Education Center", status: "inactive" as const },
  { id: 6, name: "Sneha Gupta", email: "sneha@student.in", role: "Student", institute: "Skill Bridge Academy", status: "active" as const },
];

export const subscriptionPlans = [
  { id: 1, name: "Basic", price: "₹2,999/mo", features: ["Up to 100 students", "5 batches", "Basic analytics"], institutes: 8 },
  { id: 2, name: "Standard", price: "₹5,999/mo", features: ["Up to 300 students", "15 batches", "Advanced analytics", "Priority support"], institutes: 18 },
  { id: 3, name: "Premium", price: "₹9,999/mo", features: ["Unlimited students", "Unlimited batches", "Full analytics", "Dedicated support", "Custom branding"], institutes: 22 },
];

// ---- Admin ----
export const adminStats = [
  { title: "Total Students", value: "450", change: "+12 this week", icon: "👨‍🎓" },
  { title: "Active Batches", value: "8", change: "2 starting soon", icon: "📚" },
  { title: "Tests Conducted", value: "156", change: "+8 this week", icon: "📝" },
  { title: "Avg Performance", value: "78%", change: "+3% improvement", icon: "📈" },
];

export const batches = [
  { id: 1, name: "Excel Batch A", students: 32, startDate: "Jan 5", endDate: "Mar 15", status: "active" as const, progress: 65 },
  { id: 2, name: "Tally Batch B", students: 28, startDate: "Jan 10", endDate: "Apr 10", status: "active" as const, progress: 40 },
  { id: 3, name: "Python Batch C", students: 25, startDate: "Feb 1", endDate: "May 1", status: "upcoming" as const, progress: 0 },
  { id: 4, name: "Excel Batch D", students: 30, startDate: "Nov 1", endDate: "Jan 15", status: "completed" as const, progress: 100 },
];

export const adminStudents = [
  { id: 1, name: "Arjun Singh", batch: "Excel Batch A", score: 92, tests: 12, rank: 1 },
  { id: 2, name: "Meera Joshi", batch: "Excel Batch A", score: 88, tests: 12, rank: 2 },
  { id: 3, name: "Karan Mehta", batch: "Tally Batch B", score: 85, tests: 10, rank: 3 },
  { id: 4, name: "Sneha Gupta", batch: "Python Batch C", score: 82, tests: 8, rank: 4 },
  { id: 5, name: "Vikram Rao", batch: "Tally Batch B", score: 78, tests: 10, rank: 5 },
  { id: 6, name: "Ananya Sharma", batch: "Excel Batch A", score: 95, tests: 12, rank: 6 },
];

export const recentTestResults = [
  { name: "Excel Formulas Quiz", batch: "Excel Batch A", date: "Jan 15", avgScore: 82, submissions: 30 },
  { name: "GST Returns Practice", batch: "Tally Batch B", date: "Jan 14", avgScore: 75, submissions: 26 },
  { name: "Python Variables Test", batch: "Python Batch C", date: "Jan 13", avgScore: 70, submissions: 22 },
  { name: "VLOOKUP Challenge", batch: "Excel Batch A", date: "Jan 12", avgScore: 88, submissions: 31 },
];

export const monthlyPerformance = [
  { month: "Aug", score: 65 },
  { month: "Sep", score: 70 },
  { month: "Oct", score: 68 },
  { month: "Nov", score: 74 },
  { month: "Dec", score: 78 },
  { month: "Jan", score: 82 },
];

// ---- Student ----
export const studentCourses = [
  { id: 1, name: "Excel Mastery", progress: 72, totalTests: 15, completedTests: 11, icon: "📊" },
  { id: 2, name: "Tally Prime", progress: 45, totalTests: 12, completedTests: 5, icon: "📒" },
  { id: 3, name: "Coding Basics", progress: 30, totalTests: 10, completedTests: 3, icon: "💻" },
];

export const studentAssignedTests = [
  { id: 1, name: "Excel Formulas Quiz", course: "Excel Mastery", dueDate: "Jan 20", status: "pending" as const, duration: "30 min" },
  { id: 2, name: "GST Returns Practice", course: "Tally Prime", dueDate: "Jan 21", status: "pending" as const, duration: "45 min" },
  { id: 3, name: "Python Loops Test", course: "Coding Basics", dueDate: "Jan 22", status: "pending" as const, duration: "40 min" },
  { id: 4, name: "VLOOKUP Challenge", course: "Excel Mastery", dueDate: "Jan 18", status: "completed" as const, duration: "25 min", score: 92 },
  { id: 5, name: "Ledger Basics", course: "Tally Prime", dueDate: "Jan 16", status: "completed" as const, duration: "30 min", score: 85 },
];

export const studentActivity = [
  { action: "Completed Excel Formulas Quiz", time: "2 hours ago", icon: "✅" },
  { action: "Started Tally Prime course", time: "Yesterday", icon: "📒" },
  { action: "Achieved Rank #4 in Leaderboard", time: "2 days ago", icon: "🏆" },
  { action: "Scored 95% in Data Entry Test", time: "3 days ago", icon: "🎯" },
];

// ---- Course Tests (per course) ----
export interface CourseTest {
  id: number;
  name: string;
  category: "weekly" | "topic-wise" | "practice";
  topic: string;
  questions: number;
  duration: string;
  status: "pending" | "completed" | "locked";
  score?: number;
  dueDate?: string;
}

export const courseTests: Record<number, CourseTest[]> = {
  1: [ // Excel Mastery
    { id: 101, name: "Week 1 – Basics & Navigation", category: "weekly", topic: "Basics", questions: 10, duration: "20 min", status: "completed", score: 90 },
    { id: 102, name: "Week 2 – Formulas & Functions", category: "weekly", topic: "Formulas", questions: 10, duration: "25 min", status: "completed", score: 85 },
    { id: 103, name: "Week 3 – Data Analysis", category: "weekly", topic: "Analysis", questions: 10, duration: "25 min", status: "pending", dueDate: "Jan 22" },
    { id: 104, name: "Week 4 – Charts & Visualization", category: "weekly", topic: "Charts", questions: 8, duration: "20 min", status: "locked" },
    { id: 111, name: "VLOOKUP & HLOOKUP", category: "topic-wise", topic: "Lookup Functions", questions: 8, duration: "15 min", status: "completed", score: 92 },
    { id: 112, name: "Pivot Tables", category: "topic-wise", topic: "Pivot Tables", questions: 10, duration: "20 min", status: "pending" },
    { id: 113, name: "Conditional Formatting", category: "topic-wise", topic: "Formatting", questions: 6, duration: "12 min", status: "pending" },
    { id: 121, name: "Practice Set 1", category: "practice", topic: "Mixed", questions: 10, duration: "30 min", status: "completed", score: 78 },
    { id: 122, name: "Practice Set 2", category: "practice", topic: "Mixed", questions: 10, duration: "30 min", status: "pending" },
  ],
  2: [ // Tally Prime
    { id: 201, name: "Week 1 – Company Setup", category: "weekly", topic: "Setup", questions: 8, duration: "15 min", status: "completed", score: 88 },
    { id: 202, name: "Week 2 – Ledger & Groups", category: "weekly", topic: "Ledgers", questions: 10, duration: "20 min", status: "pending", dueDate: "Jan 23" },
    { id: 203, name: "Week 3 – Voucher Entry", category: "weekly", topic: "Vouchers", questions: 10, duration: "25 min", status: "locked" },
    { id: 211, name: "GST Configuration", category: "topic-wise", topic: "GST", questions: 8, duration: "18 min", status: "completed", score: 80 },
    { id: 212, name: "Balance Sheet", category: "topic-wise", topic: "Reports", questions: 6, duration: "15 min", status: "pending" },
    { id: 221, name: "Tally Practice Test", category: "practice", topic: "Mixed", questions: 10, duration: "30 min", status: "pending" },
  ],
  3: [ // Coding Basics
    { id: 301, name: "Week 1 – Variables & Types", category: "weekly", topic: "Variables", questions: 8, duration: "15 min", status: "completed", score: 95 },
    { id: 302, name: "Week 2 – Control Flow", category: "weekly", topic: "Loops", questions: 10, duration: "20 min", status: "pending", dueDate: "Jan 24" },
    { id: 303, name: "Week 3 – Functions", category: "weekly", topic: "Functions", questions: 10, duration: "25 min", status: "locked" },
    { id: 311, name: "Lists & Tuples", category: "topic-wise", topic: "Data Structures", questions: 8, duration: "18 min", status: "pending" },
    { id: 312, name: "String Methods", category: "topic-wise", topic: "Strings", questions: 6, duration: "12 min", status: "pending" },
    { id: 321, name: "Python Practice Set", category: "practice", topic: "Mixed", questions: 10, duration: "30 min", status: "pending" },
  ],
};

// Expanded question banks per test
export const testQuestionBank: Record<number, typeof testQuestions> = {
  101: [
    { id: 1, question: "What is the shortcut to open a new workbook?", options: ["Ctrl+N", "Ctrl+O", "Ctrl+W", "Ctrl+S"], correct: 0 },
    { id: 2, question: "Which tab contains the 'Sort' feature?", options: ["Home", "Insert", "Data", "View"], correct: 2 },
    { id: 3, question: "What is a cell reference?", options: ["A named range", "The address of a cell", "A formula", "A function"], correct: 1 },
    { id: 4, question: "How many sheets does a new workbook have by default?", options: ["1", "2", "3", "5"], correct: 0 },
    { id: 5, question: "Which bar shows the content of the active cell?", options: ["Status bar", "Title bar", "Formula bar", "Menu bar"], correct: 2 },
  ],
  102: testQuestions,
  103: [
    { id: 1, question: "What does SUMIF do?", options: ["Sums all cells", "Sums cells matching criteria", "Counts cells", "Averages cells"], correct: 1 },
    { id: 2, question: "Which function counts non-empty cells?", options: ["COUNT", "COUNTA", "COUNTIF", "SUM"], correct: 1 },
    { id: 3, question: "What does the IF function return?", options: ["Always TRUE", "One of two values", "A number", "An error"], correct: 1 },
    { id: 4, question: "What is a pivot table used for?", options: ["Creating charts", "Summarizing data", "Formatting cells", "Printing"], correct: 1 },
    { id: 5, question: "Which tool is used for What-If analysis?", options: ["Goal Seek", "VLOOKUP", "AutoFill", "Flash Fill"], correct: 0 },
  ],
  111: testQuestions,
  112: [
    { id: 1, question: "A pivot table can summarize data from:", options: ["Only one column", "Multiple columns", "Only numbers", "Only text"], correct: 1 },
    { id: 2, question: "Where do you drag fields in a pivot table?", options: ["Only rows", "Rows, columns, values, filters", "Only values", "Only filters"], correct: 1 },
    { id: 3, question: "What is a slicer?", options: ["A chart type", "A visual filter", "A formula", "A cell style"], correct: 1 },
    { id: 4, question: "Can you group dates in a pivot table?", options: ["No", "Yes, by month/year", "Only by year", "Only by day"], correct: 1 },
    { id: 5, question: "What happens when source data changes?", options: ["Pivot auto-updates", "Need to refresh", "Pivot breaks", "Nothing"], correct: 1 },
  ],
  113: testQuestions.slice(0, 3).concat([
    { id: 4, question: "What is conditional formatting?", options: ["Auto formatting", "Rule-based formatting", "Manual formatting", "Default formatting"], correct: 1 },
    { id: 5, question: "Can you use formulas in conditional formatting?", options: ["No", "Yes", "Only SUM", "Only IF"], correct: 1 },
  ]),
  121: testQuestions,
  122: testQuestions,
  201: [
    { id: 1, question: "How do you create a company in Tally?", options: ["Alt+F3", "Alt+F1", "Ctrl+N", "F12"], correct: 0 },
    { id: 2, question: "What is the shortcut to shut a company?", options: ["Alt+F1", "Alt+F3", "Ctrl+W", "F12"], correct: 0 },
    { id: 3, question: "Tally stores data in:", options: ["Excel files", "Data directory", "Cloud only", "PDF files"], correct: 1 },
    { id: 4, question: "What is a group in Tally?", options: ["A ledger", "A classification of ledgers", "A voucher", "A report"], correct: 1 },
    { id: 5, question: "F11 is used for:", options: ["Features", "Configuration", "Help", "Quit"], correct: 0 },
  ],
  202: [
    { id: 1, question: "What is a ledger in Tally?", options: ["A report", "An account head", "A voucher", "A group"], correct: 1 },
    { id: 2, question: "Which group does 'Bank Account' belong to?", options: ["Current Assets", "Bank Accounts", "Cash-in-hand", "Loans"], correct: 1 },
    { id: 3, question: "How to create a ledger?", options: ["Gateway > Accounts Info > Ledgers", "Alt+F3", "F12", "Ctrl+L"], correct: 0 },
    { id: 4, question: "Sundry Debtors are:", options: ["Liabilities", "Assets", "Expenses", "Income"], correct: 1 },
    { id: 5, question: "What is a sub-group?", options: ["A voucher type", "A group within a group", "A ledger type", "A report"], correct: 1 },
  ],
  211: [
    { id: 1, question: "GST stands for:", options: ["General Sales Tax", "Goods & Services Tax", "Government Service Tax", "Gross Sales Tax"], correct: 1 },
    { id: 2, question: "CGST is levied by:", options: ["State", "Central", "Both", "Neither"], correct: 1 },
    { id: 3, question: "What is GSTIN?", options: ["Tax number", "GST Identification Number", "Tax form", "Return type"], correct: 1 },
    { id: 4, question: "HSN code is used for:", options: ["Services", "Goods classification", "Tax rates", "Returns"], correct: 1 },
    { id: 5, question: "IGST applies to:", options: ["Intra-state", "Inter-state", "Exports only", "Imports only"], correct: 1 },
  ],
  212: testQuestions.slice(0, 3).concat([
    { id: 4, question: "Balance sheet shows:", options: ["Profit/Loss", "Assets & Liabilities", "Cash flow", "Sales"], correct: 1 },
    { id: 5, question: "Trial balance should always:", options: ["Show profit", "Balance", "Show loss", "Have 10 entries"], correct: 1 },
  ]),
  221: testQuestions,
  301: [
    { id: 1, question: "What is a variable in Python?", options: ["A function", "A container for data", "A loop", "A module"], correct: 1 },
    { id: 2, question: "Which is a valid variable name?", options: ["2name", "my-var", "my_var", "class"], correct: 2 },
    { id: 3, question: "What type is 3.14?", options: ["int", "float", "str", "bool"], correct: 1 },
    { id: 4, question: "How to print in Python?", options: ["echo()", "print()", "console.log()", "printf()"], correct: 1 },
    { id: 5, question: "What does type() return?", options: ["Value", "Data type", "Memory address", "Nothing"], correct: 1 },
  ],
  302: [
    { id: 1, question: "What keyword starts a loop?", options: ["loop", "for", "repeat", "do"], correct: 1 },
    { id: 2, question: "What does 'break' do?", options: ["Skips iteration", "Exits loop", "Restarts loop", "Nothing"], correct: 1 },
    { id: 3, question: "Which is a comparison operator?", options: ["=", "==", ":=", "=>"], correct: 1 },
    { id: 4, question: "What does 'elif' mean?", options: ["Else", "Else if", "End if", "Exit if"], correct: 1 },
    { id: 5, question: "range(5) generates:", options: ["1-5", "0-4", "0-5", "1-4"], correct: 1 },
  ],
  311: [
    { id: 1, question: "Lists in Python are:", options: ["Immutable", "Mutable", "Fixed size", "Typed"], correct: 1 },
    { id: 2, question: "Tuples are:", options: ["Mutable", "Immutable", "Unordered", "Typed"], correct: 1 },
    { id: 3, question: "How to add to a list?", options: [".add()", ".append()", ".insert()", ".push()"], correct: 1 },
    { id: 4, question: "What is list slicing?", options: ["Deleting", "Extracting portion", "Sorting", "Reversing"], correct: 1 },
    { id: 5, question: "len([1,2,3]) returns:", options: ["2", "3", "4", "1"], correct: 1 },
  ],
  312: [
    { id: 1, question: "What does .upper() do?", options: ["Lowercase", "Uppercase", "Title case", "Reverse"], correct: 1 },
    { id: 2, question: "How to check substring?", options: ["in keyword", ".has()", ".contains()", ".find()"], correct: 0 },
    { id: 3, question: "'Hello'[1] returns:", options: ["H", "e", "l", "o"], correct: 1 },
    { id: 4, question: ".split() does:", options: ["Joins strings", "Splits into list", "Removes spaces", "Counts chars"], correct: 1 },
    { id: 5, question: "f-strings start with:", options: ["s\"\"", "f\"\"", "r\"\"", "b\"\""], correct: 1 },
  ],
  321: testQuestions,
};

// ---- Student Dashboard (enhanced) ----
export const studentScoreTrend = [
  { test: "T1", score: 65 },
  { test: "T2", score: 70 },
  { test: "T3", score: 68 },
  { test: "T4", score: 72 },
  { test: "T5", score: 76 },
  { test: "T6", score: 85 },
  { test: "T7", score: 82 },
];

export const topicBreakdown = [
  { topic: "Formulas", score: 88, color: "hsl(var(--info))" },
  { topic: "Charts", score: 74, color: "hsl(var(--info))" },
  { topic: "Pivot Tables", score: 62, color: "hsl(var(--warning))" },
  { topic: "VBA", score: 45, color: "hsl(var(--destructive))" },
  { topic: "Data Validation", score: 91, color: "hsl(var(--info))" },
];

export const studentMyTests = [
  { id: 101, name: "Excel Functions Mid-Term", duration: "30 min", due: "Apr 10", status: "pending" as const, score: null },
  { id: 102, name: "Excel VBA Intro", duration: "20 min", due: "Apr 12", status: "pending" as const, score: null },
  { id: 103, name: "Excel Basics Q2", duration: "25 min", due: "Apr 3", status: "completed" as const, score: 88 },
  { id: 104, name: "Charts & Formatting", duration: "15 min", due: "Mar 28", status: "completed" as const, score: 76 },
];
