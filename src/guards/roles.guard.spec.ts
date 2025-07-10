import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../mongo/models/user.model';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);

    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ role: UserRole.CUSTOMER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER, UserRole.MANAGER]);
      const context = createMockExecutionContext({ role: UserRole.OWNER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of the required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER, UserRole.MANAGER]);
      const context = createMockExecutionContext({ role: UserRole.MANAGER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER, UserRole.MANAGER]);
      const context = createMockExecutionContext({ role: UserRole.CUSTOMER });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access when user is not authenticated', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
      const context = createMockExecutionContext(null);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access when user has no role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
      const context = createMockExecutionContext({ email: 'test@example.com' });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should call reflector with correct parameters', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
      const context = createMockExecutionContext({ role: UserRole.OWNER });

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});