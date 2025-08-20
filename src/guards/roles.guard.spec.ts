import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../mongo/models/user.model';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(),
  };

  const mockRequest = {
    user: {
      _id: 'user123',
      role: UserRole.CUSTOMER,
    },
  };

  const mockHttpContext = {
    getRequest: jest.fn().mockReturnValue(mockRequest),
  };

  beforeEach(() => {
    mockExecutionContext.switchToHttp.mockReturnValue(mockHttpContext);

    guard = new RolesGuard(mockReflector as any);
    reflector = mockReflector as any;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should allow access when user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.CUSTOMER]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.CUSTOMER,
        UserRole.WAITER,
      ]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should deny access when user is not present in request', () => {
      const requestWithoutUser = {};
      mockHttpContext.getRequest.mockReturnValue(requestWithoutUser);
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.CUSTOMER]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should deny access when user exists but has no role', () => {
      const requestWithUserWithoutRole = {
        user: {
          _id: 'user123',
          // no role property
        },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithUserWithoutRole);
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.CUSTOMER]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should deny access when user role is null', () => {
      const requestWithNullRole = {
        user: {
          _id: 'user123',
          role: null,
        },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithNullRole);
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.CUSTOMER]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should deny access when user role is undefined', () => {
      const requestWithUndefinedRole = {
        user: {
          _id: 'user123',
          role: undefined,
        },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithUndefinedRole);
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.CUSTOMER]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should handle admin role correctly', () => {
      const requestWithAdminUser = {
        user: {
          _id: 'admin123',
          role: UserRole.ADMIN,
        },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithAdminUser);
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should handle owner role correctly', () => {
      const requestWithOwnerUser = {
        user: {
          _id: 'owner123',
          role: UserRole.OWNER,
        },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithOwnerUser);
      mockReflector.getAllAndOverride.mockReturnValue([
        UserRole.OWNER,
        UserRole.ADMIN,
      ]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should handle manager role correctly', () => {
      const requestWithManagerUser = {
        user: {
          _id: 'manager123',
          role: UserRole.MANAGER,
        },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithManagerUser);
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.MANAGER]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should handle waiter role correctly', () => {
      const requestWithWaiterUser = {
        user: {
          _id: 'waiter123',
          role: UserRole.WAITER,
        },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithWaiterUser);
      mockReflector.getAllAndOverride.mockReturnValue([
        UserRole.WAITER,
        UserRole.MANAGER,
      ]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should handle kitchen staff role correctly', () => {
      const requestWithKitchenUser = {
        user: {
          _id: 'kitchen123',
          role: UserRole.KITCHEN_STAFF,
        },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithKitchenUser);
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.KITCHEN_STAFF]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should deny access when required roles is empty array', () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should handle complex role hierarchy scenarios', () => {
      // Test scenario where customer tries to access admin-only resource
      const customerRequest = {
        user: {
          _id: 'customer123',
          role: UserRole.CUSTOMER,
        },
      };
      mockHttpContext.getRequest.mockReturnValue(customerRequest);
      mockReflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.OWNER,
      ]);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should properly call reflector with correct parameters', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      guard.canActivate(mockExecutionContext as any);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });
  });
});
