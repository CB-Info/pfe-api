import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { OrderStatus } from '../mongo/models/order.model';

export enum NotificationEventType {
  ORDER_CREATED = 'order_created',
  ORDER_STATUS_UPDATED = 'order_status_updated',
  ORDER_READY_TO_SERVE = 'order_ready_to_serve',
}

export enum NotificationTarget {
  KITCHEN = 'kitchen',
  SERVICE = 'service',
  ALL = 'all',
}

export class OrderEventPayload {
  @ApiProperty({
    description: 'ID of the order',
    example: '607f1f77bcf86cd799439011',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Table number for the order',
    example: 'Table 5',
  })
  @IsString()
  tableNumber: string;

  @ApiProperty({
    enum: OrderStatus,
    description: 'Current status of the order',
    example: OrderStatus.READY,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({
    enum: OrderStatus,
    description: 'Previous status of the order (for status updates)',
    example: OrderStatus.IN_PREPARATION,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  previousStatus?: OrderStatus;

  @ApiProperty({
    description: 'Number of dishes in the order',
    example: 3,
  })
  dishCount: number;

  @ApiProperty({
    description: 'Total price of the order',
    example: 45.5,
  })
  totalPrice: number;
}

export class NotificationEventDTO {
  @ApiProperty({
    enum: NotificationEventType,
    description: 'Type of the notification event',
    example: NotificationEventType.ORDER_CREATED,
  })
  @IsEnum(NotificationEventType)
  type: NotificationEventType;

  @ApiProperty({
    enum: NotificationTarget,
    description: 'Target audience for the notification',
    example: NotificationTarget.KITCHEN,
  })
  @IsEnum(NotificationTarget)
  target: NotificationTarget;

  @ApiProperty({
    description: 'Timestamp of the event',
    example: '2024-01-15T10:30:00Z',
  })
  @IsString()
  timestamp: string;

  @ApiProperty({
    description: 'Event payload containing order details',
    type: OrderEventPayload,
  })
  @IsObject()
  payload: OrderEventPayload;

  @ApiProperty({
    description: 'Optional message for the notification',
    example: 'New order received for Table 5',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}
