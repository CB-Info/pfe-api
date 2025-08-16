import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DishRepository } from './dish.repository';
import { Dish, DishCategory, DishIngredientUnity } from '../models/dish.model';

describe('DishRepository', () => {
  let repository: DishRepository;
  let model: Model<Dish>;

  const mockDish = {
    _id: 'dish123',
    name: 'Pasta Carbonara',
    ingredients: [
      {
        ingredientId: 'ingredient123',
        unity: DishIngredientUnity.MILLILITRE,
        quantity: 100,
      },
    ],
    price: 12.99,
    description: 'Classic Italian pasta dish',
    category: DishCategory.PASTA_RICE,
    timeCook: 20,
    isAvailable: true,
    dateOfCreation: '2024-01-01',
    dateLastModified: '2024-01-01',
    save: jest.fn(),
    toObject: jest.fn(),
  };

  const mockModel = {
    new: jest.fn(),
    constructor: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    aggregate: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DishRepository,
        {
          provide: getModelToken('Dish'),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<DishRepository>(DishRepository);
    model = module.get<Model<Dish>>(getModelToken('Dish'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('insert', () => {
    it('should create a new dish successfully', async () => {
      const dishData = {
        name: 'New Dish',
        ingredients: [
          {
            ingredientId: 'ingredient456',
            unity: DishIngredientUnity.CENTILITRE,
            quantity: 50,
          },
        ],
        price: 15.99,
        description: 'A new delicious dish',
        category: DishCategory.MAIN_DISHES,
        timeCook: 25,
        isAvailable: true,
      };

      mockModel.create.mockResolvedValue(mockDish);

      const result = await repository.insert(dishData);

      expect(model.create).toHaveBeenCalledWith(dishData);
      expect(result).toEqual(mockDish);
    });

    it('should handle creation errors', async () => {
      const dishData = {
        name: 'Invalid Dish',
        // Missing required fields
      };

      mockModel.create.mockRejectedValue(new Error('Validation failed'));

      await expect(repository.insert(dishData)).rejects.toThrow('Validation failed');
    });
  });

  describe('findOneById', () => {
    it('should find dish by ID', async () => {
      mockModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDish),
        }),
      });

      const result = await repository.findOneById('dish123');

      expect(model.findById).toHaveBeenCalledWith('dish123');
      expect(result).toEqual(mockDish);
    });

    it('should return null when dish not found', async () => {
      mockModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await repository.findOneById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findOneBy', () => {
    it('should find dish by criteria', async () => {
      const criteria = { name: 'Pasta Carbonara' };

      mockModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDish),
        }),
      });

      const result = await repository.findOneBy(criteria);

      expect(model.findOne).toHaveBeenCalledWith(criteria);
      expect(result).toEqual(mockDish);
    });

    it('should return null when no dish matches criteria', async () => {
      const criteria = { name: 'Nonexistent Dish' };

      mockModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await repository.findOneBy(criteria);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all dishes', async () => {
      const dishes = [mockDish];

      mockModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(dishes),
        }),
      });

      const result = await repository.findAll();

      expect(model.find).toHaveBeenCalledWith({});
      expect(result).toEqual(dishes);
    });

    it('should return empty array when no dishes exist', async () => {
      mockModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findManyBy', () => {
    it('should find dishes by criteria', async () => {
      const criteria = { category: DishCategory.PASTA_RICE };
      const dishes = [mockDish];

      mockModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(dishes),
        }),
      });

      const result = await repository.findManyBy(criteria);

      expect(model.find).toHaveBeenCalledWith(criteria);
      expect(result).toEqual(dishes);
    });

    it('should return empty array when no dishes match', async () => {
      const criteria = { category: DishCategory.DESSERTS };

      mockModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findManyBy(criteria);

      expect(result).toEqual([]);
    });
  });

  describe('updateOneBy', () => {
    it('should update dish successfully', async () => {
      const criteria = { _id: 'dish123' };
      const updateData = { price: 14.99 };

      mockModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      const result = await repository.updateOneBy(criteria, updateData);

      expect(model.updateOne).toHaveBeenCalledWith(criteria, updateData);
      expect(result).toBe(true);
    });

    it('should return false when no dish updated', async () => {
      const criteria = { _id: 'nonexistent' };
      const updateData = { price: 14.99 };

      mockModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });

      const result = await repository.updateOneBy(criteria, updateData);

      expect(result).toBe(false);
    });

    it('should handle update errors', async () => {
      const criteria = { _id: 'dish123' };
      const updateData = { price: 'invalid' };

      mockModel.updateOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Validation failed')),
      });

      await expect(repository.updateOneBy(criteria, updateData)).rejects.toThrow('Validation failed');
    });
  });

  describe('deleteOneBy', () => {
    it('should delete dish successfully', async () => {
      const criteria = { _id: 'dish123' };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      const result = await repository.deleteOneBy(criteria);

      expect(model.deleteOne).toHaveBeenCalledWith(criteria);
      expect(result).toBe(true);
    });

    it('should return false when no dish deleted', async () => {
      const criteria = { _id: 'nonexistent' };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      });

      const result = await repository.deleteOneBy(criteria);

      expect(result).toBe(false);
    });

    it('should handle deletion errors', async () => {
      const criteria = { _id: 'dish123' };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(repository.deleteOneBy(criteria)).rejects.toThrow('Database error');
    });
  });

  describe('findTop20Ingredients', () => {
    it('should return top 20 ingredients aggregation', async () => {
      const mockAggregationResult = [
        {
          _id: 'ingredient123',
          count: 5,
          ingredient: {
            _id: 'ingredient123',
            name: 'Pasta',
          },
        },
      ];

      mockModel.aggregate.mockResolvedValue(mockAggregationResult);

      const result = await repository.findTop20Ingredients();

      expect(model.aggregate).toHaveBeenCalledWith([
        { $unwind: '$ingredients' },
        {
          $group: {
            _id: '$ingredients.ingredientId',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'ingredients',
            localField: '_id',
            foreignField: '_id',
            as: 'ingredient',
          },
        },
        { $unwind: '$ingredient' },
      ]);
      expect(result).toEqual(mockAggregationResult);
    });

    it('should handle aggregation errors', async () => {
      mockModel.aggregate.mockRejectedValue(new Error('Aggregation failed'));

      await expect(repository.findTop20Ingredients()).rejects.toThrow('Aggregation failed');
    });

    it('should return empty array when no ingredients found', async () => {
      mockModel.aggregate.mockResolvedValue([]);

      const result = await repository.findTop20Ingredients();

      expect(result).toEqual([]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty criteria in findManyBy', async () => {
      mockModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockDish]),
        }),
      });

      const result = await repository.findManyBy({});

      expect(model.find).toHaveBeenCalledWith({});
      expect(result).toEqual([mockDish]);
    });

    it('should handle complex query criteria', async () => {
      const complexCriteria = {
        $and: [
          { price: { $gte: 10, $lte: 20 } },
          { isAvailable: true },
          { category: { $in: [DishCategory.MAIN_DISHES, DishCategory.PASTA_RICE] } },
        ],
      };

      mockModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockDish]),
        }),
      });

      const result = await repository.findManyBy(complexCriteria);

      expect(model.find).toHaveBeenCalledWith(complexCriteria);
      expect(result).toEqual([mockDish]);
    });

    it('should handle populate errors', async () => {
      mockModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValue(new Error('Populate failed')),
        }),
      });

      await expect(repository.findOneById('dish123')).rejects.toThrow('Populate failed');
    });
  });
});