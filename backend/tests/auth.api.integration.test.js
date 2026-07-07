import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'skilllab_jwt_secret_key_2024_secure';
const API_BASE = process.env.TEST_API_URL || 'http://localhost:5000';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function apiAvailable() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'health-check', password: 'x' }),
      signal: AbortSignal.timeout(3000),
    });
    return true;
  } catch {
    return false;
  }
}

async function makeRequest(path, options = {}) {
  const url = `${API_BASE}/api${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  return fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(5000),
  });
}

let serverUp = false;

beforeAll(async () => {
  serverUp = await apiAvailable();
  if (!serverUp) {
    console.warn(`\n  ⚠ Server not running at ${API_BASE}. Integration tests skipped.`);
    console.warn('  Start the backend: cd backend && npm run dev');
    console.warn(`  Or set TEST_API_URL to a running instance.\n`);
  }
});

const itIf = (condition) => condition ? it : it.skip;

describe('API Auth Integration', () => {
  itIf(serverUp)('should reject requests without Authorization header', async () => {
    const res = await makeRequest('/batch/get');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toContain('Authentication required');
  });

  itIf(serverUp)('should reject requests with invalid token', async () => {
    const res = await makeRequest('/batch/get', { token: 'invalid-token' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toContain('Invalid token');
  });

  itIf(serverUp)('should reject expired tokens', async () => {
    const expiredToken = jwt.sign(
      { id: 'admin-id', email: 'a@b.com', role: 'ADMIN', name: 'A', instituteId: 'i1' },
      JWT_SECRET,
      { expiresIn: '0s' }
    );
    await new Promise(r => setTimeout(r, 100));
    const res = await makeRequest('/batch/get', { token: expiredToken });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toContain('expired');
  });

  itIf(serverUp)('should accept valid ADMIN token on batch/get', async () => {
    const token = signToken({ id: 'admin-id', email: 'admin@test.com', role: 'ADMIN', name: 'A', instituteId: 'test-institute' });
    const res = await makeRequest('/batch/get', { token });
    expect([200, 201]).toContain(res.status);
  });

  itIf(serverUp)('should accept token missing role field (DB fallback test)', async () => {
    const token = jwt.sign(
      { id: 'admin-id', email: 'admin@test.com', name: 'A', instituteId: 'test-institute' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await makeRequest('/batch/get', { token });
    expect([200, 201, 403]).toContain(res.status);
  });

  itIf(serverUp)('should return 401 for non-existent user in DB fallback', async () => {
    const token = jwt.sign(
      { id: 'non-existent-id', email: 'ghost@test.com', name: 'Ghost' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await makeRequest('/batch/get', { token });
    expect(res.status).toBe(401);
  });
});

describe('Role-Based Access Control (API)', () => {
  const adminToken = signToken({ id: 'admin-id', email: 'admin@test.com', role: 'ADMIN', name: 'A', instituteId: 'test-institute' });
  const studentToken = signToken({ id: 'student-id', email: 'student@test.com', role: 'STUDENT', name: 'S', instituteId: 'test-institute' });

  const adminEndpoints = [
    { method: 'POST', path: '/batch/create', body: { name: 'test-batch' } },
    { method: 'GET', path: '/batch/admin/batches' },
    { method: 'POST', path: '/test/create', body: { title: 'test', questions: [{ questionText: 'q', optionA: 'a', optionB: 'b', optionC: 'c', optionD: 'd', correctOption: 'A' }] } },
    { method: 'GET', path: '/dashboard/admin' },
    { method: 'GET', path: '/dashboard/students' },
    { method: 'GET', path: '/dashboard/batch-performance' },
    { method: 'POST', path: '/ai/generate-test', body: { subject: 'Math', topic: 'Algebra', difficulty: 'easy', numberOfQuestions: 2 } },
  ];

  const studentEndpoints = [
    { method: 'POST', path: '/batch/join', body: { inviteCode: 'XXXXXX' } },
    { method: 'GET', path: '/batch/my' },
    { method: 'GET', path: '/batch/student/batches' },
    { method: 'GET', path: '/test/upcoming' },
    { method: 'GET', path: '/test/student' },
    { method: 'GET', path: '/test/general' },
    { method: 'GET', path: '/test/history' },
    { method: 'POST', path: '/test/submit', body: { testId: 'x', answers: [] } },
    { method: 'GET', path: '/student/analytics' },
    { method: 'GET', path: '/dashboard/student' },
  ];

  adminEndpoints.forEach(({ method, path, body }) => {
    itIf(serverUp)(`should allow ADMIN to access ${method} ${path}`, async () => {
      const res = await makeRequest(path, { method, token: adminToken, body });
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    itIf(serverUp)(`should deny STUDENT access to ${method} ${path}`, async () => {
      const res = await makeRequest(path, { method, token: studentToken, body });
      expect(res.status).toBe(403);
    });
  });

  studentEndpoints.forEach(({ method, path, body }) => {
    itIf(serverUp)(`should allow STUDENT to access ${method} ${path}`, async () => {
      const res = await makeRequest(path, { method, token: studentToken, body });
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    itIf(serverUp)(`should deny ADMIN access to ${method} ${path}`, async () => {
      const res = await makeRequest(path, { method, token: adminToken, body });
      expect(res.status).toBe(403);
    });
  });

  itIf(serverUp)('should return descriptive 403 error message for wrong role', async () => {
    const res = await makeRequest('/dashboard/admin', { token: studentToken });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toContain('Access denied');
    expect(body.message).toContain('admin or super admin');
  });

  itIf(serverUp)('should reject JWT with no role field (DB fallback) if user has wrong role', async () => {
    const token = jwt.sign(
      { id: 'student-id', email: 'student@test.com', name: 'S', instituteId: 'test-institute' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await makeRequest('/dashboard/admin', { token });
    expect(res.status).toBe(403);
  });
});

describe('Public Endpoints (API)', () => {
  itIf(serverUp)('should allow unauthenticated access to POST /auth/login', async () => {
    const res = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent@test.com', password: 'wrong' },
    });
    expect(res.status).toBe(401);
  });

  itIf(serverUp)('should allow any authenticated user to access GET /leaderboard', async () => {
    const token = signToken({ id: 's-id', email: 's@t.com', role: 'STUDENT', name: 'S' });
    const res = await makeRequest('/leaderboard', { token });
    expect([200, 201]).toContain(res.status);
  });
});
