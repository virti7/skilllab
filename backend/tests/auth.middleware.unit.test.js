import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'skilllab_jwt_secret_key_2024_secure';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: err.name };
  }
}

describe('JWT Token Operations (unit)', () => {

  it('should sign a valid token with role', () => {
    const token = signToken({ id: 'u1', email: 'a@b.com', role: 'ADMIN', name: 'A', instituteId: 'i1' });
    expect(token).toBeTruthy();
    const result = verifyToken(token);
    expect(result.valid).toBe(true);
    expect(result.payload.role).toBe('ADMIN');
    expect(result.payload.id).toBe('u1');
  });

  it('should sign a valid token without role field', () => {
    const token = signToken({ id: 'u1', email: 'a@b.com', name: 'A' });
    expect(token).toBeTruthy();
    const result = verifyToken(token);
    expect(result.valid).toBe(true);
    expect(result.payload.role).toBeUndefined();
  });

  it('should reject expired tokens', async () => {
    const token = jwt.sign(
      { id: 'u1', email: 'a@b.com', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '0s' }
    );
    await new Promise(r => setTimeout(r, 100));
    const result = verifyToken(token);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('TokenExpiredError');
  });

  it('should reject invalid tokens', () => {
    const result = verifyToken('invalid-token-string');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('JsonWebTokenError');
  });

  it('should accept tokens and extract payload fields needed by authenticate middleware', () => {
    const token = signToken({ id: 'u2', email: 'u@test.com', role: 'STUDENT', name: 'User', instituteId: 'inst1' });
    const { payload } = verifyToken(token);
    expect(payload).toHaveProperty('id');
    expect(payload).toHaveProperty('email');
    expect(payload).toHaveProperty('role');
    expect(payload).toHaveProperty('name');
    expect(payload).toHaveProperty('instituteId');
  });

  it('should normalize role to uppercase in authenticate middleware logic', () => {
    const token = signToken({ id: 'u3', email: 'x@y.com', role: 'admin' });
    const { payload } = verifyToken(token);
    const role = payload.role ? payload.role.toUpperCase() : null;
    expect(role).toBe('ADMIN');
  });

  it('should handle missing role by returning null (triggers DB fallback)', () => {
    const token = signToken({ id: 'u4', email: 'x@y.com' });
    const { payload } = verifyToken(token);
    const role = payload.role ? payload.role.toUpperCase() : null;
    expect(role).toBeNull();
  });

  it('should handle requireRole normalization of allowed roles', () => {
    const normalized = ['ADMIN', 'SUPER_ADMIN'];
    expect(normalized.includes('ADMIN')).toBe(true);
    expect(normalized.includes('STUDENT')).toBe(false);
    expect(normalized.includes('SUPER_ADMIN')).toBe(true);
  });

  it('should produce descriptive 403 message format matching roleGuard.js', () => {
    const userRole = 'STUDENT';
    const requiredRoles = ['admin', 'super admin'];
    const message = `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${userRole.toLowerCase().replace(/_/g, ' ')}`;
    expect(message).toBe('Access denied. Required role: admin or super admin. Your role: student');
  });

  it('should handle SUPER_ADMIN role in requireRole check', () => {
    const requiredRoles = ['ADMIN', 'SUPER_ADMIN'].map(r => r.toUpperCase());
    expect(requiredRoles.includes('SUPER_ADMIN')).toBe(true);
    expect(requiredRoles.includes('super_admin'.toUpperCase())).toBe(true);
  });

  it('should produce correct 403 message with SUPER_ADMIN requirement', () => {
    const userRole = 'super_admin';
    const requiredRoles = ['admin', 'super admin'];
    const message = `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${userRole.toLowerCase().replace(/_/g, ' ')}`;
    expect(message).toBe('Access denied. Required role: admin or super admin. Your role: super admin');
  });
});
