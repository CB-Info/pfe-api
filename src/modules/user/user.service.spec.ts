import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from '../../mongo/repositories/user.repository';
import { UserRole, User } from '../../mongo/models/user.model';
import { UserDTO } from '../../dto/user.dto';
import { UserUpdateDTO } from '../../dto/user.update.dto';

// Mock Firebase auth methods
const mockFirebaseDeleteUser = jest.fn();
const mockFirebaseUpdateUser = jest.fn();

// Mock Firebase admin
jest.mock('../../configs/firebase.config', () => ({
  __esModule: true,
  default: {
    auth: () => ({
      deleteUser: mockFirebaseDeleteUser,
      updateUser: mockFirebaseUpdateUser,
    }),
  },
}));

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = jest.mocked(axios);

// Mock config
jest.mock('../../configs/config', () => ({
  __esModule: true,
  default: () => ({
    apiKey: 'test-api-key',
  }),
}));

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser: Partial<User> & { _id: string } = {
    _id: 'user123',
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
    role: UserRole.CUSTOMER,
    firebaseId: 'firebase123',
    phoneNumber: '+1234567890',
    isActive: true,
    dateOfCreation: '2024-01-01',
  };

  const mockUserRepository = {
    insert: jest.fn(),
    findOneById: jest.fn(),
    findOneBy: jest.fn(),
    findOneByIdWithFirebaseId: jest.fn(),
    updateOneBy: jest.fn(),
    findAll: jest.fn(),
    findManyBy: jest.fn(),
    deleteOneBy: jest.fn(),
  };

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
    userRepository = module.get(UserRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const mockUserDTO: UserDTO = {
      email: 'test@example.com',
      password: 'password123',
      firstname: 'John',
      lastname: 'Doe',
      role: UserRole.WAITER,
      phoneNumber: '+1234567890',
    };

    const mockFirebaseResponse = {
      data: {
        localId: 'firebase123',
      },
    };

    beforeEach(() => {
      mockedAxios.mockResolvedValue(mockFirebaseResponse);
      userRepository.insert.mockResolvedValue({ _id: 'user123' } as any);
      userRepository.findOneById.mockResolvedValue(mockUser as User);
    });

    it('should register a user successfully with specified role', async () => {
      const result = await service.registerUser(mockUserDTO);

      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-api-key',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          email: mockUserDTO.email,
          password: mockUserDTO.password,
          returnSecureToken: true,
        }),
      });

      expect(userRepository.insert).toHaveBeenCalledWith({
        email: mockUserDTO.email,
        firstname: mockUserDTO.firstname,
        lastname: mockUserDTO.lastname,
        firebaseId: 'firebase123',
        role: UserRole.WAITER,
        phoneNumber: mockUserDTO.phoneNumber,
        isActive: true,
      });

      expect(result).toEqual(mockUser);
    });

    it('should register a user with default CUSTOMER role when no role specified', async () => {
      const userDTOWithoutRole = { ...mockUserDTO };
      delete userDTOWithoutRole.role;

      await service.registerUser(userDTOWithoutRole);

      expect(userRepository.insert).toHaveBeenCalledWith({
        email: mockUserDTO.email,
        firstname: mockUserDTO.firstname,
        lastname: mockUserDTO.lastname,
        firebaseId: 'firebase123',
        role: UserRole.CUSTOMER,
        phoneNumber: mockUserDTO.phoneNumber,
        isActive: true,
      });
    });

    it('should throw BadRequestException when Firebase registration fails', async () => {
      mockedAxios.mockRejectedValue(new Error('Firebase error'));

      await expect(service.registerUser(mockUserDTO)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when database insertion fails', async () => {
      userRepository.insert.mockRejectedValue(new Error('Database error'));

      await expect(service.registerUser(mockUserDTO)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateUser', () => {
    const mockUpdateDTO: UserUpdateDTO = {
      email: 'updated@example.com',
      firstname: 'Jane',
      lastname: 'Smith',
      role: UserRole.MANAGER,
      phoneNumber: '+0987654321',
      isActive: false,
    };

    it('should update user successfully', async () => {
      userRepository.updateOneBy.mockResolvedValue(true);
      userRepository.findOneById.mockResolvedValue(mockUser as User);

      const result = await service.updateUser('user123', mockUpdateDTO);

      expect(userRepository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        mockUpdateDTO,
      );
      expect(userRepository.findOneById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException when update fails', async () => {
      userRepository.updateOneBy.mockResolvedValue(false);

      await expect(
        service.updateUser('user123', mockUpdateDTO),
      ).rejects.toThrow(BadRequestException);

      expect(userRepository.findOneById).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [mockUser, { ...mockUser, _id: 'user456' }] as User[];
      userRepository.findAll.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers();

      expect(userRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUsersByRole', () => {
    it('should return users filtered by role', async () => {
      const mockWaiters = [
        { ...mockUser, role: UserRole.WAITER },
        { ...mockUser, _id: 'user456', role: UserRole.WAITER },
      ] as User[];
      userRepository.findManyBy.mockResolvedValue(mockWaiters);

      const result = await service.getUsersByRole(UserRole.WAITER);

      expect(userRepository.findManyBy).toHaveBeenCalledWith({
        role: UserRole.WAITER,
      });
      expect(result).toEqual(mockWaiters);
    });
  });

  describe('Permission Methods', () => {
    describe('canManageUsers', () => {
      it('should return true for management roles', () => {
        expect(service.canManageUsers(UserRole.ADMIN)).toBe(true);
        expect(service.canManageUsers(UserRole.OWNER)).toBe(true);
        expect(service.canManageUsers(UserRole.MANAGER)).toBe(true);
      });

      it('should return false for non-management roles', () => {
        expect(service.canManageUsers(UserRole.WAITER)).toBe(false);
        expect(service.canManageUsers(UserRole.KITCHEN_STAFF)).toBe(false);
        expect(service.canManageUsers(UserRole.CUSTOMER)).toBe(false);
      });
    });

    describe('canChangeRoles', () => {
      it('should return true for management roles', () => {
        expect(service.canChangeRoles(UserRole.ADMIN)).toBe(true);
        expect(service.canChangeRoles(UserRole.OWNER)).toBe(true);
        expect(service.canChangeRoles(UserRole.MANAGER)).toBe(true);
      });

      it('should return false for non-management roles', () => {
        expect(service.canChangeRoles(UserRole.WAITER)).toBe(false);
        expect(service.canChangeRoles(UserRole.KITCHEN_STAFF)).toBe(false);
        expect(service.canChangeRoles(UserRole.CUSTOMER)).toBe(false);
      });
    });

    describe('canDeleteUsers', () => {
      it('should return true only for admin role', () => {
        expect(service.canDeleteUsers(UserRole.ADMIN)).toBe(true);
      });

      it('should return false for all other roles', () => {
        expect(service.canDeleteUsers(UserRole.OWNER)).toBe(false);
        expect(service.canDeleteUsers(UserRole.MANAGER)).toBe(false);
        expect(service.canDeleteUsers(UserRole.WAITER)).toBe(false);
        expect(service.canDeleteUsers(UserRole.KITCHEN_STAFF)).toBe(false);
        expect(service.canDeleteUsers(UserRole.CUSTOMER)).toBe(false);
      });
    });

    describe('canCreateOwners', () => {
      it('should return true only for admin role', () => {
        expect(service.canCreateOwners(UserRole.ADMIN)).toBe(true);
      });

      it('should return false for all other roles', () => {
        expect(service.canCreateOwners(UserRole.OWNER)).toBe(false);
        expect(service.canCreateOwners(UserRole.MANAGER)).toBe(false);
        expect(service.canCreateOwners(UserRole.WAITER)).toBe(false);
        expect(service.canCreateOwners(UserRole.KITCHEN_STAFF)).toBe(false);
        expect(service.canCreateOwners(UserRole.CUSTOMER)).toBe(false);
      });
    });

    describe('canManageOrders', () => {
      it('should return true for all roles', () => {
        expect(service.canManageOrders(UserRole.ADMIN)).toBe(true);
        expect(service.canManageOrders(UserRole.OWNER)).toBe(true);
        expect(service.canManageOrders(UserRole.MANAGER)).toBe(true);
        expect(service.canManageOrders(UserRole.WAITER)).toBe(true);
        expect(service.canManageOrders(UserRole.KITCHEN_STAFF)).toBe(true);
        expect(service.canManageOrders(UserRole.CUSTOMER)).toBe(true);
      });
    });

    describe('canTakeOrders', () => {
      it('should return true for waiter and above', () => {
        expect(service.canTakeOrders(UserRole.ADMIN)).toBe(true);
        expect(service.canTakeOrders(UserRole.OWNER)).toBe(true);
        expect(service.canTakeOrders(UserRole.MANAGER)).toBe(true);
        expect(service.canTakeOrders(UserRole.WAITER)).toBe(true);
      });

      it('should return false for kitchen staff and customer', () => {
        expect(service.canTakeOrders(UserRole.KITCHEN_STAFF)).toBe(false);
        expect(service.canTakeOrders(UserRole.CUSTOMER)).toBe(false);
      });
    });

    describe('canPrepareOrders', () => {
      it('should return true for kitchen staff and above', () => {
        expect(service.canPrepareOrders(UserRole.ADMIN)).toBe(true);
        expect(service.canPrepareOrders(UserRole.OWNER)).toBe(true);
        expect(service.canPrepareOrders(UserRole.MANAGER)).toBe(true);
        expect(service.canPrepareOrders(UserRole.KITCHEN_STAFF)).toBe(true);
      });

      it('should return false for waiter and customer', () => {
        expect(service.canPrepareOrders(UserRole.WAITER)).toBe(false);
        expect(service.canPrepareOrders(UserRole.CUSTOMER)).toBe(false);
      });
    });

    describe('canSuperviseRestaurant', () => {
      it('should return true for owner and admin', () => {
        expect(service.canSuperviseRestaurant(UserRole.ADMIN)).toBe(true);
        expect(service.canSuperviseRestaurant(UserRole.OWNER)).toBe(true);
      });

      it('should return false for all other roles', () => {
        expect(service.canSuperviseRestaurant(UserRole.MANAGER)).toBe(false);
        expect(service.canSuperviseRestaurant(UserRole.WAITER)).toBe(false);
        expect(service.canSuperviseRestaurant(UserRole.KITCHEN_STAFF)).toBe(
          false,
        );
        expect(service.canSuperviseRestaurant(UserRole.CUSTOMER)).toBe(false);
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
      expect(() =>
        service.validateRoleChange(UserRole.MANAGER, UserRole.ADMIN, false),
      ).toThrow(ForbiddenException);
    });

    it('should allow admin to assign admin role', () => {
      expect(() =>
        service.validateRoleChange(UserRole.ADMIN, UserRole.ADMIN, false),
      ).not.toThrow();
    });

    it('should throw ForbiddenException when non-admin tries to assign owner role', () => {
      expect(() =>
        service.validateRoleChange(UserRole.OWNER, UserRole.OWNER, false),
      ).toThrow(ForbiddenException);
      expect(() =>
        service.validateRoleChange(UserRole.MANAGER, UserRole.OWNER, false),
      ).toThrow(ForbiddenException);
    });

    it('should allow admin to assign owner role', () => {
      expect(() =>
        service.validateRoleChange(UserRole.ADMIN, UserRole.OWNER, false),
      ).not.toThrow();
    });

    it('should throw ForbiddenException when non-admin/owner tries to assign manager role', () => {
      expect(() =>
        service.validateRoleChange(UserRole.MANAGER, UserRole.MANAGER, false),
      ).toThrow(ForbiddenException);
      expect(() =>
        service.validateRoleChange(UserRole.WAITER, UserRole.MANAGER, false),
      ).toThrow(ForbiddenException);
    });

    it('should allow admin and owner to assign manager role', () => {
      expect(() =>
        service.validateRoleChange(UserRole.ADMIN, UserRole.MANAGER, false),
      ).not.toThrow();
      expect(() =>
        service.validateRoleChange(UserRole.OWNER, UserRole.MANAGER, false),
      ).not.toThrow();
    });

    it('should throw ForbiddenException when non-management tries to change roles', () => {
      expect(() =>
        service.validateRoleChange(UserRole.CUSTOMER, UserRole.WAITER, false),
      ).toThrow(ForbiddenException);
      expect(() =>
        service.validateRoleChange(
          UserRole.WAITER,
          UserRole.KITCHEN_STAFF,
          false,
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully when admin updates any role', async () => {
      userRepository.updateOneBy.mockResolvedValue(true);
      userRepository.findOneById.mockResolvedValue(mockUser as User);

      const result = await service.updateUserRole(
        'user123',
        UserRole.OWNER,
        UserRole.ADMIN,
        'admin123',
      );

      expect(userRepository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { role: UserRole.OWNER },
      );
      expect(userRepository.findOneById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    it('should update user role successfully when owner updates manager role', async () => {
      userRepository.updateOneBy.mockResolvedValue(true);
      userRepository.findOneById.mockResolvedValue(mockUser as User);

      const result = await service.updateUserRole(
        'user123',
        UserRole.MANAGER,
        UserRole.OWNER,
        'owner123',
      );

      expect(userRepository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { role: UserRole.MANAGER },
      );
      expect(userRepository.findOneById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    it('should update user role successfully when manager updates waiter role', async () => {
      userRepository.updateOneBy.mockResolvedValue(true);
      userRepository.findOneById.mockResolvedValue(mockUser as User);

      const result = await service.updateUserRole(
        'user123',
        UserRole.WAITER,
        UserRole.MANAGER,
        'manager123',
      );

      expect(userRepository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { role: UserRole.WAITER },
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw ForbiddenException when user tries to change own role', async () => {
      await expect(
        service.updateUserRole(
          'user123',
          UserRole.ADMIN,
          UserRole.MANAGER,
          'user123',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(userRepository.updateOneBy).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when non-admin tries to assign admin role', async () => {
      await expect(
        service.updateUserRole(
          'user123',
          UserRole.ADMIN,
          UserRole.OWNER,
          'owner123',
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.updateUserRole(
          'user123',
          UserRole.ADMIN,
          UserRole.MANAGER,
          'manager123',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-admin tries to assign owner role', async () => {
      await expect(
        service.updateUserRole(
          'user123',
          UserRole.OWNER,
          UserRole.MANAGER,
          'manager123',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when update fails', async () => {
      userRepository.updateOneBy.mockResolvedValue(false);

      await expect(
        service.updateUserRole(
          'user123',
          UserRole.WAITER,
          UserRole.ADMIN,
          'admin123',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      mockFirebaseDeleteUser.mockReset();
    });

    it('should delete user successfully from both Firebase and MongoDB when called by admin', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUser as User,
      );
      userRepository.deleteOneBy.mockResolvedValue(true);
      mockFirebaseDeleteUser.mockResolvedValue(true);

      const result = await service.deleteUser('user123', UserRole.ADMIN);

      expect(userRepository.findOneByIdWithFirebaseId).toHaveBeenCalledWith(
        'user123',
      );
      expect(mockFirebaseDeleteUser).toHaveBeenCalledWith('firebase123');
      expect(userRepository.deleteOneBy).toHaveBeenCalledWith({
        _id: 'user123',
      });
      expect(result).toBe(true);
    });

    it('should continue deletion even when Firebase deletion fails', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUser as User,
      );
      userRepository.deleteOneBy.mockResolvedValue(true);
      mockFirebaseDeleteUser.mockRejectedValue(new Error('Firebase error'));

      const result = await service.deleteUser('user123', UserRole.ADMIN);

      expect(result).toBe(true);
      expect(userRepository.deleteOneBy).toHaveBeenCalledWith({
        _id: 'user123',
      });
      expect(mockFirebaseDeleteUser).toHaveBeenCalledWith('firebase123');
    });

    it('should throw BadRequestException when database deletion fails', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUser as User,
      );
      userRepository.deleteOneBy.mockResolvedValue(false);
      mockFirebaseDeleteUser.mockResolvedValue(true);

      await expect(
        service.deleteUser('user123', UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);

      expect(mockFirebaseDeleteUser).toHaveBeenCalledWith('firebase123');
    });

    it('should throw BadRequestException when user not found', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(null);

      await expect(
        service.deleteUser('user123', UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);

      expect(mockFirebaseDeleteUser).not.toHaveBeenCalled();
    });

    it('should continue deletion when Firebase ID is invalid or missing', async () => {
      const mockUserWithoutFirebaseId = { ...mockUser, firebaseId: '' };
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUserWithoutFirebaseId as User,
      );
      userRepository.deleteOneBy.mockResolvedValue(true);

      const result = await service.deleteUser('user123', UserRole.ADMIN);

      expect(result).toBe(true);
      expect(userRepository.deleteOneBy).toHaveBeenCalledWith({
        _id: 'user123',
      });
      expect(mockFirebaseDeleteUser).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when non-admin user tries to delete', async () => {
      await expect(
        service.deleteUser('user123', UserRole.OWNER),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.deleteUser('user123', UserRole.MANAGER),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.deleteUser('user123', UserRole.CUSTOMER),
      ).rejects.toThrow(ForbiddenException);

      expect(mockFirebaseDeleteUser).not.toHaveBeenCalled();
    });
  });

  describe('deactivateUser', () => {
    beforeEach(() => {
      mockFirebaseUpdateUser.mockReset();
    });

    it('should deactivate user successfully in both MongoDB and Firebase', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUser as User,
      );
      userRepository.updateOneBy.mockResolvedValue(true);
      userRepository.findOneById.mockResolvedValue(mockUser as User);
      mockFirebaseUpdateUser.mockResolvedValue(undefined);

      const result = await service.deactivateUser('user123');

      expect(userRepository.findOneByIdWithFirebaseId).toHaveBeenCalledWith(
        'user123',
      );
      expect(mockFirebaseUpdateUser).toHaveBeenCalledWith('firebase123', {
        disabled: true,
      });
      expect(userRepository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { isActive: false },
      );
      expect(result).toEqual(mockUser);
    });

    it('should continue deactivation even when Firebase fails', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUser as User,
      );
      userRepository.updateOneBy.mockResolvedValue(true);
      userRepository.findOneById.mockResolvedValue(mockUser as User);
      mockFirebaseUpdateUser.mockRejectedValue(new Error('Firebase error'));

      const result = await service.deactivateUser('user123');

      expect(userRepository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { isActive: false },
      );
      expect(result).toEqual(mockUser);
    });

    it('should skip Firebase deactivation when Firebase ID is invalid', async () => {
      const mockUserWithoutFirebaseId = { ...mockUser, firebaseId: '' };
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUserWithoutFirebaseId as User,
      );
      userRepository.updateOneBy.mockResolvedValue(true);
      userRepository.findOneById.mockResolvedValue(mockUser as User);

      const result = await service.deactivateUser('user123');

      expect(mockFirebaseUpdateUser).not.toHaveBeenCalled();
      expect(userRepository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { isActive: false },
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException when user not found', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(null);

      await expect(service.deactivateUser('user123')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockFirebaseUpdateUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when MongoDB deactivation fails', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUser as User,
      );
      userRepository.updateOneBy.mockResolvedValue(false);

      await expect(service.deactivateUser('user123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('activateUser', () => {
    beforeEach(() => {
      mockFirebaseUpdateUser.mockReset();
    });

    it('should activate user successfully in both MongoDB and Firebase', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUser as User,
      );
      userRepository.updateOneBy.mockResolvedValue(true);
      userRepository.findOneById.mockResolvedValue(mockUser as User);
      mockFirebaseUpdateUser.mockResolvedValue(undefined);

      const result = await service.activateUser('user123');

      expect(userRepository.findOneByIdWithFirebaseId).toHaveBeenCalledWith(
        'user123',
      );
      expect(mockFirebaseUpdateUser).toHaveBeenCalledWith('firebase123', {
        disabled: false,
      });
      expect(userRepository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { isActive: true },
      );
      expect(result).toEqual(mockUser);
    });

    it('should continue activation even when Firebase fails', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUser as User,
      );
      userRepository.updateOneBy.mockResolvedValue(true);
      userRepository.findOneById.mockResolvedValue(mockUser as User);
      mockFirebaseUpdateUser.mockRejectedValue(new Error('Firebase error'));

      const result = await service.activateUser('user123');

      expect(userRepository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { isActive: true },
      );
      expect(result).toEqual(mockUser);
    });

    it('should skip Firebase activation when Firebase ID is invalid', async () => {
      const mockUserWithoutFirebaseId = { ...mockUser, firebaseId: '' };
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUserWithoutFirebaseId as User,
      );
      userRepository.updateOneBy.mockResolvedValue(true);
      userRepository.findOneById.mockResolvedValue(mockUser as User);

      const result = await service.activateUser('user123');

      expect(mockFirebaseUpdateUser).not.toHaveBeenCalled();
      expect(userRepository.updateOneBy).toHaveBeenCalledWith(
        { _id: 'user123' },
        { isActive: true },
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException when user not found', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(null);

      await expect(service.activateUser('user123')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockFirebaseUpdateUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when MongoDB activation fails', async () => {
      userRepository.findOneByIdWithFirebaseId.mockResolvedValue(
        mockUser as User,
      );
      userRepository.updateOneBy.mockResolvedValue(false);

      await expect(service.activateUser('user123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      userRepository.findOneById.mockResolvedValue(mockUser as User);

      const result = await service.getUserById('user123');

      expect(userRepository.findOneById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      userRepository.findOneById.mockResolvedValue(null);

      const result = await service.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Legacy Methods', () => {
    describe('isAdmin', () => {
      it('should return true for admin role', () => {
        expect(service.isAdmin(UserRole.ADMIN)).toBe(true);
      });

      it('should return false for non-admin roles', () => {
        expect(service.isAdmin(UserRole.OWNER)).toBe(false);
        expect(service.isAdmin(UserRole.MANAGER)).toBe(false);
        expect(service.isAdmin(UserRole.WAITER)).toBe(false);
        expect(service.isAdmin(UserRole.KITCHEN_STAFF)).toBe(false);
        expect(service.isAdmin(UserRole.CUSTOMER)).toBe(false);
      });
    });

    describe('isManagement', () => {
      it('should return true for management roles', () => {
        expect(service.isManagement(UserRole.ADMIN)).toBe(true);
        expect(service.isManagement(UserRole.OWNER)).toBe(true);
        expect(service.isManagement(UserRole.MANAGER)).toBe(true);
      });

      it('should return false for non-management roles', () => {
        expect(service.isManagement(UserRole.WAITER)).toBe(false);
        expect(service.isManagement(UserRole.KITCHEN_STAFF)).toBe(false);
        expect(service.isManagement(UserRole.CUSTOMER)).toBe(false);
      });
    });
  });
});
