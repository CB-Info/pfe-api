import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { IngredientRepository } from 'src/mongo/repositories/ingredient.repository';
import { IngredientDTO } from 'src/dto/creation/ingredient.dto';

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

// Mock repository
const mockIngredientRepository = {
  findManyBy: jest.fn(),
  insert: jest.fn(),
  findAll: jest.fn(),
  findOneBy: jest.fn(),
  updateOneBy: jest.fn(),
  deleteOneBy: jest.fn(),
};

describe('IngredientService', () => {
  let service: IngredientService;
  let repository: IngredientRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientService,
        {
          provide: IngredientRepository,
          useValue: mockIngredientRepository,
        },
      ],
    }).compile();

    service = module.get<IngredientService>(IngredientService);
    repository = module.get<IngredientRepository>(IngredientRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByName', () => {
    it('should search ingredients by name with case insensitive regex', async () => {
      const searchTerm = 'tom';
      const expectedIngredients = [mockIngredient];
      mockIngredientRepository.findManyBy.mockResolvedValue(
        expectedIngredients,
      );

      const result = await service.findByName(searchTerm);

      expect(repository.findManyBy).toHaveBeenCalledWith({
        name: { $regex: new RegExp(searchTerm, 'i') },
      });
      expect(result).toEqual(expectedIngredients);
    });

    it('should return empty array when no ingredients match', async () => {
      const searchTerm = 'nonexistent';
      mockIngredientRepository.findManyBy.mockResolvedValue([]);

      const result = await service.findByName(searchTerm);

      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      const searchTerm = 'test';
      mockIngredientRepository.findManyBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findByName(searchTerm)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('createOne', () => {
    it('should create an ingredient successfully', async () => {
      const mockCreatedIngredient = {
        _id: 'new-ingredient123',
        name: mockIngredientDto.name,
        toObject: jest.fn().mockReturnValue({
          _id: 'new-ingredient123',
          name: mockIngredientDto.name,
        }),
      };

      mockIngredientRepository.insert.mockResolvedValue(mockCreatedIngredient);

      const result = await service.createOne(mockIngredientDto);

      expect(repository.insert).toHaveBeenCalledWith({
        name: mockIngredientDto.name,
      });
      expect(mockCreatedIngredient.toObject).toHaveBeenCalledWith({
        versionKey: false,
      });
      expect(result).toEqual({
        _id: 'new-ingredient123',
        name: mockIngredientDto.name,
      });
    });

    it('should throw BadRequestException for validation errors', async () => {
      const validationError = new Error('Name is required');
      validationError.name = 'ValidationError';
      mockIngredientRepository.insert.mockRejectedValue(validationError);

      await expect(service.createOne(mockIngredientDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockIngredientRepository.insert.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.createOne(mockIngredientDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all ingredients', async () => {
      const expectedIngredients = [mockIngredient];
      mockIngredientRepository.findAll.mockResolvedValue(expectedIngredients);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedIngredients);
    });

    it('should return empty array when no ingredients exist', async () => {
      mockIngredientRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on repository error', async () => {
      mockIngredientRepository.findAll.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('should return an ingredient by ID', async () => {
      mockIngredientRepository.findOneBy.mockResolvedValue(mockIngredient);

      const result = await service.findOne('ingredient123');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        _id: 'ingredient123',
      });
      expect(result).toEqual(mockIngredient);
    });

    it('should throw NotFoundException when ingredient not found', async () => {
      mockIngredientRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Ingredient with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      mockIngredientRepository.findOneBy.mockRejectedValue(castError);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new BadRequestException('Invalid ID format'),
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockIngredientRepository.findOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findOne('ingredient123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateOne', () => {
    it('should update an ingredient successfully', async () => {
      const updateData = { name: 'Updated Tomato' };
      const updatedIngredient = { ...mockIngredient, ...updateData };

      mockIngredientRepository.updateOneBy.mockResolvedValue(true);
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(updatedIngredient as any);

      const result = await service.updateOne('ingredient123', updateData);

      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'ingredient123' },
        updateData,
      );
      expect(service.findOne).toHaveBeenCalledWith('ingredient123');
      expect(result).toEqual(updatedIngredient);
    });

    it('should throw NotFoundException when ingredient not found', async () => {
      const updateData = { name: 'Updated Tomato' };
      mockIngredientRepository.updateOneBy.mockResolvedValue(false);

      await expect(
        service.updateOne('nonexistent', updateData),
      ).rejects.toThrow(
        new NotFoundException('Ingredient with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException for removal errors', async () => {
      const updateData = { name: 'Updated Tomato' };
      const removalError = new Error('Unable to remove ingredient from dish');
      mockIngredientRepository.updateOneBy.mockRejectedValue(removalError);

      await expect(
        service.updateOne('ingredient123', updateData),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const updateData = { name: 'Updated Tomato' };
      mockIngredientRepository.updateOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updateOne('ingredient123', updateData),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteOne', () => {
    it('should delete an ingredient successfully', async () => {
      mockIngredientRepository.deleteOneBy.mockResolvedValue(true);

      await expect(service.deleteOne('ingredient123')).resolves.toBeUndefined();

      expect(repository.deleteOneBy).toHaveBeenCalledWith({
        _id: 'ingredient123',
      });
    });

    it('should throw NotFoundException when ingredient not found', async () => {
      mockIngredientRepository.deleteOneBy.mockResolvedValue(false);

      await expect(service.deleteOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Ingredient with ID nonexistent not found'),
      );
    });

    it('should throw InternalServerErrorException for repository errors', async () => {
      mockIngredientRepository.deleteOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.deleteOne('ingredient123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
