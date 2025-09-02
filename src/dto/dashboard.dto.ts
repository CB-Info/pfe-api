import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../mongo/models/user.model';
import { DishCategory } from '../mongo/models/dish.model';
import { OrderStatus } from '../mongo/models/order.model';

// Stats sections DTOs
export class CategoryDistributionDto {
  @ApiProperty({ example: 'Pizza' })
  category: string;

  @ApiProperty({ example: 8 })
  count: number;
}

export class TopIngredientDto {
  @ApiProperty({ example: 'Tomate' })
  name: string;

  @ApiProperty({ example: 12 })
  count: number;
}

export class OwnerStatsDto {
  @ApiProperty({ example: 24 })
  totalDishes: number;

  @ApiProperty({ example: 18 })
  availableDishes: number;

  @ApiProperty({ example: 3 })
  totalCards: number;

  @ApiProperty({ example: 2 })
  activeCards: number;

  @ApiProperty({ example: 15.75 })
  averagePrice: number;

  @ApiProperty({ type: [CategoryDistributionDto] })
  categoryDistribution: CategoryDistributionDto[];

  @ApiProperty({ type: [TopIngredientDto] })
  topIngredients: TopIngredientDto[];
}

export class RecentDishDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Pizza Margherita' })
  name: string;

  @ApiProperty({ example: 'Pizza traditionnelle' })
  description: string;

  @ApiProperty({ example: 12.5 })
  price: number;

  @ApiProperty({ enum: DishCategory, example: DishCategory.MAIN_DISHES })
  category: DishCategory;

  @ApiProperty({ example: true })
  isAvailable: boolean;
}

export class OwnerSectionDto {
  @ApiProperty({ type: OwnerStatsDto })
  stats: OwnerStatsDto;

  @ApiProperty({ type: [RecentDishDto] })
  recentDishes: RecentDishDto[];
}

export class ManagerStatsDto {
  @ApiProperty({ example: 8 })
  totalEmployees: number;

  @ApiProperty({ example: 6 })
  activeEmployees: number;

  @ApiProperty({ example: 2450.8 })
  dailyRevenue: number;

  @ApiProperty({ example: 34 })
  ordersToday: number;

  @ApiProperty({ example: 22 })
  averageServiceTime: number;

  @ApiProperty({ example: 4.6 })
  customerSatisfaction: number;
}

export class StaffMemberDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Marie Dubois' })
  name: string;

  @ApiProperty({ example: 'Serveur' })
  role: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 4 })
  tablesAssigned: number;
}

export class ManagerSectionDto {
  @ApiProperty({ type: ManagerStatsDto })
  stats: ManagerStatsDto;

  @ApiProperty({ type: [StaffMemberDto] })
  employees: StaffMemberDto[];
}

export class KitchenStatsDto {
  @ApiProperty({ example: 7 })
  ordersInPreparation: number;

  @ApiProperty({ example: 23 })
  completedToday: number;

  @ApiProperty({ example: 4 })
  lowStockItems: number;

  @ApiProperty({ example: 18 })
  averagePreparationTime: number;
}

export class StockItemDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Tomates' })
  name: string;

  @ApiProperty({ example: 15 })
  quantity: number;

  @ApiProperty({ example: 'kg' })
  unit: string;

  @ApiProperty({ example: 'good' })
  status: string;

  @ApiProperty({ example: 10 })
  threshold: number;
}

export class KitchenSectionDto {
  @ApiProperty({ type: KitchenStatsDto })
  stats: KitchenStatsDto;

  @ApiProperty({ type: [StockItemDto] })
  stock: StockItemDto[];
}

export class WaiterStatsDto {
  @ApiProperty({ example: 8 })
  tablesAssigned: number;

  @ApiProperty({ example: 5 })
  activeOrders: number;

  @ApiProperty({ example: 12 })
  completedOrders: number;

  @ApiProperty({ example: 3 })
  pendingOrders: number;
}

export class TableInfoDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 5 })
  number: number;

  @ApiProperty({ example: 'occupied' })
  status: string;

  @ApiProperty({ example: 2 })
  orderCount: number;

  @ApiProperty({ example: '2024-01-15T14:30:00Z' })
  lastOrderTime: string;
}

export class WaiterSectionDto {
  @ApiProperty({ type: WaiterStatsDto })
  stats: WaiterStatsDto;

  @ApiProperty({ type: [TableInfoDto] })
  tables: TableInfoDto[];
}

export class CustomerStatsDto {
  @ApiProperty({ example: 15 })
  myOrders: number;

  @ApiProperty({ example: 'Pizza' })
  favoriteCategory: string;

  @ApiProperty({ example: 'Il y a 2 jours' })
  lastOrderTime: string;

  @ApiProperty({ example: 245 })
  loyaltyPoints: number;
}

export class RecentOrderDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '2024-01-15' })
  date: string;

  @ApiProperty({ type: [String], example: ['Pizza Margherita', 'Coca Cola'] })
  items: string[];

  @ApiProperty({ example: 18.5 })
  total: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.FINISH })
  status: OrderStatus;
}

export class CustomerSectionDto {
  @ApiProperty({ type: CustomerStatsDto })
  stats: CustomerStatsDto;

  @ApiProperty({ type: [RecentOrderDto] })
  recentOrders: RecentOrderDto[];
}

export class DashboardSectionsDto {
  @ApiProperty({ type: OwnerSectionDto, required: false })
  owner?: OwnerSectionDto;

  @ApiProperty({ type: ManagerSectionDto, required: false })
  manager?: ManagerSectionDto;

  @ApiProperty({ type: KitchenSectionDto, required: false })
  kitchen?: KitchenSectionDto;

  @ApiProperty({ type: WaiterSectionDto, required: false })
  waiter?: WaiterSectionDto;

  @ApiProperty({ type: CustomerSectionDto, required: false })
  customer?: CustomerSectionDto;
}

export class DashboardDataDto {
  @ApiProperty({ enum: UserRole, example: UserRole.OWNER })
  userRole: UserRole;

  @ApiProperty({ type: DashboardSectionsDto })
  sections: DashboardSectionsDto;
}

export class DashboardResponseDto {
  @ApiProperty({ example: null, nullable: true })
  error: string | null;

  @ApiProperty({ type: DashboardDataDto })
  data: DashboardDataDto;
}
