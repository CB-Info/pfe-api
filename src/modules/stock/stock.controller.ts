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
import { Response } from 'src/utils/response';
import { DataType } from 'src/mongo/repositories/base.repository';
import { StockService } from './stock.service';
import { Stock } from 'src/mongo/models/stock.model';
import { StockDTO } from 'src/dto/stock.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Stocks')
@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new stock record' })
  @ApiResponse({ status: 201, description: 'Stock created', type: Stock })
  @ApiBody({ type: StockDTO })
  async createOne(@Body() stockData: StockDTO): Promise<Response<Stock>> {
    const response = await this.stockService.createOne(stockData);

    return { error: '', data: response };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all stock records' })
  @ApiResponse({
    status: 200,
    description: 'List of stock records',
    type: Stock,
    isArray: true,
  })
  async findAll(): Promise<Response<Stock[]>> {
    const response = await this.stockService.findAll();

    return { error: '', data: response };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find a stock record by ID' })
  @ApiResponse({ status: 200, description: 'Stock record found', type: Stock })
  @ApiParam({ name: 'id', description: 'Stock ID' })
  async findOne(@Param() params: any): Promise<Response<Stock>> {
    const response = await this.stockService.findOne(params.id);

    return { error: '', data: response };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a stock record by ID' })
  @ApiResponse({ status: 200, description: 'Stock updated', type: Stock })
  @ApiParam({ name: 'id', description: 'Stock ID' })
  @ApiBody({ schema: { type: 'object' } })
  async updateOne(
    @Param() params: any,
    @Body() updateData: DataType,
  ): Promise<Response<Stock>> {
    const response = await this.stockService.updateOne(params.id, updateData);

    return { error: '', data: response };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a stock record by ID' })
  @ApiResponse({ status: 204, description: 'Stock deleted' })
  @ApiParam({ name: 'id', description: 'Stock ID' })
  async deleteOne(@Param() params: any) {
    await this.stockService.deleteOne(params.id);
  }
}
