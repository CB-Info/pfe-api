import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseTokenGuard } from './firebase-token.guard';
import { UserRepository } from 'src/mongo/repositories/user.repository';
import { UserRole } from 'src/mongo/models/user.model';

// Mock Firebase
jest.mock('src/configs/firebase.config', () => ({
  __esModule: true,
  default: {
    auth: () => ({
      verifyIdToken: jest.fn(),
    }),
  },
}));

describe('FirebaseTokenGuard', () => {
  let guard: FirebaseTokenGuard;
  let userRepository: UserRepository;

  const mockUserRepository = {
    findOneBy: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn(),
  };

  const mockRequest = {
    headers: {
      authorization: 'Bearer valid-token',
    },
  };

  const mockHttpContext = {
    getRequest: jest.fn().mockReturnValue(mockRequest),
  };

  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    firebaseId: 'firebase123',
    role: UserRole.CUSTOMER,
    isActive: true,
  };

  const mockDecodedToken = {
    uid: 'firebase123',
    email: 'test@example.com',
    email_verified: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseTokenGuard,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    guard = module.get<FirebaseTokenGuard>(FirebaseTokenGuard);
    userRepository = module.get<UserRepository>(UserRepository);

    mockExecutionContext.switchToHttp.mockReturnValue(mockHttpContext);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access with valid token and active user', async () => {
      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);
      firebaseMock.auth().getUser.mockResolvedValue({ uid: 'firebase123' });
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
      expect(firebaseMock.auth().verifyIdToken).toHaveBeenCalledWith('valid-token', true);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ firebaseId: 'firebase123' });
      expect(mockRequest['user']).toEqual(mockUser);
    });

    it('should return false when no authorization header', async () => {
      const requestWithoutAuth = { headers: {} };
      mockHttpContext.getRequest.mockReturnValue(requestWithoutAuth);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should return false when authorization header is malformed', async () => {
      const requestWithMalformedAuth = {
        headers: { authorization: 'InvalidFormat' },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithMalformedAuth);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should return false when token is empty', async () => {
      const requestWithEmptyToken = {
        headers: { authorization: 'Bearer ' },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithEmptyToken);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should return false when Firebase token verification fails', async () => {
      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should return false when user not found in database', async () => {
      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);
      firebaseMock.auth().getUser.mockResolvedValue({ uid: 'firebase123' });
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should return true even when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);
      firebaseMock.auth().getUser.mockResolvedValue({ uid: 'firebase123' });
      mockUserRepository.findOneBy.mockResolvedValue(inactiveUser);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should handle different authorization header formats', async () => {
      const requestWithLowercaseBearer = {
        headers: { authorization: 'Bearer valid-token-2' },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithLowercaseBearer);

      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);
      firebaseMock.auth().getUser.mockResolvedValue({ uid: 'firebase123' });
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should handle token with spaces in Bearer header', async () => {
      const requestWithSpaces = {
        headers: { authorization: 'Bearer valid-token-with-spaces' },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithSpaces);

      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);
      firebaseMock.auth().getUser.mockResolvedValue({ uid: 'firebase123' });
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should work with different user roles', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);
      firebaseMock.auth().getUser.mockResolvedValue({ uid: 'firebase123' });
      mockUserRepository.findOneBy.mockResolvedValue(adminUser);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
      expect(mockRequest['user']).toEqual(adminUser);
    });

    it('should handle Firebase token with different structure', async () => {
      const alternativeToken = {
        uid: 'firebase456',
        email: 'another@example.com',
        email_verified: true,
        name: 'Test User',
      };
      const correspondingUser = {
        ...mockUser,
        firebaseId: 'firebase456',
        email: 'another@example.com',
      };

      const requestWithDifferentToken = {
        headers: { authorization: 'Bearer another-valid-token' },
      };
      mockHttpContext.getRequest.mockReturnValue(requestWithDifferentToken);

      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockResolvedValue(alternativeToken);
      firebaseMock.auth().getUser.mockResolvedValue({ uid: 'firebase456' });
      mockUserRepository.findOneBy.mockResolvedValue(correspondingUser);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ firebaseId: 'firebase456' });
    });

    it('should return false when repository errors occur', async () => {
      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);
      firebaseMock.auth().getUser.mockResolvedValue({ uid: 'firebase123' });
      mockUserRepository.findOneBy.mockRejectedValue(new Error('Database error'));

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });

    it('should return false when token structure is malformed', async () => {
      const malformedToken = { invalid: 'structure' };
      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockResolvedValue(malformedToken);
      firebaseMock.auth().getUser.mockRejectedValue(new Error('Invalid uid'));

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should handle complete authentication flow', async () => {
      const testRequest = {
        headers: { authorization: 'Bearer integration-test-token' },
      };
      mockHttpContext.getRequest.mockReturnValue(testRequest);

      const firebaseMock = require('src/configs/firebase.config').default;
      firebaseMock.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);
      firebaseMock.auth().getUser.mockResolvedValue({ uid: 'firebase123' });
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
      expect(testRequest['firebaseUser']).toBeDefined();
      expect(testRequest['user']).toEqual(mockUser);
    });

    it('should handle missing token gracefully', async () => {
      const testRequest = {
        headers: {},
      };
      mockHttpContext.getRequest.mockReturnValue(testRequest);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(false);
    });
  });
});