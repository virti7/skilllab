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
  status?: 'pending' | 'completed';
  result?: { id: string; score: number; percentage: number } | null;
  expiryDate?: string | null;
  isExpired?: boolean;
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
}

export interface UpcomingTest {
  id: string;
  name: string;
  batchName: string | null;
  duration: number;
  questionCount: number;
  createdAt: string;
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
};

// ─── Token helpers ────────────────────────────────────────

export const tokenStorage = {
  set: (token: string) => localStorage.setItem('skilllab_token', token),
  get: () => localStorage.getItem('skilllab_token'),
  remove: () => localStorage.removeItem('skilllab_token'),
};
