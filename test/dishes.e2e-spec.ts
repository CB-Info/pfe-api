import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { FirebaseTokenGuard } from '../src/guards/firebase-token.guard';
import { UserRole } from '../src/mongo/models/user.model';

describe('Dishes E2E Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let dishId: string;

  beforeAll(async () => {
    // Démarrer MongoDB en mémoire pour les tests E2E
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

          // Mock user pour les tests
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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('GET /dishes', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/dishes')
        .expect(403)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Forbidden resource');
        });
    });

    it('should return empty array when no dishes exist', () => {
      return request(app.getHttpServer())
        .get('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('POST /dishes', () => {
    it('should require authentication for dish creation', () => {
      return request(app.getHttpServer())
        .post('/dishes')
        .send({
          name: 'Test Dish E2E',
          price: 15.99,
          category: 'MAIN_DISHES',
          ingredients: [],
          description: 'Test dish for E2E testing',
          isAvailable: true,
        })
        .expect(403);
    });

    it('should validate dish data structure', () => {
      return request(app.getHttpServer())
        .post('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid: empty name
          price: -5, // Invalid: negative price
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errorCode');
        });
    });

    it('should create a dish with valid data and authentication', () => {
      const dishData = {
        name: 'E2E Test Burger',
        price: 12.5,
        category: 'MAIN_DISHES',
        ingredients: [],
        isAvailable: true,
        description: 'A delicious test burger for E2E testing',
      };

      return request(app.getHttpServer())
        .post('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dishData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('_id');
          expect(res.body.data.name).toBe(dishData.name);
          expect(res.body.data.price).toBe(dishData.price);

          // Sauvegarder l'ID pour les tests suivants
          dishId = res.body.data._id;
        });
    });
  });

  describe('GET /dishes/:id', () => {
    it('should retrieve a specific dish by ID', () => {
      return request(app.getHttpServer())
        .get(`/dishes/${dishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data._id).toBe(dishId);
          expect(res.body.data.name).toBe('E2E Test Burger');
        });
    });

    it('should return 404 for non-existent dish', () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      return request(app.getHttpServer())
        .get(`/dishes/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('errorCode', 'NOT_FOUND');
        });
    });

    it('should return 400 for invalid dish ID format', () => {
      return request(app.getHttpServer())
        .get('/dishes/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errorCode');
        });
    });
  });

  describe('PUT /dishes/:id', () => {
    it('should update a dish with valid data', () => {
      const updateData = {
        name: 'Updated E2E Burger',
        price: 14.99,
        isAvailable: false,
      };

      return request(app.getHttpServer())
        .put(`/dishes/${dishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('error', '');
          expect(res.body.data.name).toBe(updateData.name);
          expect(res.body.data.price).toBe(updateData.price);
          expect(res.body.data.isAvailable).toBe(updateData.isAvailable);
        });
    });

    it('should validate update data', () => {
      return request(app.getHttpServer())
        .put(`/dishes/${dishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          price: 'invalid-price', // Invalid type
        })
        .expect(400);
    });
  });

  describe('DELETE /dishes/:id', () => {
    it('should delete a dish by ID', () => {
      return request(app.getHttpServer())
        .delete(`/dishes/${dishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 when trying to delete non-existent dish', () => {
      return request(app.getHttpServer())
        .delete(`/dishes/${dishId}`) // Already deleted
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Dish Workflow E2E', () => {
    it('should complete full dish lifecycle', async () => {
      // 1. Créer un plat
      const createResponse = await request(app.getHttpServer())
        .post('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Workflow Test Dish',
          price: 18.0,
          category: 'DESSERT',
          isAvailable: true,
        })
        .expect(201);

      const newDishId = createResponse.body.data._id;

      // 2. Récupérer le plat
      await request(app.getHttpServer())
        .get(`/dishes/${newDishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.name).toBe('Workflow Test Dish');
        });

      // 3. Mettre à jour le plat
      await request(app.getHttpServer())
        .put(`/dishes/${newDishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isAvailable: false,
          price: 20.0,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.isAvailable).toBe(false);
          expect(res.body.data.price).toBe(20.0);
        });

      // 4. Vérifier que le plat est dans la liste
      await request(app.getHttpServer())
        .get('/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const dish = res.body.data.find((d) => d._id === newDishId);
          expect(dish).toBeDefined();
          expect(dish.isAvailable).toBe(false);
        });

      // 5. Supprimer le plat
      await request(app.getHttpServer())
        .delete(`/dishes/${newDishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // 6. Vérifier que le plat n'existe plus
      await request(app.getHttpServer())
        .get(`/dishes/${newDishId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
