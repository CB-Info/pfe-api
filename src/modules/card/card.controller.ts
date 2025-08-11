// src/controllers/card.controller.ts
import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  Delete,
  Post,
  Patch,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CardDTO } from 'src/dto/card.dto';
import { Response } from 'src/utils/response';
import { Card } from 'src/mongo/models/card.model';
import { DataType } from 'src/mongo/repositories/base.repository';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Cards')
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new card' })
  @ApiResponse({ status: 201, description: 'Card created', type: Card })
  @ApiBody({ type: CardDTO })
  async createOne(@Body() cardData: CardDTO): Promise<Response<Card>> {
    const dto = await this.cardService.createOne(cardData);
    return { error: '', data: dto };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all cards' })
  @ApiResponse({
    status: 200,
    description: 'List of cards',
    type: Card,
    isArray: true,
  })
  async findAll(): Promise<Response<Card[]>> {
    const dtos = await this.cardService.findAll();
    return { error: '', data: dtos };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find a card by ID' })
  @ApiResponse({ status: 200, description: 'Card found', type: Card })
  @ApiParam({ name: 'id', description: 'Card ID' })
  async findOne(@Param() params: any): Promise<Response<Card>> {
    const response = await this.cardService.findOne(params.id);

    return { error: '', data: response };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a card by ID' })
  @ApiResponse({ status: 200, description: 'Card updated', type: Card })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiBody({ schema: { type: 'object' } })
  async updateOne(
    @Param('id') id: string,
    @Body() updateData: DataType,
  ): Promise<Response<Card>> {
    const dto = await this.cardService.updateOne(id, updateData);
    return { error: '', data: dto };
  }

  @Patch(':id/dishes/:dishId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a dish to a card' })
  @ApiResponse({ status: 200, description: 'Dish added to card', type: Card })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiParam({ name: 'dishId', description: 'Dish ID' })
  async addDish(
    @Param('id') id: string,
    @Param('dishId') dishId: string,
  ): Promise<Response<Card>> {
    const dto = await this.cardService.addDish(id, dishId);
    return { error: '', data: dto };
  }

  @Delete(':id/dishes/:dishId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a dish from a card' })
  @ApiResponse({
    status: 200,
    description: 'Dish removed from card',
    type: Card,
  })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiParam({ name: 'dishId', description: 'Dish ID' })
  async removeDish(
    @Param('id') id: string,
    @Param('dishId') dishId: string,
  ): Promise<Response<Card>> {
    const dto = await this.cardService.removeDish(id, dishId);
    return { error: '', data: dto };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a card by ID' })
  @ApiResponse({ status: 204, description: 'Card deleted' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  async deleteOne(@Param('id') id: string): Promise<void> {
    await this.cardService.deleteOne(id);
  }
}
