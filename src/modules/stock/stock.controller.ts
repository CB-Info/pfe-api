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
import { Response } from 'src/utils/response';
import { DataType } from 'src/mongo/repositories/base.repository';
import { StockService } from './stock.service';
import { Stock } from 'src/mongo/models/stock.model';
import { StockDTO } from 'src/dto/stock.dto';
import { FirebaseTokenGuard } from 'src/guards/firebase-token.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/guards/roles.decorator';
import { UserRole } from 'src/mongo/models/user.model';

@Controller('stocks')
@ApiTags('📦 Stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
    UserRole.OWNER,
    UserRole.ADMIN,
  )
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.CREATED)
  async createOne(@Body() stockData: StockDTO): Promise<Response<Stock>> {
    const response = await this.stockService.createOne(stockData);

    return { error: '', data: response };
  }

  @Get()
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Response<Stock[]>> {
    const response = await this.stockService.findAll();

    return { error: '', data: response };
  }

  @Get(':id')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() params: any): Promise<Response<Stock>> {
    const response = await this.stockService.findOne(params.id);

    return { error: '', data: response };
  }

  @Put(':id')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(
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
  ): Promise<Response<Stock>> {
    const response = await this.stockService.updateOne(params.id, updateData);

    return { error: '', data: response };
  }

  @Delete(':id')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
    UserRole.OWNER,
    UserRole.ADMIN,
  )
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param() params: any) {
    await this.stockService.deleteOne(params.id);
  }
}
