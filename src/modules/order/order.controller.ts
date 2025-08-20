import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  Delete,
  Post,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { Order } from 'src/mongo/models/order.model';
import { DataType } from 'src/mongo/repositories/base.repository';
import { Response } from 'src/utils/response';
import { OrderDTO } from 'src/dto/order.dto';
import { FirebaseTokenGuard } from 'src/guards/firebase-token.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/guards/roles.decorator';
import { UserRole } from 'src/mongo/models/user.model';

@Controller('orders')
@ApiTags('🛒 Orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(
    UserRole.CUSTOMER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
    UserRole.MANAGER,
    UserRole.OWNER,
    UserRole.ADMIN,
  )
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.CREATED)
  async createOne(@Body() orderData: OrderDTO): Promise<Response<Order>> {
    const response = await this.orderService.createOne(orderData);

    return { error: '', data: response };
  }

  @Get()
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Response<Order[]>> {
    const response = await this.orderService.findAll();

    return { error: '', data: response };
  }

  @Get(':id')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() params: any): Promise<Response<Order>> {
    const response = await this.orderService.findOne(params.id);

    return { error: '', data: response };
  }

  @Put(':id')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(
    UserRole.WAITER,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
    UserRole.OWNER,
    UserRole.ADMIN,
  )
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  async updateOne(
    @Param() params: any,
    @Body() updateData: DataType,
  ): Promise<Response<Order>> {
    const response = await this.orderService.updateOne(params.id, updateData);

    return { error: '', data: response };
  }

  @Delete(':id')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(
    UserRole.WAITER,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
    UserRole.OWNER,
    UserRole.ADMIN,
  )
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param() params: any) {
    await this.orderService.deleteOne(params.id);
  }
}
