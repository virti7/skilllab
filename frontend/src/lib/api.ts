const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class ApiError extends Error {
  status: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, status: number, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function getAccessToken(): string | null {
  return localStorage.getItem('skilllab_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('skilllab_refresh');
}

function setTokens(access: string, refresh: string): void {
  localStorage.setItem('skilllab_token', access);
  localStorage.setItem('skilllab_refresh', refresh);
}

function clearTokens(): void {
  localStorage.removeItem('skilllab_token');
  localStorage.removeItem('skilllab_refresh');
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
    if (data.success && data.data) {
      setTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.accessToken;
    }
    return null;
  } catch {
    clearTokens();
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 1
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    let res = await fetch(`${API_BASE}${endpoint}`, config);

    if (res.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${API_BASE}${endpoint}`, { ...config, headers });
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(
        body.message || `Request failed with status ${res.status}`,
        res.status,
        body.errors
      );
    }

    const json = await res.json();

    if (json && typeof json.success === 'boolean') {
      if (!json.success) {
        throw new ApiError(json.message || 'Request failed', res.status, json.errors);
      }
      return json.data as T;
    }

    return json as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return request<T>(endpoint, options, retries - 1);
    }

    throw new ApiError('Network error. Please check your connection.', 0);
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export const tokenStorage = {
  set: (token: string) => localStorage.setItem('skilllab_token', token),
  get: () => localStorage.getItem('skilllab_token'),
  remove: () => localStorage.removeItem('skilllab_token'),
};

export { ApiError, ApiResponse, PaginatedResponse };
export { getAccessToken, getRefreshToken, setTokens, clearTokens };

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
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    instituteName?: string;
  }) => api.post<AuthResponse>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  me: () => api.get<AuthUser>('/auth/me'),
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

export const batchApi = {
  create: (name: string) => api.post<Batch>('/batch/create', { name }),

  join: (inviteCode: string) =>
    api.post<{ message: string; batch: Batch }>('/batch/join', { inviteCode }),

  get: () => api.get<Batch[]>('/batch/get'),

  getMy: () => api.get<Batch[]>('/batch/my'),

  getAdminBatches: () => api.get<Batch[]>('/batch/admin/batches'),

  getStudentBatches: () => api.get<Batch[]>('/batch/student/batches'),

  getStudents: (batchId: string) =>
    api.get<BatchStudentsResponse>(`/batch/${batchId}/students`),

  getAnalytics: (batchId: string) =>
    api.get<BatchAnalyticsResponse>(`/batch/${batchId}/analytics`),

  delete: (batchId: string) =>
    api.delete<{ message: string }>(`/batch/${batchId}`),
};

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
    api.post<TestFull>('/test/create', data),

  get: () => api.get<TestSummary[]>('/test/get'),

  getById: (testId: string) => api.get<TestFull>(`/test/${testId}`),

  getByBatch: (batchId: string) => api.get<TestForBatch[]>(`/test/batch/${batchId}`),

  getUpcoming: () => api.get<UpcomingTest[]>('/test/upcoming'),

  getStudentTests: (batchId?: string) =>
    api.get<TestSummary[]>(`/test/student${batchId ? `?batchId=${batchId}` : ''}`),

  getGeneral: () => api.get<TestSummary[]>('/test/general'),

  getHistory: () => api.get<TestStudentHistory[]>('/test/history'),

  getSubmissionAnalytics: (submissionId: string) =>
    api.get<TestSubmissionAnalytics>(`/test/submission/${submissionId}`),

  submit: (testId: string, answers: { questionId: string; selectedOption: string }[]) =>
    api.post<SubmitResult>('/test/submit', { testId, answers }),

  delete: (testId: string) =>
    api.delete<{ success: boolean; message: string }>(`/test/${testId}`),
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
  get: () => api.get<ResultSummary[]>('/result/get'),

  getById: (resultId: string) => api.get<ResultSummary>(`/result/${resultId}`),
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
    api.get<LeaderboardEntry[]>(`/leaderboard${batchId ? `?batchId=${batchId}` : ''}`),

  getBatch: (batchId: string) =>
    api.get<LeaderboardEntry[]>(`/leaderboard/batch/${batchId}`),
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

export interface BatchPerformanceData {
  batchId: string;
  batchName: string;
  avgScore: number;
  totalStudents: number;
  totalTests: number;
  totalSubmissions: number;
}

export interface BatchPerformanceSummary {
  totalBatches: number;
  bestBatch: { name: string; score: number } | null;
  worstBatch: { name: string; score: number } | null;
  overallAvg: number;
}

export interface BatchPerformanceTrend {
  week: string;
  avgScore: number;
}

export interface BatchPerformanceResponse {
  batches: BatchPerformanceData[];
  summary: BatchPerformanceSummary;
  trend: BatchPerformanceTrend[];
}

export const dashboardApi = {
  admin: () => api.get<AdminDashboardData>('/dashboard/admin'),
  student: () => api.get<StudentDashboardData>('/dashboard/student'),
  getBatchPerformance: () => api.get<BatchPerformanceResponse>('/dashboard/batch-performance'),
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
  getStudents: () => api.get<AdminStudent[]>('/dashboard/students'),
  getStudentAnalytics: (studentId: string) => api.get<StudentAnalyticsData>(`/dashboard/student/${studentId}`),
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
  }) => api.post<AIGenerateResponse>('/ai/generate-test', data),

  analyzePerformance: (data: {
    studentName: string;
    answers: Array<{ question: string; isCorrect: boolean }>;
    topics?: string[];
  }) => api.post<AIAnalysisResponse>('/ai/analyze-performance', data),
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
  get: (testId: string) => api.get<TestAnalyticsResponse>(`/test/${testId}/analytics`),
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
  get: (testId: string) => api.get<TestResultData>(`/test/${testId}/result`),
};

// ─── Student Analytics ───────────────────────────────

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
  getAnalytics: () => api.get<StudentAnalyticsData>('/student/analytics'),
  getTopicBreakdown: () => api.get<{ topics: Array<{ topic: string; total: number; correct: number; percentage: number }> }>('/student/topic-breakdown'),
  getCompletedTestsAnalytics: () => api.get<{
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
  }>('/student/completed-tests-analytics'),
  getCombinedAnalytics: () => api.get<CombinedAnalytics>('/student/combined-analytics'),
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
  getBatches: () => api.get<CodingBatch[]>('/coding/batches'),

  getStudentQuestions: () => api.get<CodingQuestion[]>('/student/coding/questions'),

  getQuestions: (batchId?: string, type?: string) =>
    api.get<CodingQuestion[]>(`/coding/questions?${batchId ? `batchId=${batchId}&` : ''}${type ? `type=${type}` : ''}`),

  getQuestionById: (id: string) => api.get<CodingQuestionFull>(`/coding/question/${id}`),

  getTests: (batchId?: string) =>
    api.get<CodingTest[]>(`/coding/tests${batchId ? `?batchId=${batchId}` : ''}`),

  getTestsForStudent: () => api.get<CodingTest[]>('/coding/student/tests'),

  getTestById: (id: string) => api.get<CodingTestWithQuestions>(`/coding/test/${id}`),

  runCode: (code: string, language: string, questionId?: string) =>
    api.post<RunCodeResult>('/coding/run', { code, language, questionId }),

  submitCode: (questionId: string, code: string, language: string, testId?: string) =>
    api.post<CodingSubmitResult>('/coding/submit', { questionId, code, language, testId }),

  getAnalytics: () => api.get<CodingAnalytics>('/coding/analytics'),

  getStudentAnalytics: (batchId: string) =>
    api.get<{
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
    }>(`/coding/student/analytics?batchId=${batchId}`),

  getCodingHistory: (batchId: string) =>
    api.get<Array<{
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
    }>>(`/coding/student/history?batchId=${batchId}`),

  getAdminAnalytics: (batchId?: string) =>
    api.get<CodingAdminAnalytics>(`/coding/admin/analytics${batchId ? `?batchId=${batchId}` : ''}`),

  generateQuestion: (topic: string, difficulty: string, language: string) =>
    api.post<GeneratedCodingQuestion>('/coding/admin/coding/generate', { topic, difficulty, language }),

  getAdminQuestions: (batchId?: string) =>
    api.get<AdminCodingQuestion[]>(`/coding/admin/coding/questions${batchId ? `?batchId=${batchId}` : ''}`),

  createQuestion: (data: {
    batchId: string;
    type: string;
    topic: string;
    difficulty: string;
    title: string;
    description: string;
    starterCode: string;
    testCases: Array<{ input: string; expectedOutput: string }>;
  }) => api.post<AdminCodingQuestion>('/coding/admin/coding/question', data),

  updateQuestion: (id: string, data: Partial<{
    type: string;
    topic: string;
    difficulty: string;
    title: string;
    description: string;
    starterCode: string;
    testCases: Array<{ input: string; expectedOutput: string }>;
  }>) => api.put<AdminCodingQuestion>(`/coding/admin/coding/question/${id}`, data),

  deleteQuestion: (id: string) => api.delete<void>(`/coding/admin/coding/question/${id}`),

  getTestAnalytics: (testId: string) => api.get<CodingTestAnalytics>(`/coding/test/${testId}/analytics`),

  createTest: (data: {
    batchId: string;
    title: string;
    duration?: number;
    questionIds?: string[];
  }) => api.post<{ id: string }>('/coding/admin/coding/test', data),

  getAdminTests: (batchId?: string) =>
    api.get<Array<{
      id: string;
      title: string;
      duration: number;
      batchId: string;
      batchName?: string;
      _count: { questions: number };
    }>>(`/coding/admin/coding/tests${batchId ? `?batchId=${batchId}` : ''}`),

  deleteTest: (id: string) => api.delete<void>(`/coding/admin/coding/test/${id}`),

  getResultById: (submissionId: string) =>
    api.get<{
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
    }>(`/coding/student/result/${submissionId}`),

  getInsights: (batchId: string) =>
    api.get<{
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
    }>(`/coding/student/insights/${batchId}`),
};

// ─── Practice Sheets ───────────────────────────────────────

export interface PracticeSheetBatch {
  id: string;
  name: string;
  inviteCode?: string;
  studentCount: number;
  createdAt?: string;
}

export interface MCQQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  topic: string | null;
  type: 'mcq';
  marks?: number;
}

export interface CodingQuestionItem {
  id: string;
  title: string;
  description: string;
  starterCode?: string | null;
  solutionCode?: string | null;
  solution?: string;
  testCases: Array<{ input: string; output: string }>;
  difficulty: string | null;
  topic: string | null;
  type: 'coding';
  marks?: number;
  constraints?: string;
  hints?: string[];
  language?: string;
}

export interface DebugQuestion {
  id: string;
  title: string;
  description: string;
  buggyCode: string | null;
  expectedOutput: string | null;
  solutionCode: string | null;
  testCases: unknown[];
  difficulty: string | null;
  topic: string | null;
  hints: string[] | null;
  type: 'debug';
  marks?: number;
}

export interface PracticeSheetOptions {
  includeAnswerKey: boolean;
  includeWriteSpace: boolean;
  showDifficulty: boolean;
  showStudentInfo: boolean;
  showMarksPerQuestion: boolean;
}

export interface GeneratedPracticeSheet {
  sheetType: string;
  instituteName: string;
  sheetTitle: string;
  totalMarks: number;
  topics: string[];
  batchName?: string | null;
  difficulties: string[];
  codingLanguage?: string;
  options: PracticeSheetOptions;
  mcq: MCQQuestion[];
  coding: CodingQuestionItem[];
  debug: DebugQuestion[];
}

export interface BatchDetails {
  batchId: string;
  batchName: string;
  topics: string[];
  topicCounts: Record<string, number>;
  testCount: number;
  questionCount: number;
}

export type SheetType = 'mcq' | 'coding' | 'debug' | 'mixed';

export const practiceSheetsApi = {
  getBatches: () => api.get<PracticeSheetBatch[]>('/practice-sheets/batches'),

  getTopics: () => api.get<string[]>('/practice-sheets/topics'),

  getBatchDetails: (batchId: string) => api.get<BatchDetails>(`/practice-sheets/batch-details/${batchId}`),

  generateSheet: (data: {
    sheetType: SheetType;
    instituteName?: string;
    sheetTitle?: string;
    totalMarks?: number;
    topics?: string[];
    difficulties?: string[];
    includeAnswerKey?: boolean;
    includeWriteSpace?: boolean;
    showDifficulty?: boolean;
    showStudentInfo?: boolean;
    showMarksPerQuestion?: boolean;
    batchId?: string;
    mcqCount?: number;
    codingCount?: number;
    debugCount?: number;
    codingLanguage?: string;
    concepts?: string[];
    curriculum?: string[];
  }) => api.post<GeneratedPracticeSheet>('/practice-sheets/generate', data),
};
