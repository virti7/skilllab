// SkillLab API Service
// Centralized fetch wrapper for all backend calls

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  return localStorage.getItem('skilllab_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed: ${res.status}`);
  }

  return data as T;
}

// ─── Auth ────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'super_admin';
  instituteId?: string;
  instituteName?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    instituteName?: string;
  }) => request<AuthResponse>('POST', '/auth/register', data, false),

  login: (email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { email, password }, false),

  me: () => request<AuthUser>('GET', '/auth/me'),
};

// ─── Batch ────────────────────────────────────────────────

export interface Batch {
  id: string;
  name: string;
  inviteCode?: string;
  studentCount?: number;
  testCount?: number;
  createdAt?: string;
  joinedAt?: string;
}

export interface BatchStudent {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  batchName: string;
  testsCompleted: number;
  avgScore: number | null;
  totalScore: number;
}

export interface BatchStudentsResponse {
  batchId: string;
  batchName: string;
  students: BatchStudent[];
}

export const batchApi = {
  create: (name: string) => request<Batch>('POST', '/batch/create', { name }),

  join: (inviteCode: string) =>
    request<{ message: string; batch: Batch }>('POST', '/batch/join', { inviteCode }),

  get: () => request<Batch[]>('GET', '/batch/get'),

  getMy: () => request<Batch[]>('GET', '/batch/my'),

  getAdminBatches: () => request<Batch[]>('GET', '/batch/admin/batches'),

  getStudentBatches: () => request<Batch[]>('GET', '/batch/student/batches'),

  getStudents: (batchId: string) =>
    request<BatchStudentsResponse>('GET', `/batch/${batchId}/students`),

  getAnalytics: (batchId: string) =>
    request<BatchAnalyticsResponse>('GET', `/batch/${batchId}/analytics`),
};

export interface StudentAnalytics {
  id: string;
  name: string;
  email: string;
  testsAttempted: number;
  avgScore: number | null;
  totalScore: number;
}

export interface TestAnalytics {
  id: string;
  title: string;
  attempts: number;
  avgScore: number | null;
}

export interface LeaderboardEntryAnalytics {
  studentId: string;
  name: string;
  totalScore: number;
  avgScore: number | null;
  testsAttempted: number;
  rank: number;
}

export interface TestTrend {
  testName: string;
  avgScore: number;
}

export interface Insights {
  topPerformer: { name: string; score: number } | null;
  weakStudentsCount: number;
  weakStudents: { name: string; score: number }[];
  bestTest: { title: string; score: number } | null;
  worstTest: { title: string; score: number } | null;
}

export interface ScoreDistribution {
  excellent: number;
  average: number;
  needsImprovement: number;
  noAttempts: number;
}

export interface BatchAnalyticsResponse {
  batch: {
    id: string;
    name: string;
    inviteCode: string;
    createdAt: string;
  };
  summary: {
    totalStudents: number;
    totalTests: number;
    totalAttempts: number;
    avgBatchScore: number | null;
  };
  students: StudentAnalytics[];
  tests: TestAnalytics[];
  leaderboard: LeaderboardEntryAnalytics[];
  trends: {
    testScoresOverTime: TestTrend[];
  };
  insights: Insights;
  scoreDistribution: ScoreDistribution;
}

// ─── Test ────────────────────────────────────────────────

export interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export interface TestSummary {
  id: string;
  title: string;
  duration: number;
  batchName?: string | null;
  questionCount: number;
  submissionCount?: number;
  status?: 'upcoming' | 'completed';
  result?: { id: string; score: number; percentage: number; submittedAt?: string } | null;
  expiryDate?: string | null;
  isExpired?: boolean;
  isUpcoming?: boolean;
  createdAt?: string;
}

export interface TestForBatch {
  id: string;
  title: string;
  duration: number;
  batchId: string | null;
  batchName: string | null;
  questionCount: number;
  submissionCount: number;
  avgScore: number | null;
  createdAt: string;
  isExpired?: boolean;
  expiryDate?: string | null;
}

