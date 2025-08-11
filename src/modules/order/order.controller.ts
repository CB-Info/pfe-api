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
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from 'src/mongo/models/order.model';
import { DataType } from 'src/mongo/repositories/base.repository';
import { Response } from 'src/utils/response';
import { OrderDTO } from 'src/dto/order.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created', type: Order })
  @ApiBody({ type: OrderDTO })
  async createOne(@Body() orderData: OrderDTO): Promise<Response<Order>> {
    const response = await this.orderService.createOne(orderData);

    return { error: '', data: response };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all orders' })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: Order,
    isArray: true,
  })
  async findAll(): Promise<Response<Order[]>> {
    const response = await this.orderService.findAll();

    return { error: '', data: response };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find an order by ID' })
  @ApiResponse({ status: 200, description: 'Order found', type: Order })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async findOne(@Param() params: any): Promise<Response<Order>> {
    const response = await this.orderService.findOne(params.id);

    return { error: '', data: response };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an order by ID' })
  @ApiResponse({ status: 200, description: 'Order updated', type: Order })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ schema: { type: 'object' } })
  async updateOne(
    @Param() params: any,
    @Body() updateData: DataType,
  ): Promise<Response<Order>> {
    const response = await this.orderService.updateOne(params.id, updateData);

    return { error: '', data: response };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order by ID' })
  @ApiResponse({ status: 204, description: 'Order deleted' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async deleteOne(@Param() params: any) {
    await this.orderService.deleteOne(params.id);
  }
}
