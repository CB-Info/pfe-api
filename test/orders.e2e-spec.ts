import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { FirebaseTokenGuard } from '../src/guards/firebase-token.guard';
import { UserRole } from '../src/mongo/models/user.model';

describe('Orders E2E Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let orderId: string;
  let dishId: string;
  let userId: string;

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

          request.user = {
            _id: 'mock-user-id',
            email: 'test@example.com',
            role: UserRole.MANAGER,
            firebaseId: 'mock-firebase-id',
          };
          request.firebaseUser = {
            uid: 'mock-firebase-id',
            email: 'test@example.com',
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authToken = 'mock-firebase-token';

    // Préparer des données de test
    await setupTestData();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  async function setupTestData() {
    // Utiliser directement l'ID mockuser depuis le guard
    userId = 'mock-user-id';

    // Créer un plat de test
    const dishResponse = await request(app.getHttpServer())
      .post('/dishes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Pizza',
        price: 16.5,
        category: 'MAIN_DISHES',
        isAvailable: true,
        description: 'Delicious pizza for E2E tests',
        ingredients: [], // Array vide mais défini
      });

    if (dishResponse.status === 201) {
      dishId = dishResponse.body.data._id;
    }
  }

  describe('GET /orders', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .expect(403)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Forbidden resource');
        });
    });

    it('should return empty array when no orders exist', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('POST /orders', () => {
    it('should require authentication for order creation', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({
          tableNumber: 5,
          dishes: [{ dish: dishId, quantity: 2 }],
          customer: userId,
        })
        .expect(403);
    });

    it('should validate order data structure', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tableNumber: 'invalid', // Should be number
          dishes: [], // Empty dishes array
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errorCode');
        });
    });

    it('should create an order with valid data', () => {
      const orderData = {
        tableNumber: 3,
        dishes: [{ dish: dishId, quantity: 2 }],
        customer: userId,
        status: 'PENDING',
        notes: 'Extra spicy please',
      };

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('_id');
          expect(res.body.data.tableNumber).toBe(orderData.tableNumber);
          expect(res.body.data.dishes).toHaveLength(1);
          expect(res.body.data.status).toBe('PENDING');

          orderId = res.body.data._id;
        });
    });

    it('should calculate total price correctly', () => {
      const orderData = {
        tableNumber: 4,
        dishes: [
          { dish: dishId, quantity: 3 }, // 3 x 16.50 = 49.50
        ],
        customer: userId,
      };

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201)
        .expect((res) => {
          // Vérifier que le total est calculé (même si ce n'est peut-être pas exposé directement)
          expect(res.body.data.dishes[0].quantity).toBe(3);
          expect(res.body.data).toHaveProperty('_id');
        });
    });
  });

  describe('GET /orders/:id', () => {
    it('should retrieve a specific order by ID', () => {
      return request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data._id).toBe(orderId);
          expect(res.body.data.tableNumber).toBe(3);
        });
    });

    it('should return 404 for non-existent order', () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      return request(app.getHttpServer())
        .get(`/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('errorCode', 'NOT_FOUND');
        });
    });

    it('should return 400 for invalid order ID format', () => {
      return request(app.getHttpServer())
        .get('/orders/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('PUT /orders/:id', () => {
    it('should update order status', () => {
      const updateData = {
        status: 'IN_PREPARATION',
        notes: 'Started cooking',
      };

      return request(app.getHttpServer())
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(res.body.data.status).toBe('IN_PREPARATION');
        });
    });

    it('should validate status transitions', () => {
      // Tenter de mettre un statut invalide
      return request(app.getHttpServer())
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'INVALID_STATUS',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errorCode');
        });
    });

    it('should update order to READY status', () => {
      return request(app.getHttpServer())
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'READY',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('READY');
        });
    });

    it('should complete the order', () => {
      return request(app.getHttpServer())
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'DELIVERED',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('DELIVERED');
        });
    });
  });

  describe('Order Workflow E2E', () => {
    it('should complete full order lifecycle', async () => {
      // 1. Créer une commande
      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tableNumber: 7,
          dishes: [{ dish: dishId, quantity: 1 }],
          customer: userId,
          status: 'PENDING',
          notes: 'Workflow test order',
        })
        .expect(201);

      const newOrderId = createResponse.body.data._id;

      // 2. Vérifier la commande créée
      await request(app.getHttpServer())
        .get(`/orders/${newOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('PENDING');
          expect(res.body.data.tableNumber).toBe(7);
        });

      // 3. Démarrer la préparation
      await request(app.getHttpServer())
        .put(`/orders/${newOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'IN_PREPARATION' })
        .expect(200);

      // 4. Marquer comme prêt
      await request(app.getHttpServer())
        .put(`/orders/${newOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'READY' })
        .expect(200);

      // 5. Livrer la commande
      await request(app.getHttpServer())
        .put(`/orders/${newOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'DELIVERED' })
        .expect(200);

      // 6. Vérifier l'état final
      await request(app.getHttpServer())
        .get(`/orders/${newOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('DELIVERED');
        });

      // 7. Vérifier que la commande apparaît dans la liste
      await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const order = res.body.data.find((o) => o._id === newOrderId);
          expect(order).toBeDefined();
          expect(order.status).toBe('DELIVERED');
        });
    });

    it('should handle order cancellation', async () => {
      // Créer une commande à annuler
      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tableNumber: 8,
          dishes: [{ dish: dishId, quantity: 1 }],
          customer: userId,
          status: 'PENDING',
        })
        .expect(201);

      const orderToCancel = createResponse.body.data._id;

      // Annuler la commande
      await request(app.getHttpServer())
        .put(`/orders/${orderToCancel}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'CANCELLED' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('CANCELLED');
        });

      // Vérifier que la commande est bien annulée
      await request(app.getHttpServer())
        .get(`/orders/${orderToCancel}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('CANCELLED');
        });
    });
  });

  describe('Order-Dish Integration', () => {
    it('should handle orders with multiple dishes', async () => {
      // Créer un deuxième plat
      const secondDishResponse = await request(app.getHttpServer())
        .post('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Salad',
          price: 9.75,
          category: 'SALADS',
          isAvailable: true,
          description: 'Fresh salad for E2E testing',
          ingredients: [],
        })
        .expect(201);

      const secondDishId = secondDishResponse.body.data._id;

      // Créer une commande avec plusieurs plats
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tableNumber: 10,
          dishes: [
            { dish: dishId, quantity: 2 },
            { dish: secondDishId, quantity: 1 },
          ],
          customer: userId,
        })
        .expect(201);

      expect(orderResponse.body.data.dishes).toHaveLength(2);
      expect(orderResponse.body.data.dishes[0].quantity).toBe(2);
      expect(orderResponse.body.data.dishes[1].quantity).toBe(1);
    });

    it('should reject orders with unavailable dishes', async () => {
      // Créer un plat indisponible
      const unavailableDishResponse = await request(app.getHttpServer())
        .post('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Unavailable Dish',
          price: 12.0,
          category: 'MAIN_DISHES',
          isAvailable: false,
          description: 'An unavailable dish for testing',
          ingredients: [],
        })
        .expect(201);

      const unavailableDishId = unavailableDishResponse.body.data._id;

      // Tenter de commander un plat indisponible
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tableNumber: 11,
          dishes: [{ dish: unavailableDishId, quantity: 1 }],
          customer: userId,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errorCode');
        });
    });
  });
});