export interface UpcomingTest {
  id: string;
  name: string;
  batchName: string | null;
  duration: number;
  questionCount: number;
  createdAt: string;
}

export interface TestStudentHistory {
  submissionId: string;
  testId: string;
  testTitle: string;
  batchId: string | null;
  batchName: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  percentage: number;
  accuracy: number;
  timeTaken: number;
  submittedAt: string;
  type?: 'normal' | 'coding';
  questionId?: string;
  questionTitle?: string;
  questionTopic?: string;
  questionDifficulty?: string;
  language?: string;
  status?: string;
  runtime?: string;
  memory?: string;
}

export interface TestSubmissionAnalytics {
  submissionId: string;
  testId: string;
  testTitle: string;
  batchName: string;
  batchId: string | null;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  timeTaken: number;
  submittedAt: string;
  percentage: number;
  weakTopics: string[];
  strongTopics: string[];
  questionBreakdown: Array<{
    questionId: string;
    question: string;
    options: { A: string; B: string; C: string; D: string };
    selectedOption: string | null;
    correctOption: string;
    isCorrect: boolean;
    status: 'correct' | 'wrong';
  }>;
}

export interface TestFull {
  id: string;
  title: string;
  duration: number;
  batchName?: string | null;
  questions: Question[];
}

export interface NewQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
}

export interface SubmitResult {
  success?: boolean;
  resultId: string;
  score: number;
  totalQuestions: number;
  totalMarks?: number;
  percentage: number;
  passed: boolean;
  correctAnswers?: Array<{
    questionId: string;
    question: string;
    yourAnswer: string;
    correctAnswer: string;
  }>;
  wrongAnswers?: Array<{
    questionId: string;
    question: string;
    yourAnswer: string;
    correctAnswer: string;
  }>;
}

export const testApi = {
  create: (data: { 
    title: string; 
    duration?: number; 
    batchId?: string; 
    questions: NewQuestion[];
    expiryDate?: string;
  }) =>
    request<TestFull>('POST', '/test/create', data),

  get: () => request<TestSummary[]>('GET', '/test/get'),

  getById: (testId: string) => request<TestFull>('GET', `/test/${testId}`),

  getByBatch: (batchId: string) => request<TestForBatch[]>('GET', `/test/batch/${batchId}`),

  getUpcoming: () => request<UpcomingTest[]>('GET', '/test/upcoming'),

  getStudentTests: (batchId?: string) => 
    request<TestSummary[]>('GET', `/test/student${batchId ? `?batchId=${batchId}` : ''}`),

  getGeneral: () => request<TestSummary[]>('GET', '/test/general'),

  getHistory: () => request<TestStudentHistory[]>('GET', '/test/history'),

  getSubmissionAnalytics: (submissionId: string) => 
    request<TestSubmissionAnalytics>('GET', `/test/submission/${submissionId}`),

  submit: (testId: string, answers: { questionId: string; selectedOption: string }[]) =>
    request<SubmitResult>('POST', '/test/submit', { testId, answers }),

  delete: (testId: string) =>
    request<{ success: boolean; message: string }>('DELETE', `/test/${testId}`),
};

// ─── Results ─────────────────────────────────────────────

export interface ResultSummary {
  id: string;
  testId?: string;
  testTitle: string;
  batchName?: string | null;
  studentName?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  answers?: {
    questionText: string;
    options: { A: string; B: string; C: string; D: string };
    selectedOption: string;
    correctOption: string;
    isCorrect: boolean;
  }[];
}

export const resultApi = {
  get: () => request<ResultSummary[]>('GET', '/result/get'),

  getById: (resultId: string) => request<ResultSummary>('GET', `/result/${resultId}`),
};

// ─── Leaderboard ─────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email?: string;
  totalScore: number;
  testsCompleted: number;
  avgPercentage: number;
  avatar: string;
}

export const leaderboardApi = {
  get: (batchId?: string) =>
    request<LeaderboardEntry[]>('GET', `/leaderboard${batchId ? `?batchId=${batchId}` : ''}`),

  getBatch: (batchId: string) =>
    request<LeaderboardEntry[]>('GET', `/leaderboard/batch/${batchId}`),
};

