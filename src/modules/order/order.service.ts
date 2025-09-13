import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OrderDTO } from 'src/dto/order.dto';
import { Order, OrderStatus } from 'src/mongo/models/order.model';
import { DataType } from 'src/mongo/repositories/base.repository';
import { OrderRepository } from 'src/mongo/repositories/order.repository';
import { RestaurantTableRepository } from 'src/mongo/repositories/restaurant.table.repository';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly restaurantTableRepository: RestaurantTableRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createOne(orderData: OrderDTO): Promise<Order> {
    try {
      const response = await this.orderRepository.insert({
        tableNumberId: orderData.tableNumberId,
        dishes: orderData.dishes,
        status: orderData.status,
        totalPrice: orderData.totalPrice,
        tips: orderData.tips,
      });

      const order = response as Order;

      // Get table information for notifications
      const table = await this.restaurantTableRepository.findOneBy({
        _id: orderData.tableNumberId,
      });
      const tableNumber = table
        ? `Table ${table.number}`
        : `Table ${orderData.tableNumberId}`;

      // Emit order created notification
      this.notificationsService.emitOrderCreated(order, tableNumber);

      return order;
    } catch (e) {
      console.log(e);
      if (e.name === 'ValidationError') {
        throw new BadRequestException(e.message);
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async findAll(): Promise<Order[]> {
    try {
      const response = await this.orderRepository.findAll();

      return response as Order[];
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e.message);
    }
  }

  async findOne(id: string): Promise<Order> {
    try {
      const response = await this.orderRepository.findOneBy({ _id: id });

      if (!response) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      return response as Order;
    } catch (e) {
      console.log(e);
      if (e.name == 'CastError') {
        throw new BadRequestException('Invalid ID format');
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async updateOne(id: string, orderData: DataType): Promise<Order> {
    try {
      // Get the current order to track status changes
      const currentOrder = await this.findOne(id);
      const previousStatus = currentOrder.status;

      const isUpdate = await this.orderRepository.updateOneBy(
        { _id: id },
        orderData,
      );

      if (!isUpdate) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      const updatedOrder = await this.findOne(id);

      // Check if status was updated and emit notifications
      if (orderData.status && orderData.status !== previousStatus) {
        // Get table information for notifications
        const table = await this.restaurantTableRepository.findOneBy({
          _id: updatedOrder.tableNumberId,
        });
        const tableNumber = table
          ? `Table ${table.number}`
          : `Table ${updatedOrder.tableNumberId}`;

        // Emit status update notification
        this.notificationsService.emitOrderStatusUpdated(
          updatedOrder,
          tableNumber,
          previousStatus,
        );

        // Emit specific ready-to-serve notification if status changed to READY
        if (updatedOrder.status === OrderStatus.READY) {
          this.notificationsService.emitOrderReadyToServe(
            updatedOrder,
            tableNumber,
          );
        }
      }

      return updatedOrder as Order;
    } catch (e) {
      console.log(e);
      if (e.message.includes('Unable to update order')) {
        throw new BadRequestException(e.message);
      }
      if (e instanceof NotFoundException) {
        throw e;
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteOne(id: string) {
    try {
      const isDeleted = await this.orderRepository.deleteOneBy({ _id: id });

      if (!isDeleted) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e.message);
    }
  }
}
