import { Test, TestingModule } from '@nestjs/testing';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { CardDTO } from 'src/dto/card.dto';
import { FirebaseTokenGuard } from 'src/guards/firebase-token.guard';
import { RolesGuard } from 'src/guards/roles.guard';

// Mock data
const mockCard = {
  _id: 'card123',
  name: 'Menu Entrées',
  dishesId: ['dish1', 'dish2'],
  isActive: true,
  dateOfCreation: '2024-01-01',
  dateLastModified: '2024-01-01',
} as any;

const mockCardDto: CardDTO = {
  name: 'Menu Principal',
  dishesId: ['dish1', 'dish2'],
  isActive: true,
};

// Mock service
const mockCardService = {
  createOne: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
  addDish: jest.fn(),
  removeDish: jest.fn(),
  deleteOne: jest.fn(),
};

describe('CardController', () => {
  let controller: CardController;
  let service: CardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardController],
      providers: [
        {
          provide: CardService,
          useValue: mockCardService,
        },
      ],
    })
      .overrideGuard(FirebaseTokenGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CardController>(CardController);
    service = module.get<CardService>(CardService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOne', () => {
    it('should create a card successfully', async () => {
      const createdCard = { ...mockCard, ...mockCardDto };
      mockCardService.createOne.mockResolvedValue(createdCard);

      const result = await controller.createOne(mockCardDto);

      expect(service.createOne).toHaveBeenCalledWith(mockCardDto);
      expect(result).toEqual({
        error: '',
        data: createdCard,
      });
    });

    it('should handle service errors during creation', async () => {
      mockCardService.createOne.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.createOne(mockCardDto)).rejects.toThrow(
        'Creation failed',
      );
    });

    it('should handle validation errors', async () => {
      const invalidCardDto = { ...mockCardDto, name: '' }; // Invalid name
      mockCardService.createOne.mockRejectedValue(
        new Error('Name is required'),
      );

      await expect(controller.createOne(invalidCardDto)).rejects.toThrow(
        'Name is required',
      );
    });
  });

  describe('findAll', () => {
    it('should return all cards', async () => {
      const expectedCards = [mockCard];
      mockCardService.findAll.mockResolvedValue(expectedCards);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        error: '',
        data: expectedCards,
      });
    });

    it('should return empty array when no cards exist', async () => {
      mockCardService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual({
        error: '',
        data: [],
      });
    });

    it('should handle service errors', async () => {
      mockCardService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return a single card by ID', async () => {
      mockCardService.findOne.mockResolvedValue(mockCard);

      const result = await controller.findOne({ id: 'card123' });

      expect(service.findOne).toHaveBeenCalledWith('card123');
      expect(result).toEqual({
        error: '',
        data: mockCard,
      });
    });

    it('should handle card not found', async () => {
      mockCardService.findOne.mockRejectedValue(new Error('Card not found'));

      await expect(controller.findOne({ id: 'nonexistent' })).rejects.toThrow(
        'Card not found',
      );
    });

    it('should handle invalid ID format', async () => {
      mockCardService.findOne.mockRejectedValue(new Error('Invalid ID format'));

      await expect(controller.findOne({ id: 'invalid' })).rejects.toThrow(
        'Invalid ID format',
      );
    });
  });

  describe('updateOne', () => {
    it('should update a card successfully', async () => {
      const updateData = { name: 'Updated Menu' };
      const updatedCard = { ...mockCard, ...updateData };
      mockCardService.updateOne.mockResolvedValue(updatedCard);

      const result = await controller.updateOne('card123', updateData);

      expect(service.updateOne).toHaveBeenCalledWith('card123', updateData);
      expect(result).toEqual({
        error: '',
        data: updatedCard,
      });
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { isActive: false };
      const updatedCard = { ...mockCard, ...partialUpdate };
      mockCardService.updateOne.mockResolvedValue(updatedCard);

      const result = await controller.updateOne('card123', partialUpdate);

      expect(service.updateOne).toHaveBeenCalledWith('card123', partialUpdate);
      expect(result).toEqual({
        error: '',
        data: updatedCard,
      });
    });

    it('should handle update errors', async () => {
      const updateData = { name: 'Updated Menu' };
      mockCardService.updateOne.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updateOne('card123', updateData)).rejects.toThrow(
        'Update failed',
      );
    });

    it('should handle card not found during update', async () => {
      const updateData = { name: 'Updated Menu' };
      mockCardService.updateOne.mockRejectedValue(
        new Error('Card with ID nonexistent not found'),
      );

      await expect(
        controller.updateOne('nonexistent', updateData),
      ).rejects.toThrow('Card with ID nonexistent not found');
    });
  });

  describe('addDish', () => {
    it('should add a dish to the card successfully', async () => {
      const cardWithNewDish = {
        ...mockCard,
        dishesId: [...mockCard.dishesId, 'dish3'],
      };
      mockCardService.addDish.mockResolvedValue(cardWithNewDish);

      const result = await controller.addDish('card123', 'dish3');

      expect(service.addDish).toHaveBeenCalledWith('card123', 'dish3');
      expect(result).toEqual({
        error: '',
        data: cardWithNewDish,
      });
    });

    it('should handle adding dish that already exists', async () => {
      mockCardService.addDish.mockRejectedValue(
        new Error('Dish with ID dish2 is already in the card'),
      );

      await expect(controller.addDish('card123', 'dish2')).rejects.toThrow(
        'Dish with ID dish2 is already in the card',
      );
    });

    it('should handle card not found when adding dish', async () => {
      mockCardService.addDish.mockRejectedValue(
        new Error('Card with ID nonexistent not found'),
      );

      await expect(controller.addDish('nonexistent', 'dish3')).rejects.toThrow(
        'Card with ID nonexistent not found',
      );
    });

    it('should handle service errors during dish addition', async () => {
      mockCardService.addDish.mockRejectedValue(
        new Error('Unable to add dish to the card'),
      );

      await expect(controller.addDish('card123', 'dish3')).rejects.toThrow(
        'Unable to add dish to the card',
      );
    });
  });

  describe('removeDish', () => {
    it('should remove a dish from the card successfully', async () => {
      const cardWithoutDish = {
        ...mockCard,
        dishesId: ['dish1'], // dish2 removed
      };
      mockCardService.removeDish.mockResolvedValue(cardWithoutDish);

      const result = await controller.removeDish('card123', 'dish2');

      expect(service.removeDish).toHaveBeenCalledWith('card123', 'dish2');
      expect(result).toEqual({
        error: '',
        data: cardWithoutDish,
      });
    });

    it("should handle removing dish that doesn't exist in card", async () => {
      mockCardService.removeDish.mockRejectedValue(
        new Error('Unable to remove dish from the card'),
      );

      await expect(controller.removeDish('card123', 'dish999')).rejects.toThrow(
        'Unable to remove dish from the card',
      );
    });

    it('should handle card not found when removing dish', async () => {
      mockCardService.removeDish.mockRejectedValue(
        new Error('Card with ID nonexistent not found'),
      );

      await expect(
        controller.removeDish('nonexistent', 'dish2'),
      ).rejects.toThrow('Card with ID nonexistent not found');
    });

    it('should handle service errors during dish removal', async () => {
      mockCardService.removeDish.mockRejectedValue(new Error('Database error'));

      await expect(controller.removeDish('card123', 'dish2')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('deleteOne', () => {
    it('should delete a card successfully', async () => {
      mockCardService.deleteOne.mockResolvedValue(undefined);

      await expect(controller.deleteOne('card123')).resolves.toBeUndefined();

      expect(service.deleteOne).toHaveBeenCalledWith('card123');
    });

    it('should handle deletion errors', async () => {
      mockCardService.deleteOne.mockRejectedValue(new Error('Deletion failed'));

      await expect(controller.deleteOne('card123')).rejects.toThrow(
        'Deletion failed',
      );
    });

    it('should handle card not found during deletion', async () => {
      mockCardService.deleteOne.mockRejectedValue(
        new Error('Card with ID nonexistent not found'),
      );

      await expect(controller.deleteOne('nonexistent')).rejects.toThrow(
        'Card with ID nonexistent not found',
      );
    });

    it('should handle invalid ID format during deletion', async () => {
      mockCardService.deleteOne.mockRejectedValue(
        new Error('Invalid ID format'),
      );

      await expect(controller.deleteOne('invalid-id')).rejects.toThrow(
        'Invalid ID format',
      );
    });

    it('should handle database errors during deletion', async () => {
      mockCardService.deleteOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.deleteOne('card123')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