// ─── Dashboard ───────────────────────────────────────────

export interface AdminDashboardData {
  stats: {
    totalStudents: number;
    totalBatches: number;
    totalTests: number;
    avgScore: number;
  };
  recentTests: {
    id: string;
    name: string;
    batch: string;
    date: string;
    avgScore: number;
    submissions: number;
  }[];
  monthlyPerformance: { month: string; score: number }[];
}

export interface StudentDashboardData {
  pendingCount: number;
  completedCount: number;
  avgScore: number;
  batchRank: number | null;
  scoreTrend: { test: string; score: number }[];
  recentTests: {
    id: string;
    name: string;
    duration: string;
    batchName?: string | null;
    status: 'pending' | 'completed';
    score: number | null;
    questionCount: number;
  }[];
}

export const dashboardApi = {
  admin: () => request<AdminDashboardData>('GET', '/dashboard/admin'),
  student: () => request<StudentDashboardData>('GET', '/dashboard/student'),
};

// ─── Admin Students ─────────────────────────────────────

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  batchName: string | null;
  totalTests: number;
  avgScore: number;
  lastActive: string | null;
}

export interface StudentAnalyticsData {
  id: string;
  name: string;
  email: string;
  batch: string;
  totalTests: number;
  avgScore: number;
  rank: number;
  performanceTrend: { test: string; score: number }[];
  topicBreakdown: { topic: string; percentage: number }[];
  weakTopics: string[];
}

export const adminApi = {
  getStudents: () => request<AdminStudent[]>('GET', '/dashboard/students'),
  getStudentAnalytics: (studentId: string) => request<StudentAnalyticsData>('GET', `/dashboard/student/${studentId}`),
};

// ─── AI Generation ────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export interface AIGeneratedQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface AIGenerateResponse {
  success: boolean;
  questions: AIGeneratedQuestion[];
  metadata: {
    subject: string;
    topic: string;
    difficulty: Difficulty;
    count: number;
  };
}

export interface AIAnalysis {
  weakTopics: string[];
  strongTopics: string[];
  suggestions: string[];
  overallScore: number;
}

export interface AIAnalysisResponse {
  success: boolean;
  analysis: AIAnalysis;
}

export const aiApi = {
  generateTest: (data: {
    subject: string;
    topic: string;
    difficulty: Difficulty;
    numberOfQuestions: number;
  }) => request<AIGenerateResponse>('POST', '/ai/generate-test', data),

  analyzePerformance: (data: {
    studentName: string;
    answers: Array<{ question: string; isCorrect: boolean }>;
    topics?: string[];
  }) => request<AIAnalysisResponse>('POST', '/ai/analyze-performance', data),
};

// ─── Test Analytics ───────────────────────────────────────

export interface TestAnalyticsStudent {
  studentId: string;
  name: string;
  email: string;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
  weakAreas: string[];
  aiAnalysis?: AIAnalysis;
}

