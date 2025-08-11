import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { OrderController } from '../src/modules/order/order.controller';
import { OrderService } from '../src/modules/order/order.service';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;

  const mockOrder = {
    _id: '1',
    tableNumber: 1,
    dishes: [],
    status: 'NEW',
  } as any;
  const orderServiceMock = {
    findAll: jest.fn().mockResolvedValue([mockOrder]),
    createOne: jest.fn().mockResolvedValue(mockOrder),
  } as Partial<OrderService> as OrderService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: orderServiceMock }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /orders returns list', async () => {
    await request(app.getHttpServer())
      .get('/orders')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
      });
  });

  it('POST /orders creates an order', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ tableNumber: 1, dishes: [] })
      .expect(201)
      .expect(({ body }) => {
        expect(body.data).toBeDefined();
      });
  });
});
