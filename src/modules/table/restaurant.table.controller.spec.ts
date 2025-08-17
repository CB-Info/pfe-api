import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantTableController } from './restaurant.table.controller';
import { RestaurantTableService } from './restaurant.table.service';
import { RestaurantTableDTO } from 'src/dto/restaurant.table.dto';

// Mock data
const mockTable = {
  _id: '507f1f77bcf86cd799439011',
  number: 1,
} as any;

const mockTableDto: RestaurantTableDTO = {
  number: 2,
};

// Mock service
const mockTableService = {
  createOne: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
};

describe('RestaurantTableController', () => {
  let controller: RestaurantTableController;
  let service: RestaurantTableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantTableController],
      providers: [
        {
          provide: RestaurantTableService,
          useValue: mockTableService,
        },
      ],
    }).compile();

    controller = module.get<RestaurantTableController>(
      RestaurantTableController,
    );
    service = module.get<RestaurantTableService>(RestaurantTableService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOne', () => {
    it('should create a table successfully', async () => {
      const createdTable = { ...mockTable, number: mockTableDto.number };
      mockTableService.createOne.mockResolvedValue(createdTable);

      const result = await controller.createOne(mockTableDto);

      expect(service.createOne).toHaveBeenCalledWith(mockTableDto);
      expect(result).toEqual({
        error: '',
        data: createdTable,
      });
    });

    it('should handle service errors during creation', async () => {
      mockTableService.createOne.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(controller.createOne(mockTableDto)).rejects.toThrow(
        'Creation failed',
      );
    });

    it('should handle validation errors', async () => {
      const invalidTableDto = { ...mockTableDto, number: 'invalid' as any }; // Invalid number
      mockTableService.createOne.mockRejectedValue(
        new Error('Number must be a valid integer'),
      );

      await expect(controller.createOne(invalidTableDto)).rejects.toThrow(
        'Number must be a valid integer',
      );
    });

    it('should handle duplicate table numbers', async () => {
      mockTableService.createOne.mockRejectedValue(
        new Error('Table number already exists'),
      );

      await expect(controller.createOne(mockTableDto)).rejects.toThrow(
        'Table number already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return all tables', async () => {
      const expectedTables = [mockTable];
      mockTableService.findAll.mockResolvedValue(expectedTables);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        error: '',
        data: expectedTables,
      });
    });

    it('should return empty array when no tables exist', async () => {
      mockTableService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual({
        error: '',
        data: [],
      });
    });

    it('should handle service errors', async () => {
      mockTableService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return a single table by ID', async () => {
      mockTableService.findOne.mockResolvedValue(mockTable);

      const result = await controller.findOne({
        id: '507f1f77bcf86cd799439011',
      });

      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual({
        error: '',
        data: mockTable,
      });
    });

    it('should handle table not found', async () => {
      mockTableService.findOne.mockRejectedValue(new Error('Table not found'));

      await expect(controller.findOne({ id: 'nonexistent' })).rejects.toThrow(
        'Table not found',
      );
    });

    it('should handle invalid ID format', async () => {
      mockTableService.findOne.mockRejectedValue(
        new Error('Invalid ID format'),
      );

      await expect(controller.findOne({ id: 'invalid' })).rejects.toThrow(
        'Invalid ID format',
      );
    });

    it('should handle various ID formats', async () => {
      const testCases = [
        { id: '507f1f77bcf86cd799439011', description: 'Valid ObjectId' },
        { id: '123', description: 'Short ID' },
        { id: '', description: 'Empty ID' },
      ];

      for (const testCase of testCases) {
        mockTableService.findOne.mockResolvedValue(mockTable);

        const result = await controller.findOne({ id: testCase.id });

        expect(service.findOne).toHaveBeenCalledWith(testCase.id);
        expect(result).toEqual({
          error: '',
          data: mockTable,
        });
      }
    });
  });

  describe('updateOne', () => {
    it('should update a table successfully', async () => {
      const updateData = { number: 5 };
      const updatedTable = { ...mockTable, ...updateData };
      mockTableService.updateOne.mockResolvedValue(updatedTable);

      const result = await controller.updateOne(
        { id: '507f1f77bcf86cd799439011' },
        updateData,
      );

      expect(service.updateOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateData,
      );
      expect(result).toEqual({
        error: '',
        data: updatedTable,
      });
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { number: 10 };
      const updatedTable = { ...mockTable, ...partialUpdate };
      mockTableService.updateOne.mockResolvedValue(updatedTable);

      const result = await controller.updateOne(
        { id: '507f1f77bcf86cd799439011' },
        partialUpdate,
      );

      expect(service.updateOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        partialUpdate,
      );
      expect(result).toEqual({
        error: '',
        data: updatedTable,
      });
    });

    it('should handle update errors', async () => {
      const updateData = { number: 5 };
      mockTableService.updateOne.mockRejectedValue(new Error('Update failed'));

      await expect(
        controller.updateOne({ id: '507f1f77bcf86cd799439011' }, updateData),
      ).rejects.toThrow('Update failed');
    });

    it('should handle table not found during update', async () => {
      const updateData = { number: 5 };
      mockTableService.updateOne.mockRejectedValue(
        new Error('Table with ID nonexistent not found'),
      );

      await expect(
        controller.updateOne({ id: 'nonexistent' }, updateData),
      ).rejects.toThrow('Table with ID nonexistent not found');
    });

    it('should handle invalid number values', async () => {
      const updateData = { number: -1 }; // Negative number
      mockTableService.updateOne.mockRejectedValue(
        new Error('Table number must be positive'),
      );

      await expect(
        controller.updateOne({ id: '507f1f77bcf86cd799439011' }, updateData),
      ).rejects.toThrow('Table number must be positive');
    });
  });

  describe('deleteOne', () => {
    it('should delete a table successfully', async () => {
      mockTableService.deleteOne.mockResolvedValue(undefined);

      await expect(
        controller.deleteOne({ id: '507f1f77bcf86cd799439011' }),
      ).resolves.toBeUndefined();

      expect(service.deleteOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('should handle deletion errors', async () => {
      mockTableService.deleteOne.mockRejectedValue(
        new Error('Deletion failed'),
      );

      await expect(
        controller.deleteOne({ id: '507f1f77bcf86cd799439011' }),
      ).rejects.toThrow('Deletion failed');
    });

    it('should handle table not found during deletion', async () => {
      mockTableService.deleteOne.mockRejectedValue(
        new Error('Table with ID nonexistent not found'),
      );

      await expect(controller.deleteOne({ id: 'nonexistent' })).rejects.toThrow(
        'Table with ID nonexistent not found',
      );
    });

    it('should handle invalid ID format during deletion', async () => {
      mockTableService.deleteOne.mockRejectedValue(
        new Error('Invalid ID format'),
      );

      await expect(controller.deleteOne({ id: 'invalid-id' })).rejects.toThrow(
        'Invalid ID format',
      );
    });

    it('should handle foreign key constraints', async () => {
      mockTableService.deleteOne.mockRejectedValue(
        new Error('Cannot delete table with active orders'),
      );

      await expect(
        controller.deleteOne({ id: '507f1f77bcf86cd799439011' }),
      ).rejects.toThrow('Cannot delete table with active orders');
    });

    it('should handle database connection errors', async () => {
      mockTableService.deleteOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        controller.deleteOne({ id: '507f1f77bcf86cd799439011' }),
      ).rejects.toThrow('Database connection failed');
    });
  });
});