export interface TestQuestionAnalysis {
  questionId: string;
  questionText: string;
  totalAttempts: number;
  correctAttempts: number;
  correctPercentage: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TestAnalyticsResponse {
  test: {
    id: string;
    title: string;
    batchName: string | null;
    totalQuestions: number;
    totalAttempts: number;
    expiryDate: string | null;
    isExpired: boolean;
  };
  summary: {
    totalStudents: number;
    avgScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    totalQuestions: number;
  };
  students: TestAnalyticsStudent[];
  questionAnalysis: TestQuestionAnalysis[];
  mostDifficultQuestions: TestQuestionAnalysis[];
  easiestQuestions: TestQuestionAnalysis[];
}

export const testAnalyticsApi = {
  get: (testId: string) => request<TestAnalyticsResponse>('GET', `/test/${testId}/analytics`),
};

// ─── Test Result ───────────────────────────────────────

export interface TestResultDetail {
  questionId: string;
  question: string;
  selected: string | null;
  correct: string;
  isCorrect: boolean;
}

export interface TestResultTopicStats {
  total: number;
  correct: number;
  percentage: number;
}

export interface TestResultData {
  testId: string;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
  details: TestResultDetail[];
  topicStats: Record<string, TestResultTopicStats>;
  weakTopics: string[];
  aiFeedback: {
    strengths: string;
    weaknesses: string;
    suggestions: string;
  };
}

export const testResultApi = {
  get: (testId: string) => request<TestResultData>('GET', `/test/${testId}/result`),
};

// ─── Student Analytics ───────────────────────────────

export interface StudentAnalyticsData {
  testsTaken: number;
  avgScore: number;
  rank: number | null;
  completion: number;
  passedCount: number;
  recentTests: Array<{
    testId: string;
    score: number;
    percentage: number;
    submittedAt: string;
  }>;
}

export interface CombinedAnalytics {
  tests: {
    completed: number;
    passed: number;
    accuracy: number;
  };
  coding: {
    submissions: number;
    problemsAttempted: number;
    problemsSolved: number;
    accuracy: number;
    topicBreakdown: Array<{
      topic: string;
      total: number;
      passed: number;
      percentage: number;
    }>;
  };
  combined: {
    totalActivity: number;
    lastActivity: string | null;
  };
  recentActivity: Array<{
    type: 'test' | 'coding';
    id: string;
    title: string;
    percentage?: number;
    passed?: number;
    total?: number;
    submittedAt: string;
  }>;
}

export const studentApi = {
  getAnalytics: () => request<StudentAnalyticsData>('GET', '/student/analytics'),
  getTopicBreakdown: () => request<{ topics: Array<{ topic: string; total: number; correct: number; percentage: number }> }>('GET', '/student/topic-breakdown'),
  getCompletedTestsAnalytics: () => request<{
    tests: Array<{
      testId: string;
      title: string;
      batchName: string | null;
      score: number;
      total: number;
      correct: number;
      wrong: number;
      percentage: number;
      submittedAt: string;
      topics: Array<{ topic: string; total: number; correct: number; percentage: number }>;
      weakTopics: string[];
    }>;
  }>('GET', '/student/completed-tests-analytics'),
  getCombinedAnalytics: () => request<CombinedAnalytics>('GET', '/student/combined-analytics'),
};

// ─── Token helpers ────────────────────────────────────────

export const tokenStorage = {
  set: (token: string) => localStorage.setItem('skilllab_token', token),
  get: () => localStorage.getItem('skilllab_token'),
  remove: () => localStorage.removeItem('skilllab_token'),
};

// ─── Coding Lab ───────────────────────────────────────

export interface CodingBatch {
  id: string;
  name: string;
  batchId: string;
  _count?: {
    questions: number;
    tests: number;
  };
}

export interface CodingQuestion {
  id: string;
  type: string;
  topic: string;
  difficulty: string;
  title: string;
  description: string;
  starterCode: string | null;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
  constraints: string | null;
  hints: string | null;
}

export interface CodingTest {
  id: string;
  title: string;
  duration: number;
  _count: {
    questions: number;
  };
}

export interface CodingTestWithQuestions extends CodingTest {
  questions: Array<{
    id: string;
    orderIndex: number;
    codingQuestion: CodingQuestion;
  }>;
}

export interface CodingQuestionFull extends CodingQuestion {
  id: string;
  type: string;
  topic: string;
  difficulty: string;
  title: string;
  description: string;
  starterCode: string | null;
  buggyCode: string | null;
  expectedOutput: string | null;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export interface TestCaseResult {
  input: string;
  output?: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean | null;
  status: string;
  runtime: number | null;
  memory?: number | null;
  error?: string;
}

export interface RunCodeResult {
  results: TestCaseResult[];
  status: string;
  executionTime: number | null;
  memory: number | null;
  error?: string;
  runType?: string;
}

export interface CodingAnalytics {
  timeComplexity?: string;
  spaceComplexity?: string;
  optimization?: string;
  codeQualityScore?: number;
  suggestions?: string[];
}

export interface CodingAnalyticsAdmin {
  problemsSolved: number;
  accuracy: number;
  avgRuntime: number;
  weakTopics: string[];
  strongTopics: string[];
  totalSubmissions: number;
  topicStats: Array<{
    topic: string;
    total: number;
    passed: number;
    percentage: number;
  }>;
}

export interface CodingSubmitResult {
  status: string;
  passed: number;
  total: number;
  accuracy: number;
  executionTime: number | null;
  memory: number | null;
  results: TestCaseResult[];
  analytics?: CodingAnalytics;
}

export interface CodingAdminAnalytics {
  totalSubmissions: number;
  totalStudents: number;
  avgAccuracy: number;
  topStudents: Array<{
    userId: string;
    name: string;
    accuracy: number;
    submissions: number;
  }>;
  weakStudents: Array<{
    userId: string;
    name: string;
    accuracy: number;
    submissions: number;
  }>;
  topicBreakdown: Array<{
    topic: string;
    total: number;
    passed: number;
    percentage: number;
  }>;
}

export interface GeneratedCodingQuestion {
  title: string;
  description: string;
  starterCode: string;
  testCases: Array<{
    input: string;
    output: string;
  }>;
}

export interface AdminCodingQuestion {
  id: string;
  type: string;
  topic: string;
  difficulty: string;
  title: string;
  description: string;
  starterCode: string | null;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
  createdAt: string;
  batchName?: string;
}

export interface CodingTestAnalytics {
  test: {
    id: string;
    title: string;
    batchName: string | null;
    duration: number;
    totalQuestions: number;
  };
  overallStats: {
    totalStudents: number;
    attemptedStudents: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    totalSubmissions: number;
  };
  students: Array<{
    userId: string;
    name: string;
    email: string;
    score: number;
    correct: number;
    wrong: number;
    total: number;
    accuracy: number;
    weakTopics: string[];
    strongTopics: string[];
    status: string;
    submissions: number;
  }>;
  questionAnalytics: Array<{
    questionId: string;
    title: string;
    topic: string;
    difficulty: string;
    correctAttempts: number;
    wrongAttempts: number;
    totalAttempts: number;
    accuracy: number;
    difficulty: string;
  }>;
  mostDifficultQuestions: Array<{
    questionId: string;
    title: string;
    topic: string;
    accuracy: number;
  }>;
  easiestQuestions: Array<{
    questionId: string;
    title: string;
    topic: string;
    accuracy: number;
  }>;
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    needsImprovement: number;
  };
}

export const codingApi = {
  getBatches: () => request<CodingBatch[]>('GET', '/coding/batches'),

  getStudentQuestions: () => request<CodingQuestion[]>('GET', '/student/coding/questions'),

  getQuestions: (batchId?: string, type?: string) =>
    request<CodingQuestion[]>('GET', `/coding/questions?${batchId ? `batchId=${batchId}&` : ''}${type ? `type=${type}` : ''}`),

  getQuestionById: (id: string) => request<CodingQuestionFull>('GET', `/coding/question/${id}`),

  getTests: (batchId?: string) =>
    request<CodingTest[]>('GET', `/coding/tests${batchId ? `?batchId=${batchId}` : ''}`),

  getTestsForStudent: () => request<CodingTest[]>('GET', '/coding/student/tests'),

  getTestById: (id: string) => request<CodingTestWithQuestions>('GET', `/coding/test/${id}`),

  runCode: (code: string, language: string, questionId?: string) =>
    request<RunCodeResult>('POST', '/coding/run', { code, language, questionId }),

  submitCode: (questionId: string, code: string, language: string, testId?: string) =>
    request<CodingSubmitResult>('POST', '/coding/submit', { questionId, code, language, testId }),

  getAnalytics: () => request<CodingAnalytics>('GET', '/coding/analytics'),

  getStudentAnalytics: (batchId: string) => 
    request<{
      totalSubmissions: number;
      totalCodingTests: number;
      avgAccuracy: number;
      avgRuntime: number;
      avgMemory: number;
      languageStats: Array<{ language: string; submissions: number; accuracy: number }>;
      topicPerformance: Array<{ topic: string; total: number; passed: number; accuracy: number }>;
      weakTopics: string[];
      strongTopics: string[];
      recentSubmissions: Array<{
        id: string;
        questionId: string;
        questionTitle: string;
        language: string;
        passed: number;
        total: number;
        runtime: number | null;
        status: string;
        createdAt: string;
      }>;
    }>('GET', `/coding/student/analytics?batchId=${batchId}`),

  getCodingHistory: (batchId: string) =>
    request<Array<{
      id: string;
      questionId: string;
      testId: string | null;
      questionTitle: string;
      topic: string;
      difficulty: string;
      questionType: string;
      language: string;
      code: string;
      passed: number;
      total: number;
      runtime: number | null;
      memory: number | null;
      status: string;
      createdAt: string;
    }>>('GET', `/coding/student/history?batchId=${batchId}`),

  getAdminAnalytics: (batchId?: string) =>
    request<CodingAdminAnalytics>('GET', `/coding/admin/analytics${batchId ? `?batchId=${batchId}` : ''}`),

  generateQuestion: (topic: string, difficulty: string, language: string) =>
    request<GeneratedCodingQuestion>('POST', '/coding/admin/coding/generate', { topic, difficulty, language }),

  getAdminQuestions: (batchId?: string) =>
    request<AdminCodingQuestion[]>('GET', `/coding/admin/coding/questions${batchId ? `?batchId=${batchId}` : ''}`),

  createQuestion: (data: {
    batchId: string;
    type: string;
    topic: string;
    difficulty: string;
    title: string;
    description: string;
    starterCode: string;
    testCases: Array<{ input: string; expectedOutput: string }>;
  }) => request<AdminCodingQuestion>('POST', '/coding/admin/coding/question', data),

  updateQuestion: (id: string, data: Partial<{
    type: string;
    topic: string;
    difficulty: string;
    title: string;
    description: string;
    starterCode: string;
    testCases: Array<{ input: string; expectedOutput: string }>;
  }>) => request<AdminCodingQuestion>('PUT', `/coding/admin/coding/question/${id}`, data),

  deleteQuestion: (id: string) => request<void>('DELETE', `/coding/admin/coding/question/${id}`),

  getTestAnalytics: (testId: string) => request<CodingTestAnalytics>('GET', `/coding/test/${testId}/analytics`),

  createTest: (data: {
    batchId: string;
    title: string;
    duration?: number;
    questionIds?: string[];
  }) => request<{ id: string }>('POST', '/coding/admin/coding/test', data),

  getAdminTests: (batchId?: string) =>
    request<Array<{
      id: string;
      title: string;
      duration: number;
      batchId: string;
      batchName?: string;
      _count: { questions: number };
    }>>('GET', `/coding/admin/coding/tests${batchId ? `?batchId=${batchId}` : ''}`),

  deleteTest: (id: string) => request<void>('DELETE', `/coding/admin/coding/test/${id}`),

  getResultById: (submissionId: string) =>
    request<{
      id: string;
      questionId: string;
      testId: string | null;
      code: string;
      language: string;
      passed: number;
      total: number;
      status: string;
      runtime: string;
      memory: string;
      submittedAt: string;
      question: {
        id: string;
        title: string;
        description: string;
        topic: string;
        difficulty: string;
        testCases: Array<{ input: string; expectedOutput: string }>;
      };
    }>('GET', `/coding/student/result/${submissionId}`),

  getInsights: (batchId: string) =>
    request<{
      results: Array<{
        id: string;
        questionId: string;
        passed: number;
        total: number;
        runtime: number | null;
        memory: number | null;
        status: string;
        submittedAt: string;
        topic: string;
        difficulty: string;
        type: string;
      }>;
      weakTopics: Record<string, number>;
      suggestions: Array<{
        topic: string;
        count: number;
        suggestion: string;
      }>;
      topicStats: Array<{
        topic: string;
        passed: number;
        total: number;
        accuracy: number;
      }>;
      totalAttempts: number;
    }>('GET', `/coding/student/insights/${batchId}`),
};
