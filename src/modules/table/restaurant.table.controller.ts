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
import { RestaurantTableService } from './restaurant.table.service';
import { RestaurantTable } from 'src/mongo/models/restaurant.table.model';
import { DataType } from 'src/mongo/repositories/base.repository';
import { Response } from 'src/utils/response';
import { RestaurantTableDTO } from 'src/dto/restaurant.table.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Tables')
@Controller('tables')
export class RestaurantTableController {
  constructor(
    private readonly restaurantTableService: RestaurantTableService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new table' })
  @ApiResponse({
    status: 201,
    description: 'Table created',
    type: RestaurantTable,
  })
  @ApiBody({ type: RestaurantTableDTO })
  async createOne(
    @Body() restaurantTableData: RestaurantTableDTO,
  ): Promise<Response<RestaurantTable>> {
    const response =
      await this.restaurantTableService.createOne(restaurantTableData);

    return { error: '', data: response };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all tables' })
  @ApiResponse({
    status: 200,
    description: 'List of tables',
    type: RestaurantTable,
    isArray: true,
  })
  async findAll(): Promise<Response<RestaurantTable[]>> {
    const response = await this.restaurantTableService.findAll();

    return { error: '', data: response };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find a table by ID' })
  @ApiResponse({
    status: 200,
    description: 'Table found',
    type: RestaurantTable,
  })
  @ApiParam({ name: 'id', description: 'Table ID' })
  async findOne(@Param() params: any): Promise<Response<RestaurantTable>> {
    const response = await this.restaurantTableService.findOne(params.id);

    return { error: '', data: response };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a table by ID' })
  @ApiResponse({
    status: 200,
    description: 'Table updated',
    type: RestaurantTable,
  })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiBody({ schema: { type: 'object' } })
  async updateOne(
    @Param() params: any,
    @Body() updateData: DataType,
  ): Promise<Response<RestaurantTable>> {
    const response = await this.restaurantTableService.updateOne(
      params.id,
      updateData,
    );

    return { error: '', data: response };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a table by ID' })
  @ApiResponse({ status: 204, description: 'Table deleted' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  async deleteOne(@Param() params: any) {
    await this.restaurantTableService.deleteOne(params.id);
  }
}
