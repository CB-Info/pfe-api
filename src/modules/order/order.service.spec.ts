import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderRepository } from 'src/mongo/repositories/order.repository';
import { RestaurantTableRepository } from 'src/mongo/repositories/restaurant.table.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderStatus } from 'src/mongo/models/order.model';
import { OrderDTO, DishOrderDTO } from 'src/dto/order.dto';

// Mock data
const mockDishOrder: DishOrderDTO = {
  dishId: '507f1f77bcf86cd799439011',
  isPaid: false,
};

const mockOrder = {
  _id: '507f1f77bcf86cd799439012',
  tableNumberId: '507f1f77bcf86cd799439013',
  dishes: [mockDishOrder],
  status: OrderStatus.FINISH,
  totalPrice: 31.0,
  tips: 3.1,
  dateOfCreation: '2024-01-01',
  dateLastModified: '2024-01-01',
} as any;

const mockOrderDto: OrderDTO = {
  tableNumberId: '507f1f77bcf86cd799439013',
  dishes: [mockDishOrder],
  status: OrderStatus.FINISH,
  totalPrice: 31.0,
  tips: 3.1,
};

// Mock repository
const mockOrderRepository = {
  insert: jest.fn(),
  findAll: jest.fn(),
  findOneBy: jest.fn(),
  updateOneBy: jest.fn(),
  deleteOneBy: jest.fn(),
};

// Mock restaurant table repository
const mockRestaurantTableRepository = {
  findOneBy: jest.fn(),
};

// Mock notifications service
const mockNotificationsService = {
  emitOrderCreated: jest.fn(),
  emitOrderStatusUpdated: jest.fn(),
  emitOrderReadyToServe: jest.fn(),
};

