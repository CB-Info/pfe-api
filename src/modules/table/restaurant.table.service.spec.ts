import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RestaurantTableService } from './restaurant.table.service';
import { RestaurantTableRepository } from 'src/mongo/repositories/restaurant.table.repository';
import { RestaurantTableDTO } from 'src/dto/restaurant.table.dto';

// Mock data
const mockTable = {
  _id: '507f1f77bcf86cd799439011',
  number: 1,
} as any;

const mockTableDto: RestaurantTableDTO = {
  number: 2,
};

// Mock repository
const mockTableRepository = {
  insert: jest.fn(),
  findAll: jest.fn(),
  findOneBy: jest.fn(),
  updateOneBy: jest.fn(),
  deleteOneBy: jest.fn(),
};

describe('RestaurantTableService', () => {
  let service: RestaurantTableService;
  let repository: RestaurantTableRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantTableService,
        {
          provide: RestaurantTableRepository,
          useValue: mockTableRepository,
        },
      ],
    }).compile();

    service = module.get<RestaurantTableService>(RestaurantTableService);
    repository = module.get<RestaurantTableRepository>(
      RestaurantTableRepository,
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOne', () => {
    it('should create a table successfully', async () => {
      const mockCreatedTable = {
        ...mockTable,
        number: mockTableDto.number,
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          number: mockTableDto.number,
        }),
      };

      mockTableRepository.insert.mockResolvedValue(mockCreatedTable);

      const result = await service.createOne(mockTableDto);

      expect(repository.insert).toHaveBeenCalledWith({
        number: mockTableDto.number,
      });
      expect(mockCreatedTable.toObject).toHaveBeenCalledWith({
        versionKey: false,
      });
      expect(result).toEqual({
        _id: '507f1f77bcf86cd799439011',
        number: mockTableDto.number,
      });
    });

    it('should throw BadRequestException for validation errors', async () => {
      const validationError = new Error('Number is required');
      validationError.name = 'ValidationError';
      mockTableRepository.insert.mockRejectedValue(validationError);

      await expect(service.createOne(mockTableDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockTableRepository.insert.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.createOne(mockTableDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle duplicate table numbers', async () => {
      const duplicateError = new Error('Duplicate table number');
      duplicateError.name = 'MongoError';
      mockTableRepository.insert.mockRejectedValue(duplicateError);

      await expect(service.createOne(mockTableDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all tables', async () => {
      const expectedTables = [mockTable];
      mockTableRepository.findAll.mockResolvedValue(expectedTables);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedTables);
    });

    it('should return empty array when no tables exist', async () => {
      mockTableRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on repository error', async () => {
      mockTableRepository.findAll.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a table by ID', async () => {
      mockTableRepository.findOneBy.mockResolvedValue(mockTable);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
      });
      expect(result).toEqual(mockTable);
    });

    it('should throw NotFoundException when table not found', async () => {
      mockTableRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Table with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      mockTableRepository.findOneBy.mockRejectedValue(castError);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new BadRequestException('Invalid ID format'),
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockTableRepository.findOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateOne', () => {
    it('should update a table successfully', async () => {
      const updateData = { number: 5 };
      const updatedTable = { ...mockTable, ...updateData };

      mockTableRepository.updateOneBy.mockResolvedValue(true);
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedTable as any);

      const result = await service.updateOne(
        '507f1f77bcf86cd799439011',
        updateData,
      );

      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        updateData,
      );
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(updatedTable);
    });

    it('should throw NotFoundException when table not found', async () => {
      const updateData = { number: 5 };
      mockTableRepository.updateOneBy.mockResolvedValue(false);

      await expect(
        service.updateOne('nonexistent', updateData),
      ).rejects.toThrow(
        new NotFoundException('Table with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException for update errors', async () => {
      const updateData = { number: 5 };
      const updateError = new Error('Unable to update table');
      mockTableRepository.updateOneBy.mockRejectedValue(updateError);

      await expect(
        service.updateOne('507f1f77bcf86cd799439011', updateData),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const updateData = { number: 5 };
      mockTableRepository.updateOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updateOne('507f1f77bcf86cd799439011', updateData),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle number conflicts during update', async () => {
      const updateData = { number: 999 };
      const conflictError = new Error('Table number already exists');
      mockTableRepository.updateOneBy.mockRejectedValue(conflictError);

      await expect(
        service.updateOne('507f1f77bcf86cd799439011', updateData),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteOne', () => {
    it('should delete a table successfully', async () => {
      mockTableRepository.deleteOneBy.mockResolvedValue(true);

      await expect(
        service.deleteOne('507f1f77bcf86cd799439011'),
      ).resolves.toBeUndefined();

      expect(repository.deleteOneBy).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
      });
    });

    it('should throw NotFoundException when table not found', async () => {
      mockTableRepository.deleteOneBy.mockResolvedValue(false);

      await expect(service.deleteOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Table with ID nonexistent not found'),
      );
    });

    it('should throw InternalServerErrorException for repository errors', async () => {
      mockTableRepository.deleteOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.deleteOne('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle foreign key constraints during deletion', async () => {
      const constraintError = new Error(
        'Cannot delete table with active orders',
      );
      mockTableRepository.deleteOneBy.mockRejectedValue(constraintError);

      await expect(
        service.deleteOne('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
