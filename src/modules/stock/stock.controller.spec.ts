import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockDTO, IngredientItemDTO } from 'src/dto/stock.dto';

// Mock data
const mockIngredientItem: IngredientItemDTO = {
  ingredientId: '507f1f77bcf86cd799439011',
  currentQuantity: 100,
  minimalQuantity: 10,
  dateAddedToStock: '2024-01-01',
  dateLastModified: '2024-01-01',
};

const mockStock = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Stock Principal',
  ingredients: [mockIngredientItem],
  dateOfCreation: '2024-01-01',
  dateLastModified: '2024-01-01',
} as any;

const mockStockDto: StockDTO = {
  name: 'Nouveau Stock',
  ingredients: [mockIngredientItem],
};

// Mock service
const mockStockService = {
  createOne: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
};

describe('StockController', () => {
  let controller: StockController;
  let service: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: mockStockService,
        },
      ],
    }).compile();

    controller = module.get<StockController>(StockController);
    service = module.get<StockService>(StockService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOne', () => {
    it('should create a stock successfully', async () => {
      const createdStock = { ...mockStock, ...mockStockDto };
      mockStockService.createOne.mockResolvedValue(createdStock);

      const result = await controller.createOne(mockStockDto);

      expect(service.createOne).toHaveBeenCalledWith(mockStockDto);
      expect(result).toEqual({
        error: '',
        data: createdStock,
      });
    });

    it('should handle service errors during creation', async () => {
      mockStockService.createOne.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(controller.createOne(mockStockDto)).rejects.toThrow(
        'Creation failed',
      );
    });

    it('should handle validation errors', async () => {
      const invalidStockDto = { ...mockStockDto, name: '' }; // Invalid name
      mockStockService.createOne.mockRejectedValue(
        new Error('Name is required'),
      );

      await expect(controller.createOne(invalidStockDto)).rejects.toThrow(
        'Name is required',
      );
    });
  });

  describe('findAll', () => {
    it('should return all stocks', async () => {
      const expectedStocks = [mockStock];
      mockStockService.findAll.mockResolvedValue(expectedStocks);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        error: '',
        data: expectedStocks,
      });
    });

    it('should return empty array when no stocks exist', async () => {
      mockStockService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual({
        error: '',
        data: [],
      });
    });

    it('should handle service errors', async () => {
      mockStockService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return a single stock by ID', async () => {
      mockStockService.findOne.mockResolvedValue(mockStock);

      const result = await controller.findOne({
        id: '507f1f77bcf86cd799439012',
      });

      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(result).toEqual({
        error: '',
        data: mockStock,
      });
    });

    it('should handle stock not found', async () => {
      mockStockService.findOne.mockRejectedValue(new Error('Stock not found'));

      await expect(controller.findOne({ id: 'nonexistent' })).rejects.toThrow(
        'Stock not found',
      );
    });

    it('should handle invalid ID format', async () => {
      mockStockService.findOne.mockRejectedValue(
        new Error('Invalid ID format'),
      );

      await expect(controller.findOne({ id: 'invalid' })).rejects.toThrow(
        'Invalid ID format',
      );
    });
  });

  describe('updateOne', () => {
    it('should update a stock successfully', async () => {
      const updateData = { name: 'Updated Stock' };
      const updatedStock = { ...mockStock, ...updateData };
      mockStockService.updateOne.mockResolvedValue(updatedStock);

      const result = await controller.updateOne(
        { id: '507f1f77bcf86cd799439012' },
        updateData,
      );

      expect(service.updateOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        updateData,
      );
      expect(result).toEqual({
        error: '',
        data: updatedStock,
      });
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        ingredients: [
          {
            ...mockIngredientItem,
            currentQuantity: 150, // Updated quantity
          },
        ],
      };
      const updatedStock = { ...mockStock, ...partialUpdate };
      mockStockService.updateOne.mockResolvedValue(updatedStock);

      const result = await controller.updateOne(
        { id: '507f1f77bcf86cd799439012' },
        partialUpdate,
      );

      expect(service.updateOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        partialUpdate,
      );
      expect(result).toEqual({
        error: '',
        data: updatedStock,
      });
    });

    it('should handle update errors', async () => {
      const updateData = { name: 'Updated Stock' };
      mockStockService.updateOne.mockRejectedValue(new Error('Update failed'));

      await expect(
        controller.updateOne({ id: '507f1f77bcf86cd799439012' }, updateData),
      ).rejects.toThrow('Update failed');
    });

    it('should handle stock not found during update', async () => {
      const updateData = { name: 'Updated Stock' };
      mockStockService.updateOne.mockRejectedValue(
        new Error('Stock with ID nonexistent not found'),
      );

      await expect(
        controller.updateOne({ id: 'nonexistent' }, updateData),
      ).rejects.toThrow('Stock with ID nonexistent not found');
    });
  });

  describe('deleteOne', () => {
    it('should delete a stock successfully', async () => {
      mockStockService.deleteOne.mockResolvedValue(undefined);

      await expect(
        controller.deleteOne({ id: '507f1f77bcf86cd799439012' }),
      ).resolves.toBeUndefined();

      expect(service.deleteOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
      );
    });

    it('should handle deletion errors', async () => {
      mockStockService.deleteOne.mockRejectedValue(
        new Error('Deletion failed'),
      );

      await expect(
        controller.deleteOne({ id: '507f1f77bcf86cd799439012' }),
      ).rejects.toThrow('Deletion failed');
    });

    it('should handle stock not found during deletion', async () => {
      mockStockService.deleteOne.mockRejectedValue(
        new Error('Stock with ID nonexistent not found'),
      );

      await expect(controller.deleteOne({ id: 'nonexistent' })).rejects.toThrow(
        'Stock with ID nonexistent not found',
      );
    });

    it('should handle invalid ID format during deletion', async () => {
      mockStockService.deleteOne.mockRejectedValue(
        new Error('Invalid ID format'),
      );

      await expect(controller.deleteOne({ id: 'invalid-id' })).rejects.toThrow(
        'Invalid ID format',
      );
    });

    it('should handle database errors during deletion', async () => {
      mockStockService.deleteOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        controller.deleteOne({ id: '507f1f77bcf86cd799439012' }),
      ).rejects.toThrow('Database connection failed');
    });
  });
});
