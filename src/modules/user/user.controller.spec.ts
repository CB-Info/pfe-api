import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRole, User } from '../../mongo/models/user.model';
import { UserDTO } from '../../dto/user.dto';
import { UserUpdateDTO } from '../../dto/user.update.dto';

// Mock Firebase config
jest.mock('../../configs/firebase.config', () => ({
  __esModule: true,
  default: {
    credential: 'mock-credential',
    databaseURL: 'mock-url'
  }
}));

// Mock Firebase guard
jest.mock('../../guards/firebase-token.guard', () => ({
  FirebaseTokenGuard: class MockFirebaseGuard {
    canActivate() {
      return true;
    }
  }
}));

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

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

  const mockAdminUser = {
    ...mockUser,
    _id: 'admin123',
    role: UserRole.ADMIN,
    email: 'admin@restaurant.com',
  };

  const mockOwnerUser = {
    ...mockUser,
    _id: 'owner123',
    role: UserRole.OWNER,
    email: 'owner@restaurant.com',
  };

  const mockManagerUser = {
    ...mockUser,
    _id: 'manager123',
    role: UserRole.MANAGER,
    email: 'manager@restaurant.com',
  };

  const mockWaiterUser = {
    ...mockUser,
    _id: 'waiter123',
    role: UserRole.WAITER,
    email: 'waiter@restaurant.com',
  };

  const mockKitchenUser = {
    ...mockUser,
    _id: 'kitchen123',
    role: UserRole.KITCHEN_STAFF,
    email: 'kitchen@restaurant.com',
  };

  const mockUserService: Partial<UserService> = {
    registerUser: jest.fn(),
    updateUser: jest.fn(),
    getAllUsers: jest.fn(),
    getUsersByRole: jest.fn(),
    getUserById: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
    deactivateUser: jest.fn(),
    activateUser: jest.fn(),
    // Permission methods
    canManageUsers: jest.fn(),
    canChangeRoles: jest.fn(),
    canDeleteUsers: jest.fn(),
    canCreateOwners: jest.fn(),
    canManageOrders: jest.fn(),
    canTakeOrders: jest.fn(),
    canPrepareOrders: jest.fn(),
    canSuperviseRestaurant: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockUserDTO: UserDTO = {
      email: 'test@example.com',
      password: 'password123',
      firstname: 'John',
      lastname: 'Doe',
      role: UserRole.WAITER,
      phoneNumber: '+1234567890',
    };

    it('should create a user successfully', async () => {
      userService.registerUser.mockResolvedValue(mockUser as User);

      const result = await controller.createUser(mockUserDTO);

      expect(userService.registerUser).toHaveBeenCalledWith(mockUserDTO);
      expect(result).toEqual({ error: '', data: mockUser });
    });
  });

  describe('getMe', () => {
    it('should return current user information', async () => {
      const mockRequest = { user: mockUser };

      const result = await controller.getMe(mockRequest);

      expect(result).toEqual({ error: '', data: mockUser });
    });
  });

  describe('getAllUsers', () => {
    const mockUsers = [mockUser, mockAdminUser, mockOwnerUser, mockManagerUser] as User[];

    it('should return all users when requested by management', async () => {
      const mockRequest = { user: mockAdminUser };
      userService.canManageUsers.mockReturnValue(true);
      userService.getAllUsers.mockResolvedValue(mockUsers);

      const result = await controller.getAllUsers(mockRequest);

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.ADMIN);
      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual({ error: '', data: mockUsers });
    });

    it('should return users filtered by role when role query provided', async () => {
      const mockRequest = { user: mockAdminUser };
      const mockWaiters = [mockWaiterUser] as User[];
      userService.canManageUsers.mockReturnValue(true);
      userService.getUsersByRole.mockResolvedValue(mockWaiters);

      const result = await controller.getAllUsers(mockRequest, UserRole.WAITER);

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.ADMIN);
      expect(userService.getUsersByRole).toHaveBeenCalledWith(UserRole.WAITER);
      expect(result).toEqual({ error: '', data: mockWaiters });
    });

    it('should return error when requested by non-management user', async () => {
      const mockRequest = { user: mockWaiterUser };
      userService.canManageUsers.mockReturnValue(false);

      const result = await controller.getAllUsers(mockRequest);

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.WAITER);
      expect(userService.getAllUsers).not.toHaveBeenCalled();
      expect(result).toEqual({ 
        error: 'Insufficient permissions. Only management can view all users.', 
        data: null 
      });
    });

    it('should return error when requested by customer', async () => {
      const mockRequest = { user: mockUser };
      userService.canManageUsers.mockReturnValue(false);

      const result = await controller.getAllUsers(mockRequest);

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.CUSTOMER);
      expect(userService.getAllUsers).not.toHaveBeenCalled();
      expect(result).toEqual({ 
        error: 'Insufficient permissions. Only management can view all users.', 
        data: null 
      });
    });
  });

  describe('getUserById', () => {
    it('should return user when requested by management', async () => {
      const mockRequest = { user: mockAdminUser };
      userService.canManageUsers.mockReturnValue(true);
      userService.getUserById.mockResolvedValue(mockUser as User);

      const result = await controller.getUserById(mockRequest, 'user123');

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.ADMIN);
      expect(userService.getUserById).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should return user when requested by the user themselves', async () => {
      const mockRequest = { user: mockUser };
      userService.getUserById.mockResolvedValue(mockUser as User);

      const result = await controller.getUserById(mockRequest, 'user123');

      expect(userService.getUserById).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should return error when non-management user tries to view another user', async () => {
      const mockRequest = { user: mockWaiterUser };
      userService.canManageUsers.mockReturnValue(false);

      const result = await controller.getUserById(mockRequest, 'user123');

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.WAITER);
      expect(userService.getUserById).not.toHaveBeenCalled();
      expect(result).toEqual({ 
        error: 'Insufficient permissions. You can only view your own profile.', 
        data: null 
      });
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

    it('should update user when requested by management', async () => {
      const mockRequest = { user: mockAdminUser };
      userService.canManageUsers.mockReturnValue(true);
      userService.updateUser.mockResolvedValue(mockUser as User);

      const result = await controller.updateUser(mockUpdateDTO, 'user123', mockRequest);

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.ADMIN);
      expect(userService.updateUser).toHaveBeenCalledWith('user123', mockUpdateDTO);
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should update user when requested by the user themselves', async () => {
      const mockRequest = { user: mockUser };
      userService.updateUser.mockResolvedValue(mockUser as User);

      const result = await controller.updateUser(mockUpdateDTO, 'user123', mockRequest);

      expect(userService.updateUser).toHaveBeenCalledWith('user123', mockUpdateDTO);
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should return error when non-management user tries to update another user', async () => {
      const mockRequest = { user: mockWaiterUser };
      userService.canManageUsers.mockReturnValue(false);

      const result = await controller.updateUser(mockUpdateDTO, 'user123', mockRequest);

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.WAITER);
      expect(userService.updateUser).not.toHaveBeenCalled();
      expect(result).toEqual({ 
        error: 'Insufficient permissions. You can only update your own profile.', 
        data: null 
      });
    });
  });

  describe('updateUserRole', () => {
    const roleUpdateBody = { role: UserRole.WAITER };

    it('should update user role successfully when requested by admin', async () => {
      const mockRequest = { user: mockAdminUser };
      userService.updateUserRole.mockResolvedValue(mockUser as User);

      const result = await controller.updateUserRole('user123', roleUpdateBody, mockRequest);

      expect(userService.updateUserRole).toHaveBeenCalledWith(
        'user123',
        UserRole.WAITER,
        UserRole.ADMIN,
        'admin123'
      );
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should update user role successfully when requested by owner', async () => {
      const mockRequest = { user: mockOwnerUser };
      userService.updateUserRole.mockResolvedValue(mockUser as User);

      const result = await controller.updateUserRole('user123', roleUpdateBody, mockRequest);

      expect(userService.updateUserRole).toHaveBeenCalledWith(
        'user123',
        UserRole.WAITER,
        UserRole.OWNER,
        'owner123'
      );
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should handle ForbiddenException from service', async () => {
      const mockRequest = { user: mockManagerUser };
      userService.updateUserRole.mockRejectedValue(new ForbiddenException('Insufficient permissions'));

      await expect(
        controller.updateUserRole('user123', { role: UserRole.OWNER }, mockRequest)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle ForbiddenException when user tries to change own role', async () => {
      const mockRequest = { user: mockManagerUser };
      userService.updateUserRole.mockRejectedValue(
        new ForbiddenException('Users cannot change their own role')
      );

      await expect(
        controller.updateUserRole('manager123', { role: UserRole.ADMIN }, mockRequest)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully when requested by admin', async () => {
      const mockRequest = { user: mockAdminUser };
      userService.deleteUser.mockResolvedValue(true);

      const result = await controller.deleteUser('user123', mockRequest);

      expect(userService.deleteUser).toHaveBeenCalledWith('user123', UserRole.ADMIN);
      expect(result).toEqual({ 
        error: '', 
        data: { 
          deleted: true, 
          message: 'User successfully deleted from both Firebase Auth and MongoDB' 
        } 
      });
    });

    it('should handle ForbiddenException when non-admin tries to delete', async () => {
      const mockRequest = { user: mockOwnerUser };
      userService.deleteUser.mockRejectedValue(new ForbiddenException('Only admins can delete users'));

      await expect(controller.deleteUser('user123', mockRequest)).rejects.toThrow(ForbiddenException);
    });

    it('should handle BadRequestException when deletion fails', async () => {
      const mockRequest = { user: mockAdminUser };
      userService.deleteUser.mockRejectedValue(new BadRequestException('Failed to delete user'));

      await expect(controller.deleteUser('user123', mockRequest)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user when requested by management', async () => {
      const mockRequest = { user: mockAdminUser };
      userService.canManageUsers.mockReturnValue(true);
      userService.deactivateUser.mockResolvedValue(mockUser as User);

      const result = await controller.deactivateUser('user123', mockRequest);

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.ADMIN);
      expect(userService.deactivateUser).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should return error when requested by non-management user', async () => {
      const mockRequest = { user: mockWaiterUser };
      userService.canManageUsers.mockReturnValue(false);

      const result = await controller.deactivateUser('user123', mockRequest);

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.WAITER);
      expect(userService.deactivateUser).not.toHaveBeenCalled();
      expect(result).toEqual({ 
        error: 'Insufficient permissions. Only management can deactivate users.', 
        data: null 
      });
    });
  });

  describe('activateUser', () => {
    it('should activate user when requested by management', async () => {
      const mockRequest = { user: mockOwnerUser };
      userService.canManageUsers.mockReturnValue(true);
      userService.activateUser.mockResolvedValue(mockUser as User);

      const result = await controller.activateUser('user123', mockRequest);

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.OWNER);
      expect(userService.activateUser).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should return error when requested by non-management user', async () => {
      const mockRequest = { user: mockKitchenUser };
      userService.canManageUsers.mockReturnValue(false);

      const result = await controller.activateUser('user123', mockRequest);

      expect(userService.canManageUsers).toHaveBeenCalledWith(UserRole.KITCHEN_STAFF);
      expect(userService.activateUser).not.toHaveBeenCalled();
      expect(result).toEqual({ 
        error: 'Insufficient permissions. Only management can activate users.', 
        data: null 
      });
    });
  });

  describe('checkPermissions', () => {
    it('should return admin permissions', async () => {
      const mockRequest = { user: mockAdminUser };
      
      // Mock all permission methods
      userService.canManageUsers.mockReturnValue(true);
      userService.canChangeRoles.mockReturnValue(true);
      userService.canDeleteUsers.mockReturnValue(true);
      userService.canCreateOwners.mockReturnValue(true);
      userService.canManageOrders.mockReturnValue(true);
      userService.canTakeOrders.mockReturnValue(true);
      userService.canPrepareOrders.mockReturnValue(true);
      userService.canSuperviseRestaurant.mockReturnValue(true);

      const result = await controller.checkPermissions(mockRequest);

      expect(result).toEqual({
        error: '',
        data: {
          role: UserRole.ADMIN,
          canManageUsers: true,
          canChangeRoles: true,
          canDeleteUsers: true,
          canCreateOwners: true,
          canManageOrders: true,
          canTakeOrders: true,
          canPrepareOrders: true,
          canSuperviseRestaurant: true,
          roleDescription: 'Full access to all features including creating owner accounts and permanent user deletion',
        },
      });
    });

    it('should return owner permissions', async () => {
      const mockRequest = { user: mockOwnerUser };
      
      userService.canManageUsers.mockReturnValue(true);
      userService.canChangeRoles.mockReturnValue(true);
      userService.canDeleteUsers.mockReturnValue(false);
      userService.canCreateOwners.mockReturnValue(false);
      userService.canManageOrders.mockReturnValue(true);
      userService.canTakeOrders.mockReturnValue(true);
      userService.canPrepareOrders.mockReturnValue(true);
      userService.canSuperviseRestaurant.mockReturnValue(true);

      const result = await controller.checkPermissions(mockRequest);

      expect(result).toEqual({
        error: '',
        data: {
          role: UserRole.OWNER,
          canManageUsers: true,
          canChangeRoles: true,
          canDeleteUsers: false,
          canCreateOwners: false,
          canManageOrders: true,
          canTakeOrders: true,
          canPrepareOrders: true,
          canSuperviseRestaurant: true,
          roleDescription: 'Can supervise entire restaurant, add/remove users, change roles (except admin and own role), plus all manager rights',
        },
      });
    });

    it('should return waiter permissions', async () => {
      const mockRequest = { user: mockWaiterUser };
      
      userService.canManageUsers.mockReturnValue(false);
      userService.canChangeRoles.mockReturnValue(false);
      userService.canDeleteUsers.mockReturnValue(false);
      userService.canCreateOwners.mockReturnValue(false);
      userService.canManageOrders.mockReturnValue(true);
      userService.canTakeOrders.mockReturnValue(true);
      userService.canPrepareOrders.mockReturnValue(false);
      userService.canSuperviseRestaurant.mockReturnValue(false);

      const result = await controller.checkPermissions(mockRequest);

      expect(result).toEqual({
        error: '',
        data: {
          role: UserRole.WAITER,
          canManageUsers: false,
          canChangeRoles: false,
          canDeleteUsers: false,
          canCreateOwners: false,
          canManageOrders: true,
          canTakeOrders: true,
          canPrepareOrders: false,
          canSuperviseRestaurant: false,
          roleDescription: 'Can take orders, send to kitchen, and receive order ready notifications',
        },
      });
    });

    it('should return kitchen staff permissions', async () => {
      const mockRequest = { user: mockKitchenUser };
      
      userService.canManageUsers.mockReturnValue(false);
      userService.canChangeRoles.mockReturnValue(false);
      userService.canDeleteUsers.mockReturnValue(false);
      userService.canCreateOwners.mockReturnValue(false);
      userService.canManageOrders.mockReturnValue(true);
      userService.canTakeOrders.mockReturnValue(false);
      userService.canPrepareOrders.mockReturnValue(true);
      userService.canSuperviseRestaurant.mockReturnValue(false);

      const result = await controller.checkPermissions(mockRequest);

      expect(result).toEqual({
        error: '',
        data: {
          role: UserRole.KITCHEN_STAFF,
          canManageUsers: false,
          canChangeRoles: false,
          canDeleteUsers: false,
          canCreateOwners: false,
          canManageOrders: true,
          canTakeOrders: false,
          canPrepareOrders: true,
          canSuperviseRestaurant: false,
          roleDescription: 'Can receive orders, prepare them, and mark them as ready',
        },
      });
    });

    it('should return customer permissions', async () => {
      const mockRequest = { user: mockUser };
      
      userService.canManageUsers.mockReturnValue(false);
      userService.canChangeRoles.mockReturnValue(false);
      userService.canDeleteUsers.mockReturnValue(false);
      userService.canCreateOwners.mockReturnValue(false);
      userService.canManageOrders.mockReturnValue(true);
      userService.canTakeOrders.mockReturnValue(false);
      userService.canPrepareOrders.mockReturnValue(false);
      userService.canSuperviseRestaurant.mockReturnValue(false);

      const result = await controller.checkPermissions(mockRequest);

      expect(result).toEqual({
        error: '',
        data: {
          role: UserRole.CUSTOMER,
          canManageUsers: false,
          canChangeRoles: false,
          canDeleteUsers: false,
          canCreateOwners: false,
          canManageOrders: true,
          canTakeOrders: false,
          canPrepareOrders: false,
          canSuperviseRestaurant: false,
          roleDescription: 'Can place orders and make payments',
        },
      });
    });
  });
});