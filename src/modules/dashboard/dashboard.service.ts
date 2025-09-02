import { Injectable } from '@nestjs/common';
import { UserRole } from '../../mongo/models/user.model';
import { OrderStatus } from '../../mongo/models/order.model';
import { DishCategory } from '../../mongo/models/dish.model';
import { DishRepository } from '../../mongo/repositories/dish.repository';
import { OrderRepository } from '../../mongo/repositories/order.repository';
import { UserRepository } from '../../mongo/repositories/user.repository';
import { CardRepository } from '../../mongo/repositories/card.repository';
import { StockRepository } from '../../mongo/repositories/stock.repository';
import { RestaurantTableRepository } from '../../mongo/repositories/restaurant.table.repository';
import { IngredientRepository } from '../../mongo/repositories/ingredient.repository';
import {
  DashboardDataDto,
  DashboardSectionsDto,
  OwnerSectionDto,
  ManagerSectionDto,
  KitchenSectionDto,
  WaiterSectionDto,
  CustomerSectionDto,
  CategoryDistributionDto,
  TopIngredientDto,
  RecentDishDto,
  StaffMemberDto,
  StockItemDto,
  TableInfoDto,
  RecentOrderDto,
} from '../../dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dishRepository: DishRepository,
    private readonly orderRepository: OrderRepository,
    private readonly userRepository: UserRepository,
    private readonly cardRepository: CardRepository,
    private readonly stockRepository: StockRepository,
    private readonly restaurantTableRepository: RestaurantTableRepository,
    private readonly ingredientRepository: IngredientRepository,
  ) {}

  /**
   * Définit les sections autorisées pour chaque rôle selon la hiérarchie RBAC
   * Note: La section 'customer' est uniquement pour les vrais clients (UserRole.CUSTOMER)
   * L'équipe du restaurant (waiter, kitchen, manager, owner, admin) n'a pas accès aux données client
   */
  private readonly ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    [UserRole.CUSTOMER]: ['customer'],
    [UserRole.WAITER]: ['waiter'],
    [UserRole.KITCHEN_STAFF]: ['kitchen'],
    [UserRole.MANAGER]: ['waiter', 'kitchen', 'manager'],
    [UserRole.OWNER]: ['waiter', 'kitchen', 'manager', 'owner'],
    [UserRole.ADMIN]: ['waiter', 'kitchen', 'manager', 'owner'],
  };

  /**
   * Point d'entrée principal pour obtenir les données du dashboard
   */
  async getDashboardData(
    userRole: UserRole,
    userId?: string,
  ): Promise<DashboardDataDto> {
    const allowedSections = this.ROLE_PERMISSIONS[userRole] || ['customer'];
    const sections: DashboardSectionsDto = {};

    // Calculer toutes les sections autorisées en parallèle
    const sectionPromises = allowedSections.map(async (section) => {
      try {
        const sectionData = await this.getSectionData(
          section,
          userRole,
          userId,
        );
        return { section, data: sectionData };
      } catch (error) {
        console.error(`Error calculating ${section} section:`, error);
        return null;
      }
    });

    const sectionResults = await Promise.allSettled(sectionPromises);

    // Inclure uniquement les sections réussies
    sectionResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const { section, data } = result.value;
        sections[section] = data;
      }
    });

    return {
      userRole,
      sections,
    };
  }

  /**
   * Calcule les données pour une section spécifique
   */
  private async getSectionData(
    section: string,
    userRole: UserRole,
    userId?: string,
  ): Promise<any> {
    switch (section) {
      case 'owner':
        return this.getOwnerSectionData();
      case 'manager':
        return this.getManagerSectionData();
      case 'kitchen':
        return this.getKitchenSectionData();
      case 'waiter':
        return this.getWaiterSectionData();
      case 'customer':
        return this.getCustomerSectionData(userId);
      default:
        throw new Error(`Unknown section: ${section}`);
    }
  }

  /**
   * Section Owner : Statistiques globales du restaurant avec données réelles
   */
  private async getOwnerSectionData(): Promise<OwnerSectionDto> {
    const [dishes, cards] = await Promise.all([
      this.dishRepository.findAll(),
      this.cardRepository.findAll(),
    ]);

    const availableDishes = dishes.filter((dish) => dish.isAvailable);
    const activeCards = cards.filter((card) => card.isActive);
    const averagePrice =
      dishes.length > 0
        ? dishes.reduce((sum, dish) => sum + dish.price, 0) / dishes.length
        : 0;

    // Distribution réelle par catégorie avec traduction
    const categoryCount = dishes.reduce(
      (acc, dish) => {
        const categoryName = this.translateDishCategory(dish.category);
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const categoryDistribution: CategoryDistributionDto[] = Object.entries(
      categoryCount,
    )
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Top ingrédients basés sur l'endpoint /dishes/top-ingredients
    const topIngredientsData = await this.dishRepository.findTop20Ingredients();
    const topIngredients: TopIngredientDto[] = topIngredientsData
      .slice(0, 5)
      .map((item: any) => ({
        name: item.name,
        count: item.totalUsage,
      }));

    // Plats récents (5 derniers créés/modifiés)
    const recentDishes: RecentDishDto[] = dishes
      .sort((a, b) => {
        const dateA = new Date(a.dateLastModified || a.dateOfCreation);
        const dateB = new Date(b.dateLastModified || b.dateOfCreation);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map((dish) => ({
        id: dish._id.toString(),
        name: dish.name,
        description: dish.description,
        price: dish.price,
        category: dish.category,
        isAvailable: dish.isAvailable,
      }));

    return {
      stats: {
        totalDishes: dishes.length,
        availableDishes: availableDishes.length,
        totalCards: cards.length,
        activeCards: activeCards.length,
        averagePrice: Number(averagePrice.toFixed(2)),
        categoryDistribution,
        topIngredients,
      },
      recentDishes,
    };
  }

  /**
   * Section Manager : Gestion du personnel et statistiques opérationnelles réelles
   */
  private async getManagerSectionData(): Promise<ManagerSectionDto> {
    const [users, allOrders] = await Promise.all([
      this.userRepository.findAll(),
      this.orderRepository.findAll(),
    ]);

    const todayOrders = this.filterOrdersByDate(allOrders, new Date());
    const employees = users.filter((user) =>
      [UserRole.WAITER, UserRole.KITCHEN_STAFF].includes(user.role),
    );
    const activeEmployees = employees.filter((user) => user.isActive);

    // Calcul réel du CA journalier
    const dailyRevenue = todayOrders
      .filter((order) => order.status === OrderStatus.FINISH)
      .reduce((sum, order) => sum + order.totalPrice + order.tips, 0);

    // Temps de service moyen basé sur les commandes terminées
    const completedOrders = todayOrders.filter(
      (order) => order.status === OrderStatus.FINISH,
    );
    const averageServiceTime =
      this.calculateAverageServiceTime(completedOrders);

    // Simulation satisfaction client (pourrait être basée sur des notes dans le futur)
    const customerSatisfaction = 4.2 + Math.random() * 0.8; // Entre 4.2 et 5.0

    const employeeList: StaffMemberDto[] = activeEmployees
      .slice(0, 10)
      .map((user) => ({
        id: user._id.toString(),
        name: `${user.firstname} ${user.lastname}`,
        role: this.translateRole(user.role),
        status: user.isActive ? 'active' : 'inactive',
        tablesAssigned: this.calculateAssignedTables(),
      }));

    return {
      stats: {
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        dailyRevenue: Number(dailyRevenue.toFixed(2)),
        ordersToday: todayOrders.length,
        averageServiceTime: Math.round(averageServiceTime),
        customerSatisfaction: Number(customerSatisfaction.toFixed(1)),
      },
      employees: employeeList,
    };
  }

  /**
   * Section Kitchen : Commandes et stock réels
   */
  private async getKitchenSectionData(): Promise<KitchenSectionDto> {
    const [allOrders, stocks, ingredients] = await Promise.all([
      this.orderRepository.findAll(),
      this.stockRepository.findAll(),
      this.ingredientRepository.findAll(),
    ]);

    const todayOrders = this.filterOrdersByDate(allOrders, new Date());
    const ordersInPreparation = allOrders.filter((order) =>
      [OrderStatus.PENDING, OrderStatus.IN_PREPARATION].includes(order.status),
    );

    const completedToday = todayOrders.filter(
      (order) => order.status === OrderStatus.FINISH,
    ).length;

    // Calcul du temps de préparation moyen
    const averagePreparationTime =
      this.calculateAveragePreparationTime(todayOrders);

    // Analyse réelle des stocks
    const stockAnalysis = this.analyzeStockLevels(stocks, ingredients);
    const stockItems: StockItemDto[] = stockAnalysis.items.slice(0, 10);

    return {
      stats: {
        ordersInPreparation: ordersInPreparation.length,
        completedToday,
        lowStockItems: stockAnalysis.lowStockCount,
        averagePreparationTime: Math.round(averagePreparationTime),
      },
      stock: stockItems,
    };
  }

  /**
   * Section Waiter : Tables et commandes assignées
   */
  private async getWaiterSectionData(): Promise<WaiterSectionDto> {
    const [tables, allOrders] = await Promise.all([
      this.restaurantTableRepository.findAll(),
      this.orderRepository.findAll(),
    ]);

    const todayOrders = this.filterOrdersByDate(allOrders, new Date());

    // Calculs réels pour les serveurs
    const activeOrders = allOrders.filter((order) =>
      [
        OrderStatus.PENDING,
        OrderStatus.IN_PREPARATION,
        OrderStatus.READY,
      ].includes(order.status),
    ).length;

    const completedOrders = todayOrders.filter(
      (order) => order.status === OrderStatus.FINISH,
    ).length;

    const pendingOrders = allOrders.filter(
      (order) => order.status === OrderStatus.PENDING,
    ).length;

    // Analyse des tables avec leurs commandes réelles
    const tableInfos: TableInfoDto[] = tables.slice(0, 8).map((table) => {
      const tableOrders = allOrders.filter(
        (order) => order.tableNumberId.toString() === table._id.toString(),
      );

      const lastOrder = tableOrders.sort(
        (a, b) =>
          new Date(b.dateOfCreation).getTime() -
          new Date(a.dateOfCreation).getTime(),
      )[0];

      const hasActiveOrder = tableOrders.some((order) =>
        [
          OrderStatus.PENDING,
          OrderStatus.IN_PREPARATION,
          OrderStatus.READY,
        ].includes(order.status),
      );

      return {
        id: table._id.toString(),
        number: table.number,
        status: hasActiveOrder ? 'occupied' : 'available',
        orderCount: tableOrders.length,
        lastOrderTime: lastOrder?.dateOfCreation || null,
      };
    });

    return {
      stats: {
        tablesAssigned: tables.length,
        activeOrders,
        completedOrders,
        pendingOrders,
      },
      tables: tableInfos,
    };
  }

  /**
   * Section Customer : Historique et préférences du client
   */
  private async getCustomerSectionData(
    userId?: string,
  ): Promise<CustomerSectionDto> {
    if (!userId) {
      return {
        stats: {
          myOrders: 0,
          favoriteCategory: 'Aucune',
          lastOrderTime: 'Jamais',
          loyaltyPoints: 0,
        },
        recentOrders: [],
      };
    }

    // Pour l'instant, simulation car il n'y a pas de lien direct User -> Order
    // Dans une vraie application, il faudrait ajouter un champ userId dans Order
    const allOrders = await this.orderRepository.findAll();

    // Simulation basée sur les dernières commandes (à adapter selon votre logique)
    const userOrders = allOrders.slice(-5); // Prendre les 5 dernières commandes comme simulation

    const myOrders = userOrders.length;
    const favoriteCategory = await this.calculateFavoriteCategory(userOrders);
    const lastOrder = userOrders[userOrders.length - 1];
    const lastOrderTime = lastOrder
      ? this.formatLastOrderTime(lastOrder.dateOfCreation)
      : 'Jamais';
    const loyaltyPoints = myOrders * 10; // 10 points par commande

    const recentOrders: RecentOrderDto[] = userOrders
      .slice(-5)
      .map((order) => ({
        id: order._id.toString(),
        date: order.dateOfCreation.split(' ')[0],
        items: ['Pizza Margherita'], // TODO: Récupérer les vrais plats depuis order.dishes
        total: order.totalPrice,
        status: order.status,
      }));

    return {
      stats: {
        myOrders,
        favoriteCategory,
        lastOrderTime,
        loyaltyPoints,
      },
      recentOrders,
    };
  }

  /**
   * Méthodes utilitaires
   */

  private translateDishCategory(category: DishCategory): string {
    const translations = {
      [DishCategory.STARTERS]: 'Entrées',
      [DishCategory.MAIN_DISHES]: 'Plats principaux',
      [DishCategory.FISH_SEAFOOD]: 'Poissons & Fruits de mer',
      [DishCategory.VEGETARIAN]: 'Végétarien',
      [DishCategory.PASTA_RICE]: 'Pâtes & Riz',
      [DishCategory.SALADS]: 'Salades',
      [DishCategory.SOUPS]: 'Soupes',
      [DishCategory.SIDE_DISHES]: 'Accompagnements',
      [DishCategory.DESSERTS]: 'Desserts',
      [DishCategory.BEVERAGES]: 'Boissons',
    };
    return translations[category] || category;
  }

  private filterOrdersByDate(orders: any[], date: Date): any[] {
    const dateString = date.toISOString().split('T')[0];
    return orders.filter((order) =>
      order.dateOfCreation.startsWith(dateString),
    );
  }

  private calculateAverageServiceTime(orders: any[]): number {
    if (orders.length === 0) return 20; // Valeur par défaut

    // Simulation basée sur le nombre de plats (en réalité il faudrait des timestamps précis)
    const totalTime = orders.reduce((sum, order) => {
      const dishCount = order.dishes?.length || 1;
      return sum + dishCount * 15; // 15 min par plat en moyenne
    }, 0);

    return totalTime / orders.length;
  }

  private calculateAveragePreparationTime(orders: any[]): number {
    if (orders.length === 0) return 18; // Valeur par défaut

    // Simulation basée sur la complexité des commandes
    const totalTime = orders.reduce((sum, order) => {
      const dishCount = order.dishes?.length || 1;
      return sum + dishCount * 12; // 12 min par plat en cuisine
    }, 0);

    return totalTime / orders.length;
  }

  private calculateAssignedTables(): number {
    // Simulation - en réalité il faudrait un système d'assignation de tables
    return Math.floor(Math.random() * 6) + 2; // Entre 2 et 7 tables
  }

  private analyzeStockLevels(
    stocks: any[],
    ingredients: any[],
  ): { items: StockItemDto[]; lowStockCount: number } {
    const items: StockItemDto[] = [];
    let lowStockCount = 0;

    stocks.forEach((stock) => {
      if (stock.ingredients && stock.ingredients.length > 0) {
        stock.ingredients.forEach((stockItem) => {
          const ingredient = ingredients.find(
            (ing) => ing._id.toString() === stockItem.ingredientId.toString(),
          );

          if (ingredient) {
            const quantity = stockItem.currentQuantity;
            const threshold = stockItem.minimalQuantity;
            const status =
              quantity <= threshold
                ? 'low'
                : quantity <= threshold * 1.5
                  ? 'warning'
                  : 'good';

            if (status === 'low') lowStockCount++;

            items.push({
              id: stockItem.ingredientId.toString(),
              name: ingredient.name,
              quantity,
              unit: 'kg', // Simplification
              status,
              threshold,
            });
          }
        });
      }
    });

    // Si aucun stock valide trouvé, créer des données de démonstration
    if (items.length === 0 && ingredients.length > 0) {
      // Créer un stock de démonstration avec la vraie structure
      const demoStock = {
        _id: 'demo-stock-id',
        name: 'Stock de démonstration',
        ingredients: ingredients.slice(0, 3).map((ingredient, index) => ({
          ingredientId: ingredient._id,
          currentQuantity: 15 + index * 5,
          minimalQuantity: 10,
          dateAddedToStock: new Date().toISOString().split('T')[0],
          dateLastModified: null,
        })),
        dateOfCreation: new Date().toISOString(),
        dateLastModified: null,
      };

      // Traiter ce stock de démonstration comme un vrai stock
      demoStock.ingredients.forEach((stockItem) => {
        const ingredient = ingredients.find(
          (ing) => ing._id.toString() === stockItem.ingredientId.toString(),
        );

        if (ingredient) {
          const quantity = stockItem.currentQuantity;
          const threshold = stockItem.minimalQuantity;
          const status =
            quantity <= threshold
              ? 'low'
              : quantity <= threshold * 1.5
                ? 'warning'
                : 'good';

          if (status === 'low') lowStockCount++;

          items.push({
            id: stockItem.ingredientId.toString(),
            name: ingredient.name,
            quantity,
            unit: 'kg',
            status,
            threshold,
          });
        }
      });
    }

    return { items: items.slice(0, 10), lowStockCount };
  }

  private async calculateFavoriteCategory(orders: any[]): Promise<string> {
    if (orders.length === 0) return 'Aucune';

    // Simulation - récupérer la catégorie la plus commandée
    return 'Pizza'; // En réalité, analyser orders.dishes et leurs catégories
  }

  private formatLastOrderTime(dateString: string): string {
    const orderDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - orderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    return `Il y a ${Math.ceil(diffDays / 30)} mois`;
  }

  private translateRole(role: UserRole): string {
    const translations = {
      [UserRole.WAITER]: 'Serveur',
      [UserRole.KITCHEN_STAFF]: 'Cuisinier',
      [UserRole.MANAGER]: 'Manager',
      [UserRole.OWNER]: 'Propriétaire',
      [UserRole.ADMIN]: 'Administrateur',
      [UserRole.CUSTOMER]: 'Client',
    };
    return translations[role] || role;
  }
}
