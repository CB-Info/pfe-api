import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { OrderStatus } from '../../mongo/models/order.model';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should emit order created notification', () => {
    const mockOrder = {
      _id: '507f1f77bcf86cd799439012',
      tableNumberId: '507f1f77bcf86cd799439013',
      dishes: [],
      status: OrderStatus.PENDING,
      totalPrice: 31.0,
      tips: 3.1,
      dateOfCreation: '2024-01-01',
    } as any;

    const tableNumber = 'Table 5';

    // This should not throw
    expect(() => {
      service.emitOrderCreated(mockOrder, tableNumber);
    }).not.toThrow();
  });

  it('should get clients count', () => {
    const count = service.getClientsCount();
    expect(count).toEqual({
      kitchen: 0,
      service: 0,
      total: 0,
    });
  });
});
