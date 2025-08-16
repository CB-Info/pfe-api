import { Test, TestingModule } from '@nestjs/testing';
import { DishController } from './dish.controller';
import { DishService } from './dish.service';
import { UserRepository } from 'src/mongo/repositories/user.repository';
import { DishCategory, DishIngredientUnity } from 'src/mongo/models/dish.model';
import { DishDTO } from 'src/dto/creation/dish.dto';
import { DishResponseDTO } from 'src/dto/response/dish.response.dto';

describe('DishController', () => {
  let controller: DishController;
  let service: DishService;

  const mockDishService = {
    findTop20Ingredients: jest.fn(),
    createOne: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockDish = {
    _id: 'dish123',
    name: 'Pasta Carbonara',
    ingredients: [
      {
        ingredientId: {
          _id: 'ingredient123',
          name: 'Pasta',
        },
        unity: DishIngredientUnity.MILLILITRE,
        quantity: 100,
      },
      {
        ingredientId: {
          _id: 'ingredient456',
          name: 'Bacon',
        },
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

  const mockDishResponseDTO: DishResponseDTO = {
    _id: 'dish123',
    name: 'Pasta Carbonara',
    ingredients: [
      {
        ingredientRef: {
          _id: 'ingredient123',
          name: 'Pasta',
        },
        unity: DishIngredientUnity.MILLILITRE,
        quantity: 100,
      },
      {
        ingredientRef: {
          _id: 'ingredient456',
          name: 'Bacon',
        },
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
      controllers: [DishController],
      providers: [
        {
          provide: DishService,
          useValue: mockDishService,
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

    controller = module.get<DishController>(DishController);
    service = module.get<DishService>(DishService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTop20Ingredients', () => {
    it('should return top 20 ingredients', async () => {
      const mockIngredients = [mockDish];
      mockDishService.findTop20Ingredients.mockResolvedValue(mockIngredients);

      const result = await controller.getTop20Ingredients();

      expect(service.findTop20Ingredients).toHaveBeenCalled();
      expect(result).toEqual({ error: '', data: mockIngredients });
    });

    it('should handle service errors', async () => {
      mockDishService.findTop20Ingredients.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.getTop20Ingredients()).rejects.toThrow(
        'Service error',
      );
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

    it('should create a new dish successfully', async () => {
      mockDishService.createOne.mockResolvedValue(mockDish);

      const result = await controller.createOne(dishDto);

      expect(service.createOne).toHaveBeenCalledWith(dishDto);
      expect(result).toEqual({ error: '', data: mockDishResponseDTO });
    });

    it('should handle creation errors', async () => {
      mockDishService.createOne.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.createOne(dishDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('findAll', () => {
    it('should return all dishes', async () => {
      const dishes = [mockDish];
      mockDishService.findAll.mockResolvedValue(dishes);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        error: '',
        data: [mockDishResponseDTO],
      });
    });

    it('should return empty array when no dishes found', async () => {
      mockDishService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual({ error: '', data: [] });
    });
  });

  describe('findOne', () => {
    it('should return a single dish by ID', async () => {
      mockDishService.findOne.mockResolvedValue(mockDish);

      const result = await controller.findOne({ id: 'dish123' });

      expect(service.findOne).toHaveBeenCalledWith('dish123');
      expect(result).toEqual({ error: '', data: mockDishResponseDTO });
    });

    it('should handle not found errors', async () => {
      mockDishService.findOne.mockRejectedValue(new Error('Dish not found'));

      await expect(controller.findOne({ id: 'nonexistent' })).rejects.toThrow(
        'Dish not found',
      );
    });
  });

  describe('updateOne', () => {
    const updateData = {
      name: 'Updated Dish Name',
      price: 18.99,
    };

    it('should update a dish successfully', async () => {
      const updatedDish = { ...mockDish, ...updateData };
      mockDishService.updateOne.mockResolvedValue(updatedDish);

      const result = await controller.updateOne({ id: 'dish123' }, updateData);

      expect(service.updateOne).toHaveBeenCalledWith('dish123', updateData);
      expect(result.data.name).toBe('Updated Dish Name');
      expect(result.data.price).toBe(18.99);
    });

    it('should handle update errors', async () => {
      mockDishService.updateOne.mockRejectedValue(new Error('Update failed'));

      await expect(
        controller.updateOne({ id: 'dish123' }, updateData),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteOne', () => {
    it('should delete a dish successfully', async () => {
      mockDishService.deleteOne.mockResolvedValue(undefined);

      await controller.deleteOne({ id: 'dish123' });

      expect(service.deleteOne).toHaveBeenCalledWith('dish123');
    });

    it('should handle deletion errors', async () => {
      mockDishService.deleteOne.mockRejectedValue(new Error('Deletion failed'));

      await expect(controller.deleteOne({ id: 'dish123' })).rejects.toThrow(
        'Deletion failed',
      );
    });
  });

  describe('toResponseDto', () => {
    it('should convert dish to response DTO correctly', () => {
      const result = controller['toResponseDto'](mockDish as any);

      expect(result).toEqual(mockDishResponseDTO);
      expect(result._id).toBe(mockDish._id.toString());
      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0].ingredientRef.name).toBe('Pasta');
    });

    it('should handle empty ingredients array', () => {
      const dishWithoutIngredients = { ...mockDish, ingredients: [] };
      const result = controller['toResponseDto'](dishWithoutIngredients as any);

      expect(result.ingredients).toEqual([]);
    });

    it('should handle complex ingredient structure', () => {
      const complexDish = {
        ...mockDish,
        ingredients: [
          {
            ingredientId: {
              _id: 'complex123',
              name: 'Complex Ingredient',
              additionalData: 'should be ignored',
            },
            unity: DishIngredientUnity.MILLILITRE,
            quantity: 250,
          },
        ],
      };

      const result = controller['toResponseDto'](complexDish as any);

      expect(result.ingredients[0].ingredientRef).toEqual({
        _id: 'complex123',
        name: 'Complex Ingredient',
      });
      expect(result.ingredients[0].unity).toBe(DishIngredientUnity.MILLILITRE);
      expect(result.ingredients[0].quantity).toBe(250);
    });
  });
});
