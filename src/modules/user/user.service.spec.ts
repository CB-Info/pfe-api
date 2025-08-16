import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from 'src/mongo/repositories/user.repository';
import { User, UserRole } from 'src/mongo/models/user.model';
import { UserDTO } from 'src/dto/user.dto';
import { UserUpdateDTO } from 'src/dto/user.update.dto';
import axios from 'axios';

// Mock Firebase
jest.mock('src/configs/firebase.config', () => ({
  __esModule: true,
  default: {
    auth: () => ({
      deleteUser: jest.fn(),
      updateUser: jest.fn(),
    }),
  },
}));

// Mock config
jest.mock('src/configs/config', () => ({
  __esModule: true,
  default: () => ({
    apiKey: 'test-api-key',
  }),
}));

// Mock axios
jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  const mockUserRepository = {
    insert: jest.fn(),
    findOneById: jest.fn(),
    findOneByIdWithFirebaseId: jest.fn(),
    findAll: jest.fn(),
    findManyBy: jest.fn(),
    updateOneBy: jest.fn(),
    deleteOneBy: jest.fn(),
  };

  const mockUser: User = {
    _id: 'user123',
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
    role: UserRole.CUSTOMER,
    phoneNumber: '+1234567890',
    isActive: true,
    firebaseId: 'firebase123',
    dateOfCreation: '2024-01-01',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    const userDto: UserDTO = {
      email: 'new@example.com',
      password: 'password123',
      firstname: 'Jane',
      lastname: 'Smith',
      role: UserRole.CUSTOMER,
      phoneNumber: '+1234567891',
    };

    it('should register a new user successfully', async () => {
      const firebaseResponse = {
        data: { localId: 'firebase123' },
      };

      (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(firebaseResponse);
      mockUserRepository.insert.mockResolvedValue({ _id: 'user123' });
      mockUserRepository.findOneById.mockResolvedValue(mockUser);

      const result = await service.registerUser(userDto);

      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-api-key',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          email: userDto.email,
          password: userDto.password,
          returnSecureToken: true,
        }),
      });

      expect(repository.insert).toHaveBeenCalledWith({
        email: userDto.email,
        firstname: userDto.firstname,
        lastname: userDto.lastname,
        firebaseId: 'firebase123',
        role: UserRole.CUSTOMER,
        phoneNumber: userDto.phoneNumber,
        isActive: true,
      });

      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException when Firebase registration fails', async () => {
      (axios as jest.MockedFunction<typeof axios>).mockRejectedValue(new Error('Firebase error'));

      await expect(service.registerUser(userDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use CUSTOMER role as default when no role provided', async () => {
      const userDtoNoRole = { ...userDto };
      delete userDtoNoRole.role;

      const firebaseResponse = {
        data: { localId: 'firebase123' },
      };

      (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(firebaseResponse);
      mockUserRepository.insert.mockResolvedValue({ _id: 'user123' });
      mockUserRepository.findOneById.mockResolvedValue(mockUser);

      await service.registerUser(userDtoNoRole);

      expect(repository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.CUSTOMER }),
      );
    });
  });

  describe('updateUser', () => {
    const updateDto: UserUpdateDTO = {
      email: 'updated@example.com',
      firstname: 'Updated',
      lastname: 'Name',
    };

    it('should update user successfully', async () => {
      mockUserRepository.updateOneBy.mockResolvedValue(true);
      mockUserRepository.findOneById.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.updateUser('user123', updateDto);

      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        updateDto,
      );
      expect(result).toEqual({ ...mockUser, ...updateDto });
    });

    it('should throw BadRequestException when update fails', async () => {
      mockUserRepository.updateOneBy.mockResolvedValue(false);

      await expect(service.updateUser('user123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      mockUserRepository.findAll.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      const users = [mockUser];
      mockUserRepository.findManyBy.mockResolvedValue(users);

      const result = await service.getUsersByRole(UserRole.CUSTOMER);

      expect(repository.findManyBy).toHaveBeenCalledWith({
        role: UserRole.CUSTOMER,
      });
      expect(result).toEqual(users);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      mockUserRepository.findOneById.mockResolvedValue(mockUser);

      const result = await service.getUserById('user123');

      expect(repository.findOneById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('Permission methods', () => {
    describe('canManageUsers', () => {
      it('should return true for management roles', () => {
        expect(service.canManageUsers(UserRole.ADMIN)).toBe(true);
        expect(service.canManageUsers(UserRole.OWNER)).toBe(true);
        expect(service.canManageUsers(UserRole.MANAGER)).toBe(true);
      });

      it('should return false for non-management roles', () => {
        expect(service.canManageUsers(UserRole.CUSTOMER)).toBe(false);
        expect(service.canManageUsers(UserRole.WAITER)).toBe(false);
        expect(service.canManageUsers(UserRole.KITCHEN_STAFF)).toBe(false);
      });
    });

    describe('canDeleteUsers', () => {
      it('should return true only for admin', () => {
        expect(service.canDeleteUsers(UserRole.ADMIN)).toBe(true);
        expect(service.canDeleteUsers(UserRole.OWNER)).toBe(false);
        expect(service.canDeleteUsers(UserRole.MANAGER)).toBe(false);
      });
    });

    describe('canCreateOwners', () => {
      it('should return true only for admin', () => {
        expect(service.canCreateOwners(UserRole.ADMIN)).toBe(true);
        expect(service.canCreateOwners(UserRole.OWNER)).toBe(false);
      });
    });

    describe('canTakeOrders', () => {
      it('should return true for waiter and above', () => {
        expect(service.canTakeOrders(UserRole.WAITER)).toBe(true);
        expect(service.canTakeOrders(UserRole.MANAGER)).toBe(true);
        expect(service.canTakeOrders(UserRole.OWNER)).toBe(true);
        expect(service.canTakeOrders(UserRole.ADMIN)).toBe(true);
      });

      it('should return false for customer and kitchen staff', () => {
        expect(service.canTakeOrders(UserRole.CUSTOMER)).toBe(false);
        expect(service.canTakeOrders(UserRole.KITCHEN_STAFF)).toBe(false);
      });
    });

    describe('canPrepareOrders', () => {
      it('should return true for kitchen staff and above', () => {
        expect(service.canPrepareOrders(UserRole.KITCHEN_STAFF)).toBe(true);
        expect(service.canPrepareOrders(UserRole.MANAGER)).toBe(true);
        expect(service.canPrepareOrders(UserRole.OWNER)).toBe(true);
        expect(service.canPrepareOrders(UserRole.ADMIN)).toBe(true);
      });

      it('should return false for customer and waiter', () => {
        expect(service.canPrepareOrders(UserRole.CUSTOMER)).toBe(false);
        expect(service.canPrepareOrders(UserRole.WAITER)).toBe(false);
      });
    });
  });

  describe('validateRoleChange', () => {
    it('should throw ForbiddenException when user tries to change own role', () => {
      expect(() =>
        service.validateRoleChange(UserRole.MANAGER, UserRole.ADMIN, true),
      ).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-admin tries to assign admin role', () => {
      expect(() =>
        service.validateRoleChange(UserRole.OWNER, UserRole.ADMIN, false),
      ).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-admin tries to assign owner role', () => {
      expect(() =>
        service.validateRoleChange(UserRole.MANAGER, UserRole.OWNER, false),
      ).toThrow(ForbiddenException);
    });

    it('should allow admin to assign any role', () => {
      expect(() =>
        service.validateRoleChange(UserRole.ADMIN, UserRole.OWNER, false),
      ).not.toThrow();
      expect(() =>
        service.validateRoleChange(UserRole.ADMIN, UserRole.MANAGER, false),
      ).not.toThrow();
    });

    it('should allow owner to assign manager role', () => {
      expect(() =>
        service.validateRoleChange(UserRole.OWNER, UserRole.MANAGER, false),
      ).not.toThrow();
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      mockUserRepository.updateOneBy.mockResolvedValue(true);
      mockUserRepository.findOneById.mockResolvedValue({
        ...mockUser,
        role: UserRole.WAITER,
      });

      const result = await service.updateUserRole(
        'user123',
        UserRole.WAITER,
        UserRole.ADMIN,
        'admin123',
      );

      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { role: UserRole.WAITER },
      );
      expect(result.role).toBe(UserRole.WAITER);
    });

    it('should throw BadRequestException when update fails', async () => {
      mockUserRepository.updateOneBy.mockResolvedValue(false);

      await expect(
        service.updateUserRole(
          'user123',
          UserRole.WAITER,
          UserRole.ADMIN,
          'admin123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate role change permissions', async () => {
      await expect(
        service.updateUserRole(
          'user123',
          UserRole.ADMIN,
          UserRole.OWNER,
          'owner123',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully for admin', async () => {
      const userWithFirebaseId = { ...mockUser, firebaseId: 'firebase123' };
      mockUserRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        userWithFirebaseId,
      );
      mockUserRepository.deleteOneBy.mockResolvedValue(true);

      // Get Firebase mock and setup method mock
      const firebaseMock = require('src/configs/firebase.config').default;
      const deleteUserMock = jest.fn().mockResolvedValue(undefined);
      firebaseMock.auth = jest.fn(() => ({
        deleteUser: deleteUserMock,
      }));

      const result = await service.deleteUser('user123', UserRole.ADMIN);

      expect(repository.findOneByIdWithFirebaseId).toHaveBeenCalledWith(
        'user123',
      );
      expect(deleteUserMock).toHaveBeenCalledWith('firebase123');
      expect(repository.deleteOneBy).toHaveBeenCalledWith({ _id: 'user123' });
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException for non-admin users', async () => {
      await expect(
        service.deleteUser('user123', UserRole.OWNER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should continue with MongoDB deletion if Firebase deletion fails', async () => {
      const userWithFirebaseId = { ...mockUser, firebaseId: 'firebase123' };
      mockUserRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        userWithFirebaseId,
      );
      mockUserRepository.deleteOneBy.mockResolvedValue(true);

      const firebaseMock = require('src/configs/firebase.config').default;
      const deleteUserMock = jest.fn().mockRejectedValue(new Error('Firebase error'));
      firebaseMock.auth = jest.fn(() => ({
        deleteUser: deleteUserMock,
      }));

      const result = await service.deleteUser('user123', UserRole.ADMIN);

      expect(result).toBe(true);
    });

    it('should skip Firebase deletion for invalid Firebase ID', async () => {
      const userWithInvalidFirebaseId = { ...mockUser, firebaseId: '' };
      mockUserRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        userWithInvalidFirebaseId,
      );
      mockUserRepository.deleteOneBy.mockResolvedValue(true);

      const result = await service.deleteUser('user123', UserRole.ADMIN);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepository.findOneByIdWithFirebaseId.mockResolvedValue(null);

      await expect(
        service.deleteUser('user123', UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const userWithFirebaseId = { ...mockUser, firebaseId: 'firebase123' };
      mockUserRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        userWithFirebaseId,
      );
      mockUserRepository.updateOneBy.mockResolvedValue(true);
      mockUserRepository.findOneById.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const firebaseMock = require('src/configs/firebase.config').default;
      const updateUserMock = jest.fn().mockResolvedValue(undefined);
      firebaseMock.auth = jest.fn(() => ({
        updateUser: updateUserMock,
      }));

      const result = await service.deactivateUser('user123');

      expect(repository.findOneByIdWithFirebaseId).toHaveBeenCalledWith(
        'user123',
      );
      expect(updateUserMock).toHaveBeenCalledWith(
        'firebase123',
        { disabled: true },
      );
      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { isActive: false },
      );
      expect(result.isActive).toBe(false);
    });

    it('should continue with MongoDB deactivation if Firebase fails', async () => {
      const userWithFirebaseId = { ...mockUser, firebaseId: 'firebase123' };
      mockUserRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        userWithFirebaseId,
      );
      mockUserRepository.updateOneBy.mockResolvedValue(true);
      mockUserRepository.findOneById.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const firebaseMock = require('src/configs/firebase.config').default;
      const updateUserMock = jest.fn().mockRejectedValue(new Error('Firebase error'));
      firebaseMock.auth = jest.fn(() => ({
        updateUser: updateUserMock,
      }));

      const result = await service.deactivateUser('user123');

      expect(result.isActive).toBe(false);
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const userWithFirebaseId = { ...mockUser, firebaseId: 'firebase123' };
      mockUserRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        userWithFirebaseId,
      );
      mockUserRepository.updateOneBy.mockResolvedValue(true);
      mockUserRepository.findOneById.mockResolvedValue({
        ...mockUser,
        isActive: true,
      });

      const firebaseMock = require('src/configs/firebase.config').default;
      const updateUserMock = jest.fn().mockResolvedValue(undefined);
      firebaseMock.auth = jest.fn(() => ({
        updateUser: updateUserMock,
      }));

      const result = await service.activateUser('user123');

      expect(updateUserMock).toHaveBeenCalledWith(
        'firebase123',
        { disabled: false },
      );
      expect(repository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { isActive: true },
      );
      expect(result.isActive).toBe(true);
    });
  });

  describe('Legacy methods', () => {
    describe('isAdmin', () => {
      it('should return true only for admin role', () => {
        expect(service.isAdmin(UserRole.ADMIN)).toBe(true);
        expect(service.isAdmin(UserRole.OWNER)).toBe(false);
        expect(service.isAdmin(UserRole.MANAGER)).toBe(false);
      });
    });

    describe('isManagement', () => {
      it('should return true for management roles', () => {
        expect(service.isManagement(UserRole.ADMIN)).toBe(true);
        expect(service.isManagement(UserRole.OWNER)).toBe(true);
        expect(service.isManagement(UserRole.MANAGER)).toBe(true);
        expect(service.isManagement(UserRole.CUSTOMER)).toBe(false);
      });
    });
  });
});
