import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRole } from 'src/mongo/models/user.model';
import { UserDTO } from 'src/dto/user.dto';
import { UserUpdateDTO } from 'src/dto/user.update.dto';

// Mock Firebase config to prevent credentials.json error
jest.mock('src/configs/firebase.config', () => ({
  __esModule: true,
  default: {
    auth: () => ({
      verifyIdToken: jest.fn(),
      getUser: jest.fn(),
      deleteUser: jest.fn(),
      updateUser: jest.fn(),
    }),
  },
}));

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    registerUser: jest.fn(),
    getAllUsers: jest.fn(),
    getUsersByRole: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
    deactivateUser: jest.fn(),
    activateUser: jest.fn(),
    canManageUsers: jest.fn(),
    canChangeRoles: jest.fn(),
    canDeleteUsers: jest.fn(),
    canCreateOwners: jest.fn(),
    canManageOrders: jest.fn(),
    canTakeOrders: jest.fn(),
    canPrepareOrders: jest.fn(),
    canSuperviseRestaurant: jest.fn(),
  };

  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
    role: UserRole.CUSTOMER,
    phoneNumber: '+1234567890',
    isActive: true,
    firebaseId: 'firebase123',
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: 'UserRepository',
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userDto: UserDTO = {
        email: 'new@example.com',
        password: 'password123',
        firstname: 'Jane',
        lastname: 'Smith',
        role: UserRole.CUSTOMER,
        phoneNumber: '+1234567891',
      };

      mockUserService.registerUser.mockResolvedValue(mockUser);

      const result = await controller.createUser(userDto);

      expect(service.registerUser).toHaveBeenCalledWith(userDto);
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should handle user creation failure', async () => {
      const userDto: UserDTO = {
        email: 'invalid@example.com',
        password: 'password123',
        firstname: 'Jane',
        lastname: 'Smith',
        role: UserRole.CUSTOMER,
        phoneNumber: '+1234567891',
      };

      mockUserService.registerUser.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.createUser(userDto)).rejects.toThrow('Creation failed');
    });
  });

  describe('getMe', () => {
    it('should return current user information', async () => {
      const result = await controller.getMe(mockRequest);

      expect(result).toEqual({ error: '', data: mockUser });
    });
  });

  describe('getAllUsers', () => {
    const users = [mockUser];

    it('should return all users for management roles', async () => {
      const adminRequest = { user: { ...mockUser, role: UserRole.ADMIN } };
      mockUserService.canManageUsers.mockReturnValue(true);
      mockUserService.getAllUsers.mockResolvedValue(users);

      const result = await controller.getAllUsers(adminRequest);

      expect(service.canManageUsers).toHaveBeenCalledWith(UserRole.ADMIN);
      expect(service.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual({ error: '', data: users });
    });

    it('should return users by role when role parameter is provided', async () => {
      const adminRequest = { user: { ...mockUser, role: UserRole.ADMIN } };
      mockUserService.canManageUsers.mockReturnValue(true);
      mockUserService.getUsersByRole.mockResolvedValue(users);

      const result = await controller.getAllUsers(adminRequest, UserRole.WAITER);

      expect(service.getUsersByRole).toHaveBeenCalledWith(UserRole.WAITER);
      expect(result).toEqual({ error: '', data: users });
    });

    it('should deny access for non-management roles', async () => {
      const customerRequest = { user: { ...mockUser, role: UserRole.CUSTOMER } };
      mockUserService.canManageUsers.mockReturnValue(false);

      const result = await controller.getAllUsers(customerRequest);

      expect(result).toEqual({
        error: 'Insufficient permissions. Only management can view all users.',
        data: null,
      });
    });
  });

  describe('getUserById', () => {
    it('should allow user to get their own profile', async () => {
      const userRequest = { user: { ...mockUser, _id: 'user123' } };
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById(userRequest, 'user123');

      expect(service.getUserById).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should allow management to get any user profile', async () => {
      const adminRequest = { user: { ...mockUser, _id: 'admin123', role: UserRole.ADMIN } };
      mockUserService.canManageUsers.mockReturnValue(true);
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById(adminRequest, 'user123');

      expect(service.getUserById).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ error: '', data: mockUser });
    });

    it('should deny access when user tries to access another user profile', async () => {
      const userRequest = { user: { ...mockUser, _id: 'user456' } };
      mockUserService.canManageUsers.mockReturnValue(false);

      const result = await controller.getUserById(userRequest, 'user123');

      expect(result).toEqual({
        error: 'Insufficient permissions. You can only view your own profile.',
        data: null,
      });
    });
  });

  describe('updateUser', () => {
    const updateDto: UserUpdateDTO = {
      email: 'updated@example.com',
      firstname: 'Updated',
      lastname: 'Name',
    };

    it('should allow user to update their own profile', async () => {
      const userRequest = { user: { ...mockUser, _id: 'user123' } };
      mockUserService.updateUser.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await controller.updateUser(updateDto, 'user123', userRequest);

      expect(service.updateUser).toHaveBeenCalledWith('user123', updateDto);
      expect(result).toEqual({ error: '', data: { ...mockUser, ...updateDto } });
    });

    it('should allow management to update any user profile', async () => {
      const adminRequest = { user: { ...mockUser, _id: 'admin123', role: UserRole.ADMIN } };
      mockUserService.canManageUsers.mockReturnValue(true);
      mockUserService.updateUser.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await controller.updateUser(updateDto, 'user123', adminRequest);

      expect(service.updateUser).toHaveBeenCalledWith('user123', updateDto);
      expect(result).toEqual({ error: '', data: { ...mockUser, ...updateDto } });
    });

    it('should deny access when user tries to update another user profile', async () => {
      const userRequest = { user: { ...mockUser, _id: 'user456' } };
      mockUserService.canManageUsers.mockReturnValue(false);

      const result = await controller.updateUser(updateDto, 'user123', userRequest);

      expect(result).toEqual({
        error: 'Insufficient permissions. You can only update your own profile.',
        data: null,
      });
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const adminRequest = { user: { ...mockUser, _id: 'admin123', role: UserRole.ADMIN } };
      const roleBody = { role: UserRole.WAITER };
      const updatedUser = { ...mockUser, role: UserRole.WAITER };
      
      mockUserService.updateUserRole.mockResolvedValue(updatedUser);

      const result = await controller.updateUserRole('user123', roleBody, adminRequest);

      expect(service.updateUserRole).toHaveBeenCalledWith(
        'user123',
        UserRole.WAITER,
        UserRole.ADMIN,
        'admin123'
      );
      expect(result).toEqual({ error: '', data: updatedUser });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully for admin', async () => {
      const adminRequest = { user: { ...mockUser, _id: 'admin123', role: UserRole.ADMIN } };
      mockUserService.deleteUser.mockResolvedValue(true);

      const result = await controller.deleteUser('user123', adminRequest);

      expect(service.deleteUser).toHaveBeenCalledWith('user123', UserRole.ADMIN);
      expect(result).toEqual({
        error: '',
        data: {
          deleted: true,
          message: 'User successfully deleted from both Firebase Auth and MongoDB',
        },
      });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully for management', async () => {
      const adminRequest = { user: { ...mockUser, _id: 'admin123', role: UserRole.ADMIN } };
      mockUserService.canManageUsers.mockReturnValue(true);
      mockUserService.deactivateUser.mockResolvedValue({ ...mockUser, isActive: false });

      const result = await controller.deactivateUser('user123', adminRequest);

      expect(service.canManageUsers).toHaveBeenCalledWith(UserRole.ADMIN);
      expect(service.deactivateUser).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ error: '', data: { ...mockUser, isActive: false } });
    });

    it('should deny access for non-management roles', async () => {
      const customerRequest = { user: { ...mockUser, role: UserRole.CUSTOMER } };
      mockUserService.canManageUsers.mockReturnValue(false);

      const result = await controller.deactivateUser('user123', customerRequest);

      expect(result).toEqual({
        error: 'Insufficient permissions. Only management can deactivate users.',
        data: null,
      });
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully for management', async () => {
      const adminRequest = { user: { ...mockUser, _id: 'admin123', role: UserRole.ADMIN } };
      mockUserService.canManageUsers.mockReturnValue(true);
      mockUserService.activateUser.mockResolvedValue({ ...mockUser, isActive: true });

      const result = await controller.activateUser('user123', adminRequest);

      expect(service.canManageUsers).toHaveBeenCalledWith(UserRole.ADMIN);
      expect(service.activateUser).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ error: '', data: { ...mockUser, isActive: true } });
    });

    it('should deny access for non-management roles', async () => {
      const customerRequest = { user: { ...mockUser, role: UserRole.CUSTOMER } };
      mockUserService.canManageUsers.mockReturnValue(false);

      const result = await controller.activateUser('user123', customerRequest);

      expect(result).toEqual({
        error: 'Insufficient permissions. Only management can activate users.',
        data: null,
      });
    });
  });

  describe('checkPermissions', () => {
    it('should return user permissions for admin role', async () => {
      const adminRequest = { user: { ...mockUser, role: UserRole.ADMIN } };
      
      // Mock all permission methods
      mockUserService.canManageUsers.mockReturnValue(true);
      mockUserService.canChangeRoles.mockReturnValue(true);
      mockUserService.canDeleteUsers.mockReturnValue(true);
      mockUserService.canCreateOwners.mockReturnValue(true);
      mockUserService.canManageOrders.mockReturnValue(true);
      mockUserService.canTakeOrders.mockReturnValue(true);
      mockUserService.canPrepareOrders.mockReturnValue(true);
      mockUserService.canSuperviseRestaurant.mockReturnValue(true);

      const result = await controller.checkPermissions(adminRequest);

      expect(result.data.role).toBe(UserRole.ADMIN);
      expect(result.data.canManageUsers).toBe(true);
      expect(result.data.canDeleteUsers).toBe(true);
      expect(result.data.roleDescription).toContain('Full access');
    });

    it('should return user permissions for customer role', async () => {
      const customerRequest = { user: { ...mockUser, role: UserRole.CUSTOMER } };
      
      // Mock all permission methods for customer
      mockUserService.canManageUsers.mockReturnValue(false);
      mockUserService.canChangeRoles.mockReturnValue(false);
      mockUserService.canDeleteUsers.mockReturnValue(false);
      mockUserService.canCreateOwners.mockReturnValue(false);
      mockUserService.canManageOrders.mockReturnValue(true);
      mockUserService.canTakeOrders.mockReturnValue(false);
      mockUserService.canPrepareOrders.mockReturnValue(false);
      mockUserService.canSuperviseRestaurant.mockReturnValue(false);

      const result = await controller.checkPermissions(customerRequest);

      expect(result.data.role).toBe(UserRole.CUSTOMER);
      expect(result.data.canManageUsers).toBe(false);
      expect(result.data.canDeleteUsers).toBe(false);
      expect(result.data.roleDescription).toContain('Can place orders');
    });
  });

  describe('getRoleDescription', () => {
    it('should return correct description for each role', () => {
      const descriptions = {
        [UserRole.CUSTOMER]: 'Can place orders and make payments',
        [UserRole.WAITER]: 'Can take orders, send to kitchen, and receive order ready notifications',
        [UserRole.KITCHEN_STAFF]: 'Can receive orders, prepare them, and mark them as ready',
        [UserRole.MANAGER]: 'Can change user roles (except admin/owner), activate/deactivate users, and manage restaurant operations',
        [UserRole.OWNER]: 'Can supervise entire restaurant, add/remove users, change roles (except admin and own role), plus all manager rights',
        [UserRole.ADMIN]: 'Full access to all features including creating owner accounts and permanent user deletion',
      };

      Object.values(UserRole).forEach(role => {
        expect(controller['getRoleDescription'](role)).toBe(descriptions[role]);
      });
    });

    it('should return "Unknown role" for invalid role', () => {
      expect(controller['getRoleDescription']('INVALID_ROLE' as UserRole)).toBe('Unknown role');
    });
  });
});
