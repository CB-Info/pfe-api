import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CardService } from './card.service';
import { CardRepository } from 'src/mongo/repositories/card.repository';
import { CardDTO } from 'src/dto/card.dto';

// Mock data with valid ObjectIds
const mockCard = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Menu Entrées',
  dishesId: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
  isActive: true,
  dateOfCreation: '2024-01-01',
  dateLastModified: '2024-01-01',
} as any;

const mockCardDto: CardDTO = {
  name: 'Menu Principal',
  dishesId: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
  isActive: true,
};

// Mock repository
const mockCardRepository = {
  insert: jest.fn(),
  findAll: jest.fn(),
  findOneBy: jest.fn(),
  updateOneBy: jest.fn(),
  deleteOneBy: jest.fn(),
  pushArray: jest.fn(),
  pullArray: jest.fn(),
};

describe('CardService', () => {
  let service: CardService;
  let repository: CardRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        {
          provide: CardRepository,
          useValue: mockCardRepository,
        },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
    repository = module.get<CardRepository>(CardRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOne', () => {
    it('should create a card successfully', async () => {
      const mockCreatedCard = {
        ...mockCard,
        toObject: jest.fn().mockReturnValue({
          _id: 'card123',
          name: mockCardDto.name,
          dishesId: mockCardDto.dishesId,
          isActive: mockCardDto.isActive,
        }),
      };

      mockCardRepository.insert.mockResolvedValue(mockCreatedCard);

      const result = await service.createOne(mockCardDto);

      expect(repository.insert).toHaveBeenCalledWith({
        name: mockCardDto.name,
        dishesId: mockCardDto.dishesId,
        isActive: mockCardDto.isActive,
      });
      expect(mockCreatedCard.toObject).toHaveBeenCalledWith({
        versionKey: false,
      });
      expect(result).toEqual({
        _id: 'card123',
        name: mockCardDto.name,
        dishesId: mockCardDto.dishesId,
        isActive: mockCardDto.isActive,
      });
    });

    it('should throw BadRequestException for validation errors', async () => {
      const validationError = new Error('Name is required');
      validationError.name = 'ValidationError';
      mockCardRepository.insert.mockRejectedValue(validationError);

      await expect(service.createOne(mockCardDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockCardRepository.insert.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.createOne(mockCardDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all cards with populated dishes', async () => {
      const expectedCards = [mockCard];
      mockCardRepository.findAll.mockResolvedValue(expectedCards);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalledWith({
        populate: ['dishesId'],
      });
      expect(result).toEqual(expectedCards);
    });

    it('should return empty array when no cards exist', async () => {
      mockCardRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on repository error', async () => {
      mockCardRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a card by ID with populated dishes', async () => {
      mockCardRepository.findOneBy.mockResolvedValue(mockCard);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(repository.findOneBy).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        { populate: ['dishesId'] },
      );
      expect(result).toEqual(mockCard);
    });

    it('should throw NotFoundException when card not found', async () => {
      mockCardRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Card with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      mockCardRepository.findOneBy.mockRejectedValue(castError);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new BadRequestException('Invalid ID format'),
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockCardRepository.findOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findOne('card123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateOne', () => {
    it('should update a card successfully', async () => {
      const updateData = { name: 'Updated Menu' };
      const updatedCard = { ...mockCard, ...updateData };

      mockCardRepository.updateOneBy.mockResolvedValue(true);
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedCard as any);

      const result = await service.updateOne('card123', updateData);

      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'card123' },
        updateData,
      );
      expect(service.findOne).toHaveBeenCalledWith('card123');
      expect(result).toEqual(updatedCard);
    });

    it('should throw NotFoundException when card not found', async () => {
      const updateData = { name: 'Updated Menu' };
      mockCardRepository.updateOneBy.mockResolvedValue(false);

      await expect(
        service.updateOne('nonexistent', updateData),
      ).rejects.toThrow(
        new NotFoundException('Card with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException for cast errors', async () => {
      const updateData = { name: 'Updated Menu' };
      const error = new Error('CastError');
      error.message = 'CastError';
      mockCardRepository.updateOneBy.mockRejectedValue(error);

      await expect(service.updateOne('card123', updateData)).rejects.toThrow(
        new BadRequestException('Invalid ID format'),
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const updateData = { name: 'Updated Menu' };
      mockCardRepository.updateOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.updateOne('card123', updateData)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('addDish', () => {
    it('should add a dish to the card successfully', async () => {
      const cardWithoutDish = {
        ...mockCard,
        dishesId: ['507f1f77bcf86cd799439012'], // Only one dish initially
      };
      const cardWithNewDish = {
        ...mockCard,
        dishesId: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439014'], // New dish added
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(cardWithoutDish as any) // First call for checking
        .mockResolvedValueOnce(cardWithNewDish as any); // Second call for returning result

      mockCardRepository.pushArray.mockResolvedValue(true);

      const result = await service.addDish(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439014',
      );

      expect(service.findOne).toHaveBeenNthCalledWith(
        1,
        '507f1f77bcf86cd799439011',
      );
      expect(repository.pushArray).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        { dishesId: new Types.ObjectId('507f1f77bcf86cd799439014') },
      );
      expect(service.findOne).toHaveBeenNthCalledWith(
        2,
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(cardWithNewDish);
    });

    it('should throw NotFoundException when card not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      await expect(service.addDish('nonexistent', 'dish2')).rejects.toThrow(
        new NotFoundException('Card with ID nonexistent not found'),
      );
    });

    it('should throw BadRequestException when dish already exists in card', async () => {
      const cardWithDish = {
        ...mockCard,
        dishesId: [new Types.ObjectId('507f1f77bcf86cd799439014')], // Dish already exists
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(cardWithDish as any);

      await expect(
        service.addDish('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439014'),
      ).rejects.toThrow(
        new BadRequestException(
          'Dish with ID 507f1f77bcf86cd799439014 is already in the card',
        ),
      );
    });

    it('should throw InternalServerErrorException when unable to add dish', async () => {
      const cardWithoutDish = {
        ...mockCard,
        dishesId: ['507f1f77bcf86cd799439012'],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(cardWithoutDish as any);
      mockCardRepository.pushArray.mockResolvedValue(false);

      await expect(
        service.addDish('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439014'),
      ).rejects.toThrow(
        new InternalServerErrorException('Unable to add dish to the card'),
      );
    });

    it('should handle repository errors during add', async () => {
      const cardWithoutDish = {
        ...mockCard,
        dishesId: ['507f1f77bcf86cd799439012'],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(cardWithoutDish as any);
      mockCardRepository.pushArray.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.addDish('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439014'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('removeDish', () => {
    it('should remove a dish from the card successfully', async () => {
      const cardWithRemovedDish = {
        ...mockCard,
        dishesId: ['507f1f77bcf86cd799439012'], // Only one dish remaining
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(cardWithRemovedDish as any);
      mockCardRepository.pullArray.mockResolvedValue(true);

      const result = await service.removeDish(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013',
      );

      expect(repository.pullArray).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        { dishesId: new Types.ObjectId('507f1f77bcf86cd799439013') },
      );
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(cardWithRemovedDish);
    });

    it('should throw BadRequestException when unable to remove dish', async () => {
      mockCardRepository.pullArray.mockResolvedValue(false);

      await expect(
        service.removeDish(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439013',
        ),
      ).rejects.toThrow(
        new BadRequestException('Unable to remove dish from the card'),
      );
    });

    it('should handle repository errors during removal', async () => {
      mockCardRepository.pullArray.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.removeDish(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439013',
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteOne', () => {
    it('should delete a card successfully', async () => {
      mockCardRepository.deleteOneBy.mockResolvedValue(true);

      await expect(
        service.deleteOne('507f1f77bcf86cd799439011'),
      ).resolves.toBeUndefined();

      expect(repository.deleteOneBy).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
      });
    });

    it('should throw NotFoundException when card not found', async () => {
      mockCardRepository.deleteOneBy.mockResolvedValue(false);

      await expect(service.deleteOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Card with ID nonexistent not found'),
      );
    });

    it('should throw InternalServerErrorException for repository errors', async () => {
      mockCardRepository.deleteOneBy.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.deleteOne('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
