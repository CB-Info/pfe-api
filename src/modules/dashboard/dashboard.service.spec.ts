import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { UserRole } from '../../mongo/models/user.model';
import { DishRepository } from '../../mongo/repositories/dish.repository';
import { OrderRepository } from '../../mongo/repositories/order.repository';
import { UserRepository } from '../../mongo/repositories/user.repository';
import { CardRepository } from '../../mongo/repositories/card.repository';
import { StockRepository } from '../../mongo/repositories/stock.repository';
import { RestaurantTableRepository } from '../../mongo/repositories/restaurant.table.repository';
import { IngredientRepository } from '../../mongo/repositories/ingredient.repository';

describe('DashboardService', () => {
  let service: DashboardService;
  let dishRepository: jest.Mocked<DishRepository>;
  let orderRepository: jest.Mocked<OrderRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let cardRepository: jest.Mocked<CardRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let restaurantTableRepository: jest.Mocked<RestaurantTableRepository>;
  let ingredientRepository: jest.Mocked<IngredientRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: DishRepository,
          useValue: {
            findAll: jest.fn(),
            findTop20Ingredients: jest.fn(),
          },
        },
        {
          provide: OrderRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: CardRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: StockRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: RestaurantTableRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: IngredientRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    dishRepository = module.get(DishRepository);
    orderRepository = module.get(OrderRepository);
    userRepository = module.get(UserRepository);
    cardRepository = module.get(CardRepository);
    stockRepository = module.get(StockRepository);
    restaurantTableRepository = module.get(RestaurantTableRepository);
    ingredientRepository = module.get(IngredientRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardData', () => {
    it('should return customer section only for CUSTOMER role', async () => {
      // Mock des données
      dishRepository.findAll.mockResolvedValue([]);
      orderRepository.findAll.mockResolvedValue([]);
      userRepository.findAll.mockResolvedValue([]);
      cardRepository.findAll.mockResolvedValue([]);
      stockRepository.findAll.mockResolvedValue([]);
      restaurantTableRepository.findAll.mockResolvedValue([]);
      ingredientRepository.findAll.mockResolvedValue([]);

      const result = await service.getDashboardData(
        UserRole.CUSTOMER,
        'user123',
      );

      expect(result.userRole).toBe(UserRole.CUSTOMER);
      expect(result.sections).toHaveProperty('customer');
      expect(result.sections).not.toHaveProperty('waiter');
      expect(result.sections).not.toHaveProperty('kitchen');
      expect(result.sections).not.toHaveProperty('manager');
      expect(result.sections).not.toHaveProperty('owner');
    });

    it('should return customer and waiter sections for WAITER role', async () => {
      // Mock des données
      dishRepository.findAll.mockResolvedValue([]);
      orderRepository.findAll.mockResolvedValue([]);
      userRepository.findAll.mockResolvedValue([]);
      cardRepository.findAll.mockResolvedValue([]);
      stockRepository.findAll.mockResolvedValue([]);
      restaurantTableRepository.findAll.mockResolvedValue([]);
      ingredientRepository.findAll.mockResolvedValue([]);

      const result = await service.getDashboardData(UserRole.WAITER, 'user123');

      expect(result.userRole).toBe(UserRole.WAITER);
      expect(result.sections).not.toHaveProperty('customer');
      expect(result.sections).toHaveProperty('waiter');
      expect(result.sections).not.toHaveProperty('kitchen');
      expect(result.sections).not.toHaveProperty('manager');
      expect(result.sections).not.toHaveProperty('owner');
    });

    it('should return all sections for OWNER role', async () => {
      // Mock des données de base
      const mockDishes = [
        {
          _id: '1',
          name: 'Pizza Margherita',
          description: 'Pizza traditionnelle',
          price: 12.5,
          category: 'MAIN_DISHES',
          isAvailable: true,
          ingredients: [],
          timeCook: 15,
          dateOfCreation: '2024-01-15 12:00:00',
        },
      ];

      const mockCards = [
        {
          _id: '1',
          name: 'Carte du jour',
          dishesId: ['1'],
          isActive: true,
          dateOfCreation: '2024-01-15 12:00:00',
        },
      ];

      const mockIngredients = [
        {
          _id: '1',
          name: 'Tomate',
          dateOfCreation: '2024-01-15 12:00:00',
        },
      ];

      dishRepository.findAll.mockResolvedValue(mockDishes as any);
      dishRepository.findTop20Ingredients.mockResolvedValue([
        { name: 'Tomate', totalUsage: 5 },
      ]);
      orderRepository.findAll.mockResolvedValue([]);
      userRepository.findAll.mockResolvedValue([]);
      cardRepository.findAll.mockResolvedValue(mockCards as any);
      stockRepository.findAll.mockResolvedValue([]);
      restaurantTableRepository.findAll.mockResolvedValue([]);
      ingredientRepository.findAll.mockResolvedValue(mockIngredients as any);

      const result = await service.getDashboardData(UserRole.OWNER, 'user123');

      expect(result.userRole).toBe(UserRole.OWNER);
      expect(result.sections).not.toHaveProperty('customer');
      expect(result.sections).toHaveProperty('waiter');
      expect(result.sections).toHaveProperty('kitchen');
      expect(result.sections).toHaveProperty('manager');
      expect(result.sections).toHaveProperty('owner');

      // Vérifier que la section owner contient les bonnes données
      expect(result.sections.owner).toHaveProperty('stats');
      expect(result.sections.owner).toHaveProperty('recentDishes');
      expect(result.sections.owner.stats.totalDishes).toBe(1);
      expect(result.sections.owner.stats.availableDishes).toBe(1);
      expect(result.sections.owner.recentDishes).toHaveLength(1);
    });

    it('should handle errors gracefully and exclude failed sections', async () => {
      // Simuler une erreur dans le repository
      dishRepository.findAll.mockRejectedValue(new Error('Database error'));
      orderRepository.findAll.mockResolvedValue([]);
      userRepository.findAll.mockResolvedValue([]);
      cardRepository.findAll.mockResolvedValue([]);
      stockRepository.findAll.mockResolvedValue([]);
      restaurantTableRepository.findAll.mockResolvedValue([]);
      ingredientRepository.findAll.mockResolvedValue([]);

      const result = await service.getDashboardData(UserRole.OWNER, 'user123');

      expect(result.userRole).toBe(UserRole.OWNER);
      // La section owner devrait être exclue à cause de l'erreur
      expect(result.sections).not.toHaveProperty('owner');
      // Mais les autres sections devraient être présentes (pas customer car OWNER n'y a pas accès)
      expect(result.sections).not.toHaveProperty('customer');
    });
  });
});
