import request from 'supertest';
import createApp from '../src/app';
import { UserModel } from '../src/models/User';
import { AuthService } from '../src/services/authService';
import { redis } from '../src/config/redis';

jest.mock('../src/models/User');
jest.mock('../src/config/redis', () => ({
  redis: {
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  },
}));

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('Auth Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      mockUserModel.existsByEmail.mockResolvedValue(false);
      mockUserModel.create.mockResolvedValue({
        id: 'test-uuid',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'attendee',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        first_name: 'John',
        last_name: 'Doe',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: 'SecurePass123!',
        first_name: 'John',
        last_name: 'Doe',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'short',
        first_name: 'John',
        last_name: 'Doe',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate email', async () => {
      mockUserModel.existsByEmail.mockResolvedValue(true);

      const res = await request(app).post('/api/auth/register').send({
        email: 'existing@example.com',
        password: 'SecurePass123!',
        first_name: 'John',
        last_name: 'Doe',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
      });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const bcrypt = require('bcryptjs') as typeof import('bcryptjs');
      const hashedPassword = await bcrypt.hash('SecurePass123!', 10);

      mockUserModel.findByEmail.mockResolvedValue({
        id: 'test-uuid',
        email: 'test@example.com',
        password_hash: hashedPassword,
        first_name: 'John',
        last_name: 'Doe',
        role: 'attendee',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should reject invalid password', async () => {
      const bcrypt = require('bcryptjs') as typeof import('bcryptjs');
      const hashedPassword = await bcrypt.hash('CorrectPassword!', 10);

      mockUserModel.findByEmail.mockResolvedValue({
        id: 'test-uuid',
        email: 'test@example.com',
        password_hash: hashedPassword,
        first_name: 'John',
        last_name: 'Doe',
        role: 'attendee',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'SomePassword!',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const { generateToken } = require('../src/utils/jwt') as typeof import('../src/utils/jwt');
      const token = generateToken({ userId: 'test-uuid', email: 'test@example.com', role: 'attendee' });

      mockUserModel.findById.mockResolvedValue({
        id: 'test-uuid',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'attendee',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });
});
