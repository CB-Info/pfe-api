import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { StockRepository } from 'src/mongo/repositories/stock.repository';
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

// Mock repository
const mockStockRepository = {
  insert: jest.fn(),
  findAll: jest.fn(),
  findOneBy: jest.fn(),
  updateOneBy: jest.fn(),
  deleteOneBy: jest.fn(),
};

describe('StockService', () => {
  let service: StockService;
  let repository: StockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: StockRepository,
          useValue: mockStockRepository,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    repository = module.get<StockRepository>(StockRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOne', () => {
    it('should create a stock successfully', async () => {
      const mockCreatedStock = {
        ...mockStock,
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439012',
          name: mockStockDto.name,
          ingredients: mockStockDto.ingredients,
        }),
      };

      mockStockRepository.insert.mockResolvedValue(mockCreatedStock);

      const result = await service.createOne(mockStockDto);

      expect(repository.insert).toHaveBeenCalledWith({
        name: mockStockDto.name,
        ingredients: mockStockDto.ingredients,
      });
      expect(mockCreatedStock.toObject).toHaveBeenCalledWith({
        versionKey: false,
      });
      expect(result).toEqual({
        _id: '507f1f77bcf86cd799439012',
        name: mockStockDto.name,
        ingredients: mockStockDto.ingredients,
      });
    });

    it('should throw BadRequestException for validation errors', async () => {
      const validationError = new Error('Name is required');
      validationError.name = 'ValidationError';
      mockStockRepository.insert.mockRejectedValue(validationError);

      await expect(service.createOne(mockStockDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockStockRepository.insert.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.createOne(mockStockDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all stocks', async () => {
      const expectedStocks = [mockStock];
      mockStockRepository.findAll.mockResolvedValue(expectedStocks);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedStocks);
    });

    it('should return empty array when no stocks exist', async () => {
      mockStockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on repository error', async () => {
      mockStockRepository.findAll.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a stock by ID', async () => {
      mockStockRepository.findOneBy.mockResolvedValue(mockStock);

      const result = await service.findOne('507f1f77bcf86cd799439012');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439012',
      });
      expect(result).toEqual(mockStock);
    });

    it('should throw NotFoundException when stock not found', async () => {
      mockStockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Stock with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      mockStockRepository.findOneBy.mockRejectedValue(castError);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new BadRequestException('Invalid ID format'),
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockStockRepository.findOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findOne('507f1f77bcf86cd799439012')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateOne', () => {
    it('should update a stock successfully', async () => {
      const updateData = { name: 'Updated Stock' };
      const updatedStock = { ...mockStock, ...updateData };

      mockStockRepository.updateOneBy.mockResolvedValue(true);
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedStock as any);

      const result = await service.updateOne(
        '507f1f77bcf86cd799439012',
        updateData,
      );

      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439012' },
        updateData,
      );
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(result).toEqual(updatedStock);
    });

    it('should throw NotFoundException when stock not found', async () => {
      const updateData = { name: 'Updated Stock' };
      mockStockRepository.updateOneBy.mockResolvedValue(false);

      await expect(
        service.updateOne('nonexistent', updateData),
      ).rejects.toThrow(
        new NotFoundException('Stock with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException for update errors', async () => {
      const updateData = { name: 'Updated Stock' };
      const updateError = new Error('Unable to update stock');
      mockStockRepository.updateOneBy.mockRejectedValue(updateError);

      await expect(
        service.updateOne('507f1f77bcf86cd799439012', updateData),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const updateData = { name: 'Updated Stock' };
      mockStockRepository.updateOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updateOne('507f1f77bcf86cd799439012', updateData),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteOne', () => {
    it('should delete a stock successfully', async () => {
      mockStockRepository.deleteOneBy.mockResolvedValue(true);

      await expect(
        service.deleteOne('507f1f77bcf86cd799439012'),
      ).resolves.toBeUndefined();

      expect(repository.deleteOneBy).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439012',
      });
    });

    it('should throw NotFoundException when stock not found', async () => {
      mockStockRepository.deleteOneBy.mockResolvedValue(false);

      await expect(service.deleteOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Stock with ID nonexistent not found'),
      );
    });

    it('should throw InternalServerErrorException for repository errors', async () => {
      mockStockRepository.deleteOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.deleteOne('507f1f77bcf86cd799439012'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
