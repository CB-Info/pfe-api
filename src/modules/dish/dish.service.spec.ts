import { Test, TestingModule } from '@nestjs/testing';
import { DishService } from './dish.service';
import { DishRepository } from 'src/mongo/repositories/dish.repository';
import { IngredientRepository } from 'src/mongo/repositories/ingredient.repository';
import { Dish, DishCategory, DishIngredientUnity } from 'src/mongo/models/dish.model';
import { DishDTO } from 'src/dto/creation/dish.dto';

describe('DishService', () => {
  let service: DishService;
  let repository: DishRepository;
  let ingredientRepository: IngredientRepository;

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
    ingredientRepository = module.get<IngredientRepository>(IngredientRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findTop20Ingredients', () => {
    it('should return top 20 ingredients', async () => {
      const mockIngredients = [mockDish];
      mockDishRepository.findTop20Ingredients.mockResolvedValue(mockIngredients);

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
      mockDishRepository.findTop20Ingredients.mockRejectedValue(new Error('Database error'));

      await expect(service.findTop20Ingredients()).rejects.toThrow('Database error');
    });
  });

  describe('createOne', () => {
          const dishDto: DishDTO = {
        name: 'New Dish',
        ingredients: [
          {
            ingredientId: 'ingredient123',
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
       mockIngredientRepository.findOneById.mockResolvedValue({ _id: 'ingredient123' });
       mockDishRepository.insert.mockResolvedValue({
         ...mockDish,
         toObject: jest.fn().mockReturnValue(mockDish),
       });

       const result = await service.createOne(dishDto);

       expect(ingredientRepository.findOneById).toHaveBeenCalledWith('ingredient123');
       expect(repository.insert).toHaveBeenCalled();
       expect(result).toEqual(mockDish);
     });

          it('should handle creation with minimal data', async () => {
        const minimalDishDto: DishDTO = {
          name: 'Simple Dish',
          ingredients: [],
          price: 10.00,
          description: '',
          category: DishCategory.STARTERS,
          timeCook: 10,
          isAvailable: true,
        };

        const minimalDish = { ...mockDish, ...minimalDishDto };
        mockDishRepository.insert.mockResolvedValue({
          ...minimalDish,
          toObject: jest.fn().mockReturnValue(minimalDish),
        });

        const result = await service.createOne(minimalDishDto);

        expect(repository.insert).toHaveBeenCalled();
        expect(result.name).toBe('Simple Dish');
        expect(result.ingredients).toEqual([]);
      });

          it('should handle repository errors during creation', async () => {
        mockIngredientRepository.findOneById.mockResolvedValue({ _id: 'ingredient123' });
        mockDishRepository.insert.mockRejectedValue(new Error('Creation failed'));

        await expect(service.createOne(dishDto)).rejects.toThrow();
      });

          it('should handle dish with multiple ingredients', async () => {
        const complexDishDto: DishDTO = {
          name: 'Complex Dish',
          ingredients: [
            { ingredientId: 'ing1', unity: DishIngredientUnity.MILLILITRE, quantity: 100 },
            { ingredientId: 'ing2', unity: DishIngredientUnity.CENTILITRE, quantity: 200 },
            { ingredientId: 'ing3', unity: DishIngredientUnity.MILLILITRE, quantity: 3 },
          ],
          price: 25.99,
          description: 'A complex dish with multiple ingredients',
          category: DishCategory.MAIN_DISHES,
          timeCook: 45,
          isAvailable: true,
        };

        // Mock ingredient validation for all ingredients
        mockIngredientRepository.findOneById
          .mockResolvedValueOnce({ _id: 'ing1' })
          .mockResolvedValueOnce({ _id: 'ing2' })
          .mockResolvedValueOnce({ _id: 'ing3' });

        const complexDish = { ...mockDish, ...complexDishDto };
        mockDishRepository.insert.mockResolvedValue({
          ...complexDish,
          toObject: jest.fn().mockReturnValue(complexDish),
        });

        const result = await service.createOne(complexDishDto);

        expect(result.ingredients).toHaveLength(3);
        expect(result.ingredients[0].unity).toBe(DishIngredientUnity.MILLILITRE);
        expect(result.ingredients[1].unity).toBe(DishIngredientUnity.CENTILITRE);
        expect(result.ingredients[2].unity).toBe(DishIngredientUnity.MILLILITRE);
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
        { populate: ['ingredients.ingredientId'] }
      );
      expect(result).toEqual(mockDish);
    });

    it('should handle dish not found', async () => {
      mockDishRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow('Dish with ID nonexistent not found');
    });

    it('should handle invalid ID format', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      mockDishRepository.findOneBy.mockRejectedValue(castError);

      await expect(service.findOne('invalid-id')).rejects.toThrow('Invalid ID format');
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

      expect(repository.updateOneBy).toHaveBeenCalledWith({ _id: 'dish123' }, updateData);
      expect(result).toEqual(updatedDish);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { price: 20.00 };
      const partiallyUpdatedDish = { ...mockDish, price: 20.00 };
      mockDishRepository.updateOneBy.mockResolvedValue(true);
      mockDishRepository.findOneBy.mockResolvedValue(partiallyUpdatedDish);

      const result = await service.updateOne('dish123', partialUpdate);

      expect(repository.updateOneBy).toHaveBeenCalledWith({ _id: 'dish123' }, partialUpdate);
      expect(result.price).toBe(20.00);
      expect(result.name).toBe(mockDish.name); // unchanged
    });

    it('should handle update failure', async () => {
      mockDishRepository.updateOneBy.mockResolvedValue(false);

      await expect(service.updateOne('dish123', updateData)).rejects.toThrow('Dish with ID dish123 not found');
    });

        it('should handle updating ingredients', async () => {
      const ingredientUpdate = {
        ingredients: [
          { ingredientId: 'newIngredient', unity: DishIngredientUnity.MILLILITRE, quantity: 2 },
        ],
      };
      const updatedDish = { ...mockDish, ingredients: ingredientUpdate.ingredients };
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

      expect(repository.updateOneBy).toHaveBeenCalledWith({ _id: 'dish123' }, {});
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

      await expect(service.deleteOne('dish123')).rejects.toThrow('Dish with ID dish123 not found');
    });

    it('should handle deleting non-existent dish', async () => {
      mockDishRepository.deleteOneBy.mockResolvedValue(false);

      await expect(service.deleteOne('nonexistent')).rejects.toThrow('Dish with ID nonexistent not found');

      expect(repository.deleteOneBy).toHaveBeenCalledWith({ _id: 'nonexistent' });
    });

    it('should handle invalid ID format', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      mockDishRepository.deleteOneBy.mockRejectedValue(castError);

      await expect(service.deleteOne('invalid-id')).rejects.toThrow();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null input for createOne', async () => {
      await expect(service.createOne(null as any)).rejects.toThrow();
    });

    it('should handle undefined input for updateOne', async () => {
      mockDishRepository.updateOneBy.mockResolvedValue(mockDish);

      const result = await service.updateOne('dish123', undefined as any);

      expect(repository.updateOneBy).toHaveBeenCalledWith({ _id: 'dish123' }, undefined);
    });

    it('should handle empty string ID', async () => {
      mockDishRepository.findOneById.mockRejectedValue(new Error('Invalid ID'));

      await expect(service.findOne('')).rejects.toThrow('Invalid ID');
    });

    it('should handle repository returning undefined', async () => {
      mockDishRepository.findOneById.mockResolvedValue(undefined);

      const result = await service.findOne('dish123');

      expect(result).toBeUndefined();
    });
  });
});