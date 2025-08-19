import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { FirebaseTokenGuard } from '../src/guards/firebase-token.guard';
import { UserRole } from '../src/mongo/models/user.model';

describe('RBAC Simple E2E Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let authToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(MongooseModule)
      .useModule(MongooseModule.forRoot(mongoUri))
      .overrideGuard(FirebaseTokenGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;

          // Si pas de token d'autorisation, bloquer
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
          }

          // Simuler un utilisateur manager pour les tests
          request.user = {
            _id: 'mock-manager-id',
            email: 'manager@test.com',
            role: UserRole.MANAGER,
            firebaseId: 'mock-firebase-id',
          };
          request.firebaseUser = {
            uid: 'mock-firebase-id',
            email: 'manager@test.com',
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authToken = 'mock-firebase-token';
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Authentication Tests', () => {
    it('should reject requests without authentication token', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(403)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Forbidden resource');
        });
    });

    it('should accept requests with valid authentication token', () => {
      return request(app.getHttpServer())
        .get('/users/permissions/check')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('role');
        });
    });
  });

  describe('Manager Role Permissions', () => {
    it('should allow managers to check their permissions', () => {
      return request(app.getHttpServer())
        .get('/users/permissions/check')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.role).toBe(UserRole.MANAGER);
          expect(res.body.data.canManageOrders).toBe(true);
          expect(res.body.data.canTakeOrders).toBe(true);
          expect(res.body.data.canPrepareOrders).toBe(true);
          expect(res.body.data.canSuperviseRestaurant).toBe(true);
          expect(res.body.data.canManageUsers).toBe(true);
        });
    });

    it('should allow managers to view dishes', () => {
      return request(app.getHttpServer())
        .get('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should allow managers to create dishes', () => {
      return request(app.getHttpServer())
        .post('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Manager Test Dish',
          price: 22.0,
          category: 'MAIN_COURSE',
          isAvailable: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.name).toBe('Manager Test Dish');
          expect(res.body.data.price).toBe(22.0);
        });
    });

    it('should allow managers to view orders', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should demonstrate role hierarchy through permissions endpoint', () => {
      return request(app.getHttpServer())
        .get('/users/permissions/check')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const permissions = res.body.data;

          // Vérifier les permissions spécifiques au manager
          expect(permissions.canManageOrders).toBe(true);
          expect(permissions.canTakeOrders).toBe(true);
          expect(permissions.canPrepareOrders).toBe(true);
          expect(permissions.canSuperviseRestaurant).toBe(true);
          expect(permissions.canManageUsers).toBe(true);

          // Vérifier que les permissions d'owner ne sont pas accordées
          expect(permissions.canCreateOwners).toBe(false);
          expect(permissions.canDeleteUsers).toBe(false);

          // Vérifier la description du rôle
          expect(permissions.roleDescription).toContain('manager');
        });
    });
  });

  describe('Protected Endpoints Access', () => {
    it('should allow authenticated access to dishes endpoints', async () => {
      // GET /dishes
      await request(app.getHttpServer())
        .get('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // POST /dishes
      const createResponse = await request(app.getHttpServer())
        .post('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Access Test Dish',
          price: 15.0,
          category: 'MAIN_COURSE',
          isAvailable: true,
        })
        .expect(201);

      const dishId = createResponse.body.data._id;

      // GET /dishes/:id
      await request(app.getHttpServer())
        .get(`/dishes/${dishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // PUT /dishes/:id
      await request(app.getHttpServer())
        .put(`/dishes/${dishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Access Test Dish',
          price: 18.0,
        })
        .expect(200);

      // DELETE /dishes/:id
      await request(app.getHttpServer())
        .delete(`/dishes/${dishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should allow authenticated access to orders endpoints', async () => {
      // Create a dish first for the order
      const dishResponse = await request(app.getHttpServer())
        .post('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Order Test Dish',
          price: 12.0,
          category: 'MAIN_COURSE',
          isAvailable: true,
        })
        .expect(201);

      const dishId = dishResponse.body.data._id;

      // GET /orders
      await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // POST /orders
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tableNumber: 5,
          dishes: [{ dish: dishId, quantity: 1 }],
          customer: 'mock-manager-id', // Using the manager as customer for simplicity
          status: 'PENDING',
        })
        .expect(201);

      const orderId = orderResponse.body.data._id;

      // GET /orders/:id
      await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // PUT /orders/:id
      await request(app.getHttpServer())
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'IN_PREPARATION',
        })
        .expect(200);
    });
  });

  describe('Business Logic Integration', () => {
    it('should demonstrate complete workflow with RBAC', async () => {
      // 1. Vérifier les permissions
      const permissionsResponse = await request(app.getHttpServer())
        .get('/users/permissions/check')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(permissionsResponse.body.data.role).toBe(UserRole.MANAGER);

      // 2. Créer un plat (manager peut le faire)
      const dishResponse = await request(app.getHttpServer())
        .post('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Workflow Test Dish',
          price: 25.0,
          category: 'MAIN_COURSE',
          isAvailable: true,
        })
        .expect(201);

      const dishId = dishResponse.body.data._id;

      // 3. Créer une commande (manager peut prendre des commandes)
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tableNumber: 8,
          dishes: [{ dish: dishId, quantity: 2 }],
          customer: 'mock-manager-id',
          status: 'PENDING',
        })
        .expect(201);

      const orderId = orderResponse.body.data._id;

      // 4. Gérer la commande (manager peut superviser)
      await request(app.getHttpServer())
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'IN_PREPARATION' })
        .expect(200);

      await request(app.getHttpServer())
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'READY' })
        .expect(200);

      await request(app.getHttpServer())
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'DELIVERED' })
        .expect(200);

      // 5. Vérifier l'état final
      const finalOrderResponse = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalOrderResponse.body.data.status).toBe('DELIVERED');
    });

    it('should handle error cases with proper RBAC', async () => {
      // Tenter d'accéder à un plat inexistant
      await request(app.getHttpServer())
        .get('/dishes/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Tenter de créer un plat avec des données invalides
      await request(app.getHttpServer())
        .post('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Nom vide invalide
          price: -10, // Prix négatif invalide
        })
        .expect(400);

      // Tenter d'accéder à une commande inexistante
      await request(app.getHttpServer())
        .get('/orders/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
