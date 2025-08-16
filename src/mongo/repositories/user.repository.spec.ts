import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from './user.repository';
import { User, UserRole } from '../models/user.model';

describe('UserRepository', () => {
  let repository: UserRepository;
  let model: Model<User>;

  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
    role: UserRole.CUSTOMER,
    phoneNumber: '+1234567890',
    isActive: true,
    firebaseId: 'firebase123',
    dateOfCreation: '2024-01-01',
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
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getModelToken('User'),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    model = module.get<Model<User>>(getModelToken('User'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('insert', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        firstname: 'Jane',
        lastname: 'Smith',
        role: UserRole.CUSTOMER,
        phoneNumber: '+1234567891',
        isActive: true,
        firebaseId: 'firebase456',
      };

      mockModel.create.mockResolvedValue(mockUser);

      const result = await repository.insert(userData);

      expect(model.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockUser);
    });

    it('should handle creation errors', async () => {
      const userData = {
        email: 'duplicate@example.com',
        firstname: 'Jane',
        lastname: 'Smith',
        role: UserRole.CUSTOMER,
      };

      mockModel.create.mockRejectedValue(new Error('Duplicate email'));

      await expect(repository.insert(userData)).rejects.toThrow('Duplicate email');
    });
  });

  describe('findOneById', () => {
    it('should find user by ID', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await repository.findOneById('user123');

      expect(model.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findOneById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findOneByIdWithFirebaseId', () => {
    it('should find user by ID with specific fields', async () => {
      const userWithFirebaseId = {
        _id: 'user123',
        firebaseId: 'firebase123',
      };

      mockModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(userWithFirebaseId),
        }),
      });

      const result = await repository.findOneByIdWithFirebaseId('user123');

      expect(model.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(userWithFirebaseId);
    });
  });

  describe('findOneBy', () => {
    it('should find user by criteria', async () => {
      const criteria = { email: 'test@example.com' };

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await repository.findOneBy(criteria);

      expect(model.findOne).toHaveBeenCalledWith(criteria);
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user matches criteria', async () => {
      const criteria = { email: 'nonexistent@example.com' };

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findOneBy(criteria);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];

      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(users),
      });

      const result = await repository.findAll();

      expect(model.find).toHaveBeenCalledWith({});
      expect(result).toEqual(users);
    });

    it('should return empty array when no users exist', async () => {
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findManyBy', () => {
    it('should find users by criteria', async () => {
      const criteria = { role: UserRole.CUSTOMER };
      const users = [mockUser];

      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(users),
      });

      const result = await repository.findManyBy(criteria);

      expect(model.find).toHaveBeenCalledWith(criteria);
      expect(result).toEqual(users);
    });

    it('should return empty array when no users match', async () => {
      const criteria = { role: UserRole.ADMIN };

      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findManyBy(criteria);

      expect(result).toEqual([]);
    });
  });

  describe('updateOneBy', () => {
    it('should update user successfully', async () => {
      const criteria = { _id: 'user123' };
      const updateData = { firstname: 'Updated' };

      mockModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      const result = await repository.updateOneBy(criteria, updateData);

      expect(model.updateOne).toHaveBeenCalledWith(criteria, updateData);
      expect(result).toBe(true);
    });

    it('should return false when no user updated', async () => {
      const criteria = { _id: 'nonexistent' };
      const updateData = { firstname: 'Updated' };

      mockModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });

      const result = await repository.updateOneBy(criteria, updateData);

      expect(result).toBe(false);
    });

    it('should handle update errors', async () => {
      const criteria = { _id: 'user123' };
      const updateData = { email: 'invalid-email' };

      mockModel.updateOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Validation failed')),
      });

      await expect(repository.updateOneBy(criteria, updateData)).rejects.toThrow('Validation failed');
    });
  });

  describe('deleteOneBy', () => {
    it('should delete user successfully', async () => {
      const criteria = { _id: 'user123' };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      const result = await repository.deleteOneBy(criteria);

      expect(model.deleteOne).toHaveBeenCalledWith(criteria);
      expect(result).toBe(true);
    });

    it('should return false when no user deleted', async () => {
      const criteria = { _id: 'nonexistent' };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      });

      const result = await repository.deleteOneBy(criteria);

      expect(result).toBe(false);
    });

    it('should handle deletion errors', async () => {
      const criteria = { _id: 'user123' };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(repository.deleteOneBy(criteria)).rejects.toThrow('Database error');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty criteria in findManyBy', async () => {
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.findManyBy({});

      expect(model.find).toHaveBeenCalledWith({});
      expect(result).toEqual([mockUser]);
    });

    it('should handle undefined update data', async () => {
      const criteria = { _id: 'user123' };

      mockModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });

      const result = await repository.updateOneBy(criteria, undefined);

      expect(model.updateOne).toHaveBeenCalledWith(criteria, undefined);
      expect(result).toBe(false);
    });

    it('should handle complex query criteria', async () => {
      const complexCriteria = {
        role: { $in: [UserRole.CUSTOMER, UserRole.WAITER] },
        isActive: true,
        'dateOfCreation': { $gte: '2024-01-01' },
      };

      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.findManyBy(complexCriteria);

      expect(model.find).toHaveBeenCalledWith(complexCriteria);
      expect(result).toEqual([mockUser]);
    });
  });
});