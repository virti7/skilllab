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

// ─── Batch ───────────────────────────────────────────────

export interface Batch {
  id: string;
  name: string;
  inviteCode?: string;
  studentCount?: number;
  testCount?: number;
  createdAt?: string;
  joinedAt?: string;
}

export const batchApi = {
  create: (name: string) => request<Batch>('POST', '/batch/create', { name }),

  join: (inviteCode: string) =>
    request<{ message: string; batch: Batch }>('POST', '/batch/join', { inviteCode }),

  get: () => request<Batch[]>('GET', '/batch/get'),
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
  status?: 'pending' | 'completed';
  result?: { id: string; score: number; percentage: number } | null;
  createdAt?: string;
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
  resultId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
}

export const testApi = {
  create: (data: { title: string; duration?: number; batchId?: string; questions: NewQuestion[] }) =>
    request<TestFull>('POST', '/test/create', data),

  get: () => request<TestSummary[]>('GET', '/test/get'),

  getById: (testId: string) => request<TestFull>('GET', `/test/${testId}`),

  submit: (testId: string, answers: { questionId: string; selectedOption: string }[]) =>
    request<SubmitResult>('POST', '/test/submit', { testId, answers }),
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

// ─── Token helpers ────────────────────────────────────────

export const tokenStorage = {
  set: (token: string) => localStorage.setItem('skilllab_token', token),
  get: () => localStorage.getItem('skilllab_token'),
  remove: () => localStorage.removeItem('skilllab_token'),
};
