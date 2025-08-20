import { Test, TestingModule } from '@nestjs/testing';
import { DishService } from './dish.service';
import { DishRepository } from 'src/mongo/repositories/dish.repository';
import { IngredientRepository } from 'src/mongo/repositories/ingredient.repository';
import { DishCategory, DishIngredientUnity } from 'src/mongo/models/dish.model';
import { DishDTO } from 'src/dto/creation/dish.dto';

describe('DishService', () => {
  let service: DishService;
  let repository: DishRepository;

  const mockDishRepository = {
    insert: jest.fn(),
    findAll: jest.fn(),
    findOneById: jest.fn(),
    findOneBy: jest.fn(),
    updateOneBy: jest.fn(),
    deleteOneBy: jest.fn(),
    findTop20Ingredients: jest.fn(),
  };

  const mockIngredientRepository = {
    findOneById: jest.fn(),
  };

  const mockDish = {
    _id: 'dish123',
    name: 'Pasta Carbonara',
    ingredients: [
      {
        ingredientId: 'ingredient123',
        unity: DishIngredientUnity.MILLILITRE,
        quantity: 100,
      },
      {
        ingredientId: 'ingredient456',
        unity: DishIngredientUnity.CENTILITRE,
        quantity: 50,
      },
    ],
    price: 12.99,
    description: 'Classic Italian pasta dish',
    category: DishCategory.PASTA_RICE,
    timeCook: 20,
    isAvailable: true,
    dateOfCreation: '2024-01-01',
    dateLastModified: '2024-01-01',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DishService,
        {
          provide: DishRepository,
          useValue: mockDishRepository,
        },
        {
          provide: IngredientRepository,
          useValue: mockIngredientRepository,
        },
      ],
    }).compile();

    service = module.get<DishService>(DishService);
    repository = module.get<DishRepository>(DishRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findTop20Ingredients', () => {
    it('should return top 20 ingredients', async () => {
      const mockIngredients = [mockDish];
      mockDishRepository.findTop20Ingredients.mockResolvedValue(
        mockIngredients,
      );

      const result = await service.findTop20Ingredients();

      expect(repository.findTop20Ingredients).toHaveBeenCalled();
      expect(result).toEqual(mockIngredients);
    });

    it('should handle empty results', async () => {
      mockDishRepository.findTop20Ingredients.mockResolvedValue([]);

      const result = await service.findTop20Ingredients();

      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      mockDishRepository.findTop20Ingredients.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findTop20Ingredients()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('createOne', () => {
    const dishDto: DishDTO = {
      name: 'New Dish',
      ingredients: [
        {
          ingredientId: '507f1f77bcf86cd799439011', // Valid ObjectId
          unity: DishIngredientUnity.MILLILITRE,
          quantity: 100,
        },
      ],
      price: 15.99,
      description: 'A new dish',
      category: DishCategory.MAIN_DISHES,
      timeCook: 25,
      isAvailable: true,
    };

    it('should create a dish successfully', async () => {
      const createdDish = { ...mockDish, ...dishDto, _id: 'dish123' };

      // Mock ingredient validation
      mockIngredientRepository.findOneById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Ingredient',
      });

      mockDishRepository.insert.mockResolvedValue(createdDish);
      mockDishRepository.findOneById.mockResolvedValue(createdDish);

      const result = await service.createOne(dishDto);

      expect(repository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dishDto.name,
          price: dishDto.price,
          description: dishDto.description,
          category: dishDto.category,
          timeCook: dishDto.timeCook,
          isAvailable: dishDto.isAvailable,
        }),
      );
      expect(result).toEqual(createdDish);
    });

    it('should handle dish with multiple ingredients', async () => {
      const multiIngredientDto = {
        ...dishDto,
        ingredients: [
          {
            ingredientId: '507f1f77bcf86cd799439011',
            unity: DishIngredientUnity.MILLILITRE,
            quantity: 100,
          },
          {
            ingredientId: '507f1f77bcf86cd799439012',
            unity: DishIngredientUnity.CENTILITRE,
            quantity: 50,
          },
        ],
      };

      // Mock multiple ingredients validation
      mockIngredientRepository.findOneById
        .mockResolvedValueOnce({
          _id: '507f1f77bcf86cd799439011',
          name: 'Ingredient 1',
        })
        .mockResolvedValueOnce({
          _id: '507f1f77bcf86cd799439012',
          name: 'Ingredient 2',
        });

      const createdDish = {
        ...mockDish,
        ...multiIngredientDto,
        _id: 'dish123',
      };
      mockDishRepository.insert.mockResolvedValue(createdDish);
      mockDishRepository.findOneById.mockResolvedValue(createdDish);

      const result = await service.createOne(multiIngredientDto);

      expect(result.ingredients).toHaveLength(2);
    });

    it('should handle creation with minimal data', async () => {
      const minimalDishDto: DishDTO = {
        name: 'Simple Dish',
        ingredients: [],
        price: 10.0,
        description: '',
        category: DishCategory.STARTERS,
        timeCook: 10,
        isAvailable: true,
      };

      const minimalDish = { ...mockDish, ...minimalDishDto };
      mockDishRepository.insert.mockResolvedValue(minimalDish);

      const result = await service.createOne(minimalDishDto);

      expect(repository.insert).toHaveBeenCalled();
      expect(result.name).toBe('Simple Dish');
      expect(result.ingredients).toEqual([]);
    });

    it('should handle repository errors during creation', async () => {
      mockIngredientRepository.findOneById.mockResolvedValue({
        _id: 'ingredient123',
      });
      mockDishRepository.insert.mockRejectedValue(new Error('Creation failed'));

      await expect(service.createOne(dishDto)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all dishes', async () => {
      const dishes = [mockDish];
      mockDishRepository.findAll.mockResolvedValue(dishes);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(dishes);
    });

    it('should return empty array when no dishes exist', async () => {
      mockDishRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      mockDishRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return a dish by ID', async () => {
      mockDishRepository.findOneBy.mockResolvedValue(mockDish);

      const result = await service.findOne('dish123');

      expect(repository.findOneBy).toHaveBeenCalledWith(
        { _id: 'dish123' },
        { populate: ['ingredients.ingredientId'] },
      );
      expect(result).toEqual(mockDish);
    });

    it('should handle dish not found', async () => {
      mockDishRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Dish with ID nonexistent not found',
      );
    });

    it('should handle invalid ID format', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      mockDishRepository.findOneBy.mockRejectedValue(castError);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Invalid ID format',
      );
    });
  });

  describe('updateOne', () => {
    const updateData = {
      name: 'Updated Dish',
      price: 18.99,
      isAvailable: false,
    };

    it('should update a dish successfully', async () => {
      const updatedDish = { ...mockDish, ...updateData };
      mockDishRepository.updateOneBy.mockResolvedValue(true);
      mockDishRepository.findOneBy.mockResolvedValue(updatedDish);

      const result = await service.updateOne('dish123', updateData);

      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'dish123' },
        updateData,
      );
      expect(result).toEqual(updatedDish);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { price: 20.0 };
      const partiallyUpdatedDish = { ...mockDish, price: 20.0 };
      mockDishRepository.updateOneBy.mockResolvedValue(true);
      mockDishRepository.findOneBy.mockResolvedValue(partiallyUpdatedDish);

      const result = await service.updateOne('dish123', partialUpdate);

      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'dish123' },
        partialUpdate,
      );
      expect(result.price).toBe(20.0);
      expect(result.name).toBe(mockDish.name); // unchanged
    });

    it('should handle update failure', async () => {
      mockDishRepository.updateOneBy.mockResolvedValue(false);

      await expect(service.updateOne('dish123', updateData)).rejects.toThrow(
        'Dish with ID dish123 not found',
      );
    });

    it('should handle updating ingredients', async () => {
      const ingredientUpdate = {
        ingredients: [
          {
            ingredientId: 'newIngredient',
            unity: DishIngredientUnity.MILLILITRE,
            quantity: 2,
          },
        ],
      };
      const updatedDish = {
        ...mockDish,
        ingredients: ingredientUpdate.ingredients,
      };
      mockDishRepository.updateOneBy.mockResolvedValue(true);
      mockDishRepository.findOneBy.mockResolvedValue(updatedDish);

      const result = await service.updateOne('dish123', ingredientUpdate);

      expect(result.ingredients).toHaveLength(1);
      expect(result.ingredients[0].ingredientId).toBe('newIngredient');
      expect(result.ingredients[0].unity).toBe(DishIngredientUnity.MILLILITRE);
    });

    it('should handle empty update data', async () => {
      mockDishRepository.updateOneBy.mockResolvedValue(true);
      mockDishRepository.findOneBy.mockResolvedValue(mockDish);

      const result = await service.updateOne('dish123', {});

      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'dish123' },
        {},
      );
      expect(result).toEqual(mockDish);
    });
  });

  describe('deleteOne', () => {
    it('should delete a dish successfully', async () => {
      mockDishRepository.deleteOneBy.mockResolvedValue(true);

      await expect(service.deleteOne('dish123')).resolves.not.toThrow();

      expect(repository.deleteOneBy).toHaveBeenCalledWith({ _id: 'dish123' });
    });

    it('should handle deletion failure', async () => {
      mockDishRepository.deleteOneBy.mockResolvedValue(false);

      await expect(service.deleteOne('dish123')).rejects.toThrow(
        'Dish with ID dish123 not found',
      );
    });

    it('should handle deleting non-existent dish', async () => {
      mockDishRepository.deleteOneBy.mockResolvedValue(false);

      await expect(service.deleteOne('nonexistent')).rejects.toThrow(
        'Dish with ID nonexistent not found',
      );

      expect(repository.deleteOneBy).toHaveBeenCalledWith({
        _id: 'nonexistent',
      });
    });

    it('should handle invalid ID format', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      mockDishRepository.deleteOneBy.mockRejectedValue(castError);

      await expect(service.deleteOne('invalid-id')).rejects.toThrow();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty string ID', async () => {
      mockDishRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('')).rejects.toThrow(
        'Dish with ID  not found',
      );
    });

    it('should handle repository returning undefined', async () => {
      mockDishRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('dish123')).rejects.toThrow(
        'Dish with ID dish123 not found',
      );
    });

    it('should handle null ingredients in createOne', async () => {
      const dishWithNullIngredients = {
        name: 'Test Dish',
        ingredients: null as any,
        price: 15.99,
        description: 'Test description',
        category: DishCategory.MAIN_DISHES,
        timeCook: 20,
        isAvailable: true,
      };

      const createdDish = {
        ...mockDish,
        ...dishWithNullIngredients,
        ingredients: [],
      };
      mockDishRepository.insert.mockResolvedValue(createdDish);

      const result = await service.createOne(dishWithNullIngredients);

      expect(result.ingredients).toEqual([]);
      expect(repository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Dish',
          ingredients: [],
        }),
      );
    });
  });
});
