import { Test, TestingModule } from '@nestjs/testing';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';
import { UserRepository } from 'src/mongo/repositories/user.repository';
import { IngredientDTO } from 'src/dto/creation/ingredient.dto';

// Mock Firebase config to prevent credentials.json error
jest.mock('src/configs/firebase.config', () => ({
  __esModule: true,
  default: {
    auth: () => ({
      verifyIdToken: jest.fn(),
      getUser: jest.fn(),
    }),
  },
}));

// Mock data
const mockIngredient = {
  _id: 'ingredient123',
  name: 'Tomato',
  dateOfCreation: '2024-01-01',
  dateLastModified: '2024-01-01',
} as any;

const mockIngredientDto: IngredientDTO = {
  name: 'Carrot',
};

// Mock service
const mockIngredientService = {
  findByName: jest.fn(),
  createOne: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
};

describe('IngredientController', () => {
  let controller: IngredientController;
  let service: IngredientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngredientController],
      providers: [
        {
          provide: IngredientService,
          useValue: mockIngredientService,
        },
        {
          provide: UserRepository,
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: 'UserModel',
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<IngredientController>(IngredientController);
    service = module.get<IngredientService>(IngredientService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOne', () => {
    it('should create an ingredient successfully', async () => {
      const createdIngredient = { ...mockIngredient, ...mockIngredientDto };
      mockIngredientService.createOne.mockResolvedValue(createdIngredient);

      const result = await controller.createOne(mockIngredientDto);

      expect(service.createOne).toHaveBeenCalledWith(mockIngredientDto);
      expect(result).toEqual({
        error: '',
        data: createdIngredient,
      });
    });

    it('should handle service errors', async () => {
      mockIngredientService.createOne.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(controller.createOne(mockIngredientDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('searchIngredients', () => {
    it('should search ingredients by name', async () => {
      const searchTerm = 'tom';
      const expectedIngredients = [mockIngredient];
      mockIngredientService.findByName.mockResolvedValue(expectedIngredients);

      const result = await controller.searchIngredients(searchTerm);

      expect(service.findByName).toHaveBeenCalledWith(searchTerm);
      expect(result).toEqual({
        error: '',
        data: expectedIngredients,
      });
    });

    it('should return empty array when no ingredients found', async () => {
      const searchTerm = 'nonexistent';
      mockIngredientService.findByName.mockResolvedValue([]);

      const result = await controller.searchIngredients(searchTerm);

      expect(result).toEqual({
        error: '',
        data: [],
      });
    });

    it('should handle service errors during search', async () => {
      const searchTerm = 'test';
      mockIngredientService.findByName.mockRejectedValue(
        new Error('Search failed'),
      );

      await expect(controller.searchIngredients(searchTerm)).rejects.toThrow(
        'Search failed',
      );
    });
  });

  describe('findAll', () => {
    it('should return all ingredients', async () => {
      const expectedIngredients = [mockIngredient];
      mockIngredientService.findAll.mockResolvedValue(expectedIngredients);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        error: '',
        data: expectedIngredients,
      });
    });

    it('should return empty array when no ingredients exist', async () => {
      mockIngredientService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual({
        error: '',
        data: [],
      });
    });

    it('should handle service errors', async () => {
      mockIngredientService.findAll.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return a single ingredient by ID', async () => {
      mockIngredientService.findOne.mockResolvedValue(mockIngredient);

      const result = await controller.findOne({ id: 'ingredient123' });

      expect(service.findOne).toHaveBeenCalledWith('ingredient123');
      expect(result).toEqual({
        error: '',
        data: mockIngredient,
      });
    });

    it('should handle ingredient not found', async () => {
      mockIngredientService.findOne.mockRejectedValue(
        new Error('Ingredient not found'),
      );

      await expect(controller.findOne({ id: 'nonexistent' })).rejects.toThrow(
        'Ingredient not found',
      );
    });

    it('should handle invalid ID format', async () => {
      mockIngredientService.findOne.mockRejectedValue(
        new Error('Invalid ID format'),
      );

      await expect(controller.findOne({ id: 'invalid' })).rejects.toThrow(
        'Invalid ID format',
      );
    });
  });

  describe('updateOne', () => {
    it('should update an ingredient successfully', async () => {
      const updateData = { name: 'Updated Tomato' };
      const updatedIngredient = { ...mockIngredient, ...updateData };
      mockIngredientService.updateOne.mockResolvedValue(updatedIngredient);

      const result = await controller.updateOne(
        { id: 'ingredient123' },
        updateData,
      );

      expect(service.updateOne).toHaveBeenCalledWith(
        'ingredient123',
        updateData,
      );
      expect(result).toEqual({
        error: '',
        data: updatedIngredient,
      });
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'Partially Updated' };
      const updatedIngredient = { ...mockIngredient, ...partialUpdate };
      mockIngredientService.updateOne.mockResolvedValue(updatedIngredient);

      const result = await controller.updateOne(
        { id: 'ingredient123' },
        partialUpdate,
      );

      expect(service.updateOne).toHaveBeenCalledWith(
        'ingredient123',
        partialUpdate,
      );
      expect(result).toEqual({
        error: '',
        data: updatedIngredient,
      });
    });

    it('should handle update errors', async () => {
      const updateData = { name: 'Updated Tomato' };
      mockIngredientService.updateOne.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.updateOne({ id: 'ingredient123' }, updateData),
      ).rejects.toThrow('Update failed');
    });

    it('should handle ingredient not found during update', async () => {
      const updateData = { name: 'Updated Tomato' };
      mockIngredientService.updateOne.mockRejectedValue(
        new Error('Ingredient with ID nonexistent not found'),
      );

      await expect(
        controller.updateOne({ id: 'nonexistent' }, updateData),
      ).rejects.toThrow('Ingredient with ID nonexistent not found');
    });
  });

  describe('deleteOne', () => {
    it('should delete an ingredient successfully', async () => {
      mockIngredientService.deleteOne.mockResolvedValue(undefined);

      await expect(
        controller.deleteOne({ id: 'ingredient123' }),
      ).resolves.toBeUndefined();

      expect(service.deleteOne).toHaveBeenCalledWith('ingredient123');
    });

    it('should handle deletion errors', async () => {
      mockIngredientService.deleteOne.mockRejectedValue(
        new Error('Deletion failed'),
      );

      await expect(
        controller.deleteOne({ id: 'ingredient123' }),
      ).rejects.toThrow('Deletion failed');
    });

    it('should handle ingredient not found during deletion', async () => {
      mockIngredientService.deleteOne.mockRejectedValue(
        new Error('Ingredient with ID nonexistent not found'),
      );

      await expect(controller.deleteOne({ id: 'nonexistent' })).rejects.toThrow(
        'Ingredient with ID nonexistent not found',
      );
    });

    it('should handle invalid ID format during deletion', async () => {
      mockIngredientService.deleteOne.mockRejectedValue(
        new Error('Invalid ID format'),
      );

      await expect(controller.deleteOne({ id: 'invalid-id' })).rejects.toThrow(
        'Invalid ID format',
      );
    });
  });
});
