import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderStatus } from 'src/mongo/models/order.model';
import { OrderDTO } from 'src/dto/order.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  const mockOrderService = {
    createOne: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockOrder = {
    _id: 'order123',
    tableNumberId: 'table456',
    dishes: [
      {
        dishId: 'dish123',
        isPaid: false,
      },
      {
        dishId: 'dish456',
        isPaid: true,
      },
    ],
    status: OrderStatus.FINISH,
    totalPrice: 35.97,
    tips: 5.00,
    dateOfCreation: '2024-01-01T10:00:00Z',
    dateLastModified: '2024-01-01T10:00:00Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOne', () => {
    const orderDto: OrderDTO = {
      tableNumberId: 'table456',
      dishes: [
        {
          dishId: 'dish123',
          isPaid: false,
        },
        {
          dishId: 'dish456',
          isPaid: true,
        },
      ],
      status: OrderStatus.FINISH,
      totalPrice: 35.97,
      tips: 5.00,
    };

    it('should create a new order successfully', async () => {
      mockOrderService.createOne.mockResolvedValue(mockOrder);

      const result = await controller.createOne(orderDto);

      expect(service.createOne).toHaveBeenCalledWith(orderDto);
      expect(result).toEqual({ error: '', data: mockOrder });
    });

    it('should handle creation errors', async () => {
      mockOrderService.createOne.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.createOne(orderDto)).rejects.toThrow('Creation failed');
    });

    it('should create order with minimal data', async () => {
      const minimalOrderDto: OrderDTO = {
        tableNumberId: 'table123',
        dishes: [
          {
            dishId: 'dish123',
            isPaid: false,
          },
        ],
        status: OrderStatus.FINISH,
        totalPrice: 12.99,
        tips: 0,
      };

      const minimalOrder = {
        ...mockOrder,
        ...minimalOrderDto,
        _id: 'order456',
      };

      mockOrderService.createOne.mockResolvedValue(minimalOrder);

      const result = await controller.createOne(minimalOrderDto);

      expect(result.data.tableNumberId).toBe('table123');
      expect(result.data.dishes).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const orders = [mockOrder];
      mockOrderService.findAll.mockResolvedValue(orders);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({ error: '', data: orders });
    });

    it('should return empty array when no orders found', async () => {
      mockOrderService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual({ error: '', data: [] });
    });

    it('should handle service errors', async () => {
      mockOrderService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return a single order by ID', async () => {
      mockOrderService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne({ id: 'order123' });

      expect(service.findOne).toHaveBeenCalledWith('order123');
      expect(result).toEqual({ error: '', data: mockOrder });
    });

    it('should handle not found errors', async () => {
      mockOrderService.findOne.mockRejectedValue(new Error('Order not found'));

      await expect(controller.findOne({ id: 'nonexistent' })).rejects.toThrow('Order not found');
    });

    it('should handle invalid ID format', async () => {
      mockOrderService.findOne.mockRejectedValue(new Error('Invalid ID format'));

      await expect(controller.findOne({ id: 'invalid-id' })).rejects.toThrow('Invalid ID format');
    });
  });

  describe('updateOne', () => {
    const updateData = {
      status: OrderStatus.FINISH,
      totalPrice: 42.99,
    };

    it('should update an order successfully', async () => {
      const updatedOrder = { ...mockOrder, ...updateData };
      mockOrderService.updateOne.mockResolvedValue(updatedOrder);

      const result = await controller.updateOne({ id: 'order123' }, updateData);

      expect(service.updateOne).toHaveBeenCalledWith('order123', updateData);
      expect(result).toEqual({ error: '', data: updatedOrder });
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { status: OrderStatus.FINISH };
      const partiallyUpdatedOrder = { ...mockOrder, status: OrderStatus.FINISH };
      
      mockOrderService.updateOne.mockResolvedValue(partiallyUpdatedOrder);

      const result = await controller.updateOne({ id: 'order123' }, partialUpdate);

      expect(service.updateOne).toHaveBeenCalledWith('order123', partialUpdate);
      expect(result.data.status).toBe(OrderStatus.FINISH);
    });

    it('should handle update errors', async () => {
      mockOrderService.updateOne.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updateOne({ id: 'order123' }, updateData)).rejects.toThrow('Update failed');
    });

    it('should handle updating dishes array', async () => {
      const dishUpdateData = {
        dishes: [
          {
            dishId: 'dish789',
            isPaid: true,
          },
        ],
      };

      const updatedOrder = { ...mockOrder, dishes: dishUpdateData.dishes };
      mockOrderService.updateOne.mockResolvedValue(updatedOrder);

      const result = await controller.updateOne({ id: 'order123' }, dishUpdateData);

      expect(result.data.dishes).toHaveLength(1);
      expect(result.data.dishes[0].dishId).toBe('dish789');
      expect(result.data.dishes[0].isPaid).toBe(true);
    });
  });

  describe('deleteOne', () => {
    it('should delete an order successfully', async () => {
      mockOrderService.deleteOne.mockResolvedValue(undefined);

      await controller.deleteOne({ id: 'order123' });

      expect(service.deleteOne).toHaveBeenCalledWith('order123');
    });

    it('should handle deletion errors', async () => {
      mockOrderService.deleteOne.mockRejectedValue(new Error('Deletion failed'));

      await expect(controller.deleteOne({ id: 'order123' })).rejects.toThrow('Deletion failed');
    });

    it('should handle deleting non-existent order', async () => {
      mockOrderService.deleteOne.mockRejectedValue(new Error('Order not found'));

      await expect(controller.deleteOne({ id: 'nonexistent' })).rejects.toThrow('Order not found');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed parameters', async () => {
      await expect(controller.findOne(null)).rejects.toThrow('Cannot read properties of null');
      
      mockOrderService.findOne.mockRejectedValue(new Error('Invalid parameters'));
      await expect(controller.findOne({})).rejects.toThrow('Invalid parameters');
    });

    it('should handle empty body for create', async () => {
      mockOrderService.createOne.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.createOne({} as OrderDTO)).rejects.toThrow('Validation failed');
    });

    it('should handle null update data', async () => {
      mockOrderService.updateOne.mockRejectedValue(new Error('No data provided'));

      await expect(controller.updateOne({ id: 'order123' }, null)).rejects.toThrow('No data provided');
    });

    it('should handle service returning null', async () => {
      mockOrderService.findOne.mockResolvedValue(null);

      const result = await controller.findOne({ id: 'order123' });

      expect(result).toEqual({ error: '', data: null });
    });
  });
});