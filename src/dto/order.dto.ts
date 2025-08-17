import {
  IsString,
  IsArray,
  IsEnum,
  IsNumber,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { OrderStatus } from 'src/mongo/models/order.model';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DishOrderDTO {
  @ApiProperty({
    description: 'ID of the dish to be ordered',
    example: '607f1f77bcf86cd799439012',
    format: 'ObjectId',
  })
  @IsString()
  dishId: string;

  @ApiProperty({
    description: 'Whether this dish has been paid for',
    example: false,
    default: false,
  })
  @IsBoolean()
  isPaid: boolean;
}

export class OrderDTO {
  @ApiProperty({
    description: 'ID of the restaurant table for this order',
    example: '607f1f77bcf86cd799439011',
    format: 'ObjectId',
  })
  @IsString()
  tableNumberId: string;

  @ApiProperty({
    description: 'List of dishes included in this order',
    type: [DishOrderDTO],
    example: [
      {
        dishId: '607f1f77bcf86cd799439012',
        isPaid: false,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DishOrderDTO)
  dishes: DishOrderDTO[];

  @ApiProperty({
    enum: OrderStatus,
    enumName: 'OrderStatus',
    description: 'Current status of the order',
    example: OrderStatus.FINISH,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({
    description: 'Total price of the order in euros',
    example: 45.5,
    minimum: 0,
  })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({
    description: 'Tips amount in euros',
    example: 5.0,
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  tips: number;
}