describe('OrderService', () => {
  let service: OrderService;
  let repository: OrderRepository;
  let tableRepository: RestaurantTableRepository;
  let notificationsService: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: OrderRepository,
          useValue: mockOrderRepository,
        },
        {
          provide: RestaurantTableRepository,
          useValue: mockRestaurantTableRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get<OrderRepository>(OrderRepository);
    tableRepository = module.get<RestaurantTableRepository>(
      RestaurantTableRepository,
    );
    notificationsService =
      module.get<NotificationsService>(NotificationsService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOne', () => {
    it('should create an order successfully', async () => {
      const mockCreatedOrder = {
        _id: '507f1f77bcf86cd799439012',
        tableNumberId: '507f1f77bcf86cd799439013',
        dishes: [mockDishOrder],
        status: OrderStatus.FINISH,
        totalPrice: 31.0,
        tips: 3.1,
        dateOfCreation: '2024-01-01',
        dateLastModified: '2024-01-01',
      };

      const mockTable = {
        _id: '507f1f77bcf86cd799439013',
        number: 5,
      };

      mockOrderRepository.insert.mockResolvedValue(mockCreatedOrder);
      mockRestaurantTableRepository.findOneBy.mockResolvedValue(mockTable);

      const result = await service.createOne(mockOrderDto);

      expect(repository.insert).toHaveBeenCalledWith({
        tableNumberId: mockOrderDto.tableNumberId,
        dishes: mockOrderDto.dishes,
        status: mockOrderDto.status,
        totalPrice: mockOrderDto.totalPrice,
        tips: mockOrderDto.tips,
      });
      expect(tableRepository.findOneBy).toHaveBeenCalledWith({
        _id: mockOrderDto.tableNumberId,
      });
      expect(notificationsService.emitOrderCreated).toHaveBeenCalledWith(
        mockCreatedOrder,
        'Table 5',
      );
      // toObject() is now called in the repository, not in the service
      expect(result).toEqual({
        _id: '507f1f77bcf86cd799439012',
        tableNumberId: '507f1f77bcf86cd799439013',
        dishes: [mockDishOrder],
        status: OrderStatus.FINISH,
        totalPrice: 31.0,
        tips: 3.1,
        dateOfCreation: '2024-01-01',
        dateLastModified: '2024-01-01',
      });
    });

    it('should throw BadRequestException for validation errors', async () => {
      const validationError = new Error('Table number is required');
      validationError.name = 'ValidationError';
      mockOrderRepository.insert.mockRejectedValue(validationError);

      await expect(service.createOne(mockOrderDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockOrderRepository.insert.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.createOne(mockOrderDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle invalid dish data', async () => {
      const invalidOrderDto = {
        ...mockOrderDto,
        dishes: [{ ...mockDishOrder, dishId: '' }], // Invalid dishId
      };
      const validationError = new Error('DishId is required');
      validationError.name = 'ValidationError';
      mockOrderRepository.insert.mockRejectedValue(validationError);

      await expect(service.createOne(invalidOrderDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const expectedOrders = [mockOrder];
      mockOrderRepository.findAll.mockResolvedValue(expectedOrders);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedOrders);
    });

    it('should return empty array when no orders exist', async () => {
      mockOrderRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on repository error', async () => {
      mockOrderRepository.findAll.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('should return an order by ID', async () => {
      mockOrderRepository.findOneBy.mockResolvedValue(mockOrder);

      const result = await service.findOne('507f1f77bcf86cd799439012');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439012',
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrderRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Order with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      mockOrderRepository.findOneBy.mockRejectedValue(castError);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new BadRequestException('Invalid ID format'),
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockOrderRepository.findOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findOne('507f1f77bcf86cd799439012')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateOne', () => {
    it('should update an order successfully', async () => {
      const updateData = { status: OrderStatus.FINISH };
      const currentOrder = { ...mockOrder, status: OrderStatus.PENDING };
      const updatedOrder = { ...mockOrder, ...updateData };
      const mockTable = {
        _id: '507f1f77bcf86cd799439013',
        number: 5,
      };

      // Mock the initial findOne call (to get current order)
      mockOrderRepository.findOneBy.mockResolvedValueOnce(currentOrder);
      // Mock updateOneBy
      mockOrderRepository.updateOneBy.mockResolvedValue(true);
      // Mock the second findOne call (to get updated order)
      mockOrderRepository.findOneBy.mockResolvedValueOnce(updatedOrder);
      // Mock table lookup
      mockRestaurantTableRepository.findOneBy.mockResolvedValue(mockTable);

      const result = await service.updateOne(
        '507f1f77bcf86cd799439012',
        updateData,
      );

      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439012' },
        updateData,
      );
      expect(notificationsService.emitOrderStatusUpdated).toHaveBeenCalledWith(
        updatedOrder,
        'Table 5',
        OrderStatus.PENDING,
      );
      expect(result).toEqual(updatedOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      const updateData = { status: OrderStatus.FINISH };
      // Mock findOne to throw NotFoundException (called first in updateOne)
      mockOrderRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateOne('nonexistent', updateData),
      ).rejects.toThrow(
        new NotFoundException('Order with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException for update errors', async () => {
      const updateData = { status: OrderStatus.FINISH };
      const mockCurrentOrder = {
        _id: '507f1f77bcf86cd799439012',
        status: OrderStatus.PENDING,
        tableNumberId: '507f1f77bcf86cd799439013',
      };

      // Mock findOne to return current order
      mockOrderRepository.findOneBy.mockResolvedValue(mockCurrentOrder);

      const updateError = new Error('Unable to update order');
      mockOrderRepository.updateOneBy.mockRejectedValue(updateError);

      await expect(
        service.updateOne('507f1f77bcf86cd799439012', updateData),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const updateData = { status: OrderStatus.FINISH };
      mockOrderRepository.updateOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updateOne('507f1f77bcf86cd799439012', updateData),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle updating order with new dishes', async () => {
      const newDish: DishOrderDTO = {
        dishId: '507f1f77bcf86cd799439014',
        isPaid: true,
      };
      const updateData = {
        dishes: [mockDishOrder, newDish],
        totalPrice: 43.0,
      };
      const updatedOrder = { ...mockOrder, ...updateData };

      mockOrderRepository.updateOneBy.mockResolvedValue(true);
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedOrder as any);

      const result = await service.updateOne(
        '507f1f77bcf86cd799439012',
        updateData,
      );

      expect(result.dishes).toHaveLength(2);
      expect(result.totalPrice).toBe(43.0);
    });
  });

  describe('deleteOne', () => {
    it('should delete an order successfully', async () => {
      mockOrderRepository.deleteOneBy.mockResolvedValue(true);

      await expect(
        service.deleteOne('507f1f77bcf86cd799439012'),
      ).resolves.toBeUndefined();

      expect(repository.deleteOneBy).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439012',
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrderRepository.deleteOneBy.mockResolvedValue(false);

      await expect(service.deleteOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Order with ID nonexistent not found'),
      );
    });

    it('should throw InternalServerErrorException for repository errors', async () => {
      mockOrderRepository.deleteOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.deleteOne('507f1f77bcf86cd799439012'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle deletion of orders with active status', async () => {
      const activeOrderError = new Error('Cannot delete active order');
      mockOrderRepository.deleteOneBy.mockRejectedValue(activeOrderError);

      await expect(
        service.deleteOne('507f1f77bcf86cd799439012'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
