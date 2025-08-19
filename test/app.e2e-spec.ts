import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Application E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });
  });

  describe('Authentication', () => {
    it('/users/login (POST) - should handle login request', () => {
      return request(app.getHttpServer())
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401); // Should fail but endpoint should be reachable
    });

    it('/users/me (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401)
        .expect((res) => {
          // L'API peut retourner soit le format NestJS standard soit un format custom
          expect(res.body).toHaveProperty('errorCode');
          expect(res.body.errorCode).toBe('UNAUTHORIZED');
        });
    });
  });

  describe('Protected Endpoints', () => {
    it('/dishes (GET) - should require authentication', () => {
      return request(app.getHttpServer()).get('/dishes').expect(401);
    });

    it('/dishes (POST) - should require authentication and proper role', () => {
      return request(app.getHttpServer())
        .post('/dishes')
        .send({
          name: 'Test Dish',
          price: 10.99,
          category: 'ENTREE',
        })
        .expect(401);
    });
  });
});
