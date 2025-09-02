import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UserRole } from '../../mongo/models/user.model';
import { HttpException, HttpStatus } from '@nestjs/common';
import { FirebaseTokenGuard } from '../../guards/firebase-token.guard';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getDashboardData: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(FirebaseTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return dashboard data for valid user', async () => {
      const mockUser = {
        _id: 'user123',
        role: UserRole.CUSTOMER,
        email: 'test@example.com',
      };

      const mockDashboardData = {
        userRole: UserRole.CUSTOMER,
        sections: {
          customer: {
            stats: {
              myOrders: 5,
              favoriteCategory: 'Pizza',
              lastOrderTime: 'Il y a 2 jours',
              loyaltyPoints: 100,
            },
            recentOrders: [],
          },
        },
      };

      const mockRequest = {
        user: mockUser,
      };

      service.getDashboardData.mockResolvedValue(mockDashboardData);

      const result = await controller.getDashboard(mockRequest);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockDashboardData);
      expect(service.getDashboardData).toHaveBeenCalledWith(
        UserRole.CUSTOMER,
        'user123',
      );
    });

    it('should throw HttpException when user has no role', async () => {
      const mockRequest = {
        user: {
          _id: 'user123',
          email: 'test@example.com',
          // pas de role
        },
      };

      await expect(controller.getDashboard(mockRequest)).rejects.toThrow(
        new HttpException(
          'User role not found in token',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      expect(service.getDashboardData).not.toHaveBeenCalled();
    });

    it('should throw HttpException when user is null', async () => {
      const mockRequest = {
        user: null,
      };

      await expect(controller.getDashboard(mockRequest)).rejects.toThrow(
        new HttpException(
          'User role not found in token',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      expect(service.getDashboardData).not.toHaveBeenCalled();
    });

    it('should handle service errors and throw Internal Server Error', async () => {
      const mockUser = {
        _id: 'user123',
        role: UserRole.CUSTOMER,
        email: 'test@example.com',
      };

      const mockRequest = {
        user: mockUser,
      };

      service.getDashboardData.mockRejectedValue(new Error('Database error'));

      await expect(controller.getDashboard(mockRequest)).rejects.toThrow(
        new HttpException(
          'Erreur lors du calcul des statistiques du dashboard',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(service.getDashboardData).toHaveBeenCalledWith(
        UserRole.CUSTOMER,
        'user123',
      );
    });

    it('should work with different user roles', async () => {
      const mockUser = {
        _id: 'manager123',
        role: UserRole.MANAGER,
        email: 'manager@example.com',
      };

      const mockDashboardData = {
        userRole: UserRole.MANAGER,
        sections: {
          customer: {
            stats: {
              myOrders: 10,
              favoriteCategory: 'Pizza',
              lastOrderTime: 'Il y a 1 jour',
              loyaltyPoints: 150,
            },
            recentOrders: [],
          },
          waiter: {
            stats: {
              tablesAssigned: 6,
              activeOrders: 3,
              completedOrders: 8,
              pendingOrders: 2,
            },
            tables: [],
          },
          kitchen: {
            stats: {
              ordersInPreparation: 4,
              completedToday: 15,
              lowStockItems: 2,
              averagePreparationTime: 20,
            },
            stock: [],
          },
          manager: {
            stats: {
              totalEmployees: 12,
              activeEmployees: 10,
              dailyRevenue: 3500.5,
              ordersToday: 45,
              averageServiceTime: 25,
              customerSatisfaction: 4.7,
            },
            employees: [],
          },
        },
      };

      const mockRequest = {
        user: mockUser,
      };

      service.getDashboardData.mockResolvedValue(mockDashboardData);

      const result = await controller.getDashboard(mockRequest);

      expect(result.error).toBeNull();
      expect(result.data.userRole).toBe(UserRole.MANAGER);
      expect(result.data.sections).toHaveProperty('manager');
      expect(service.getDashboardData).toHaveBeenCalledWith(
        UserRole.MANAGER,
        'manager123',
      );
    });
  });
});
