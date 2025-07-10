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
import { OrderService } from './order.service';
import { Order } from 'src/mongo/models/order.model';
import { DataType } from 'src/mongo/repositories/base.repository';
import { Response } from 'src/utils/response';
import { OrderDTO } from 'src/dto/order.dto';
import { FirebaseTokenGuard } from 'src/guards/firebase-token.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(FirebaseTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async createOne(@Body() orderData: OrderDTO): Promise<Response<Order>> {
    const response = await this.orderService.createOne(orderData);

    return { error: '', data: response };
  }

  @Get()
  @UseGuards(FirebaseTokenGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Response<Order[]>> {
    const response = await this.orderService.findAll();

    return { error: '', data: response };
  }

  @Get(':id')
  @UseGuards(FirebaseTokenGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() params: any): Promise<Response<Order>> {
    const response = await this.orderService.findOne(params.id);

    return { error: '', data: response };
  }

  @Put(':id')
  @UseGuards(FirebaseTokenGuard)
  @HttpCode(HttpStatus.OK)
  async updateOne(
    @Param() params: any,
    @Body() updateData: DataType,
  ): Promise<Response<Order>> {
    const response = await this.orderService.updateOne(params.id, updateData);

    return { error: '', data: response };
  }

  @Delete(':id')
  @UseGuards(FirebaseTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param() params: any) {
    await this.orderService.deleteOne(params.id);
  }
}
