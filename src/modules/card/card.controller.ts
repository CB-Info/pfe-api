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
  NotFoundException,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CardDTO } from 'src/dto/card.dto';
import { CardResponseDTO } from 'src/dto/response/card.response.dto';
import { Response } from 'src/utils/response';

@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOne(
    @Body() cardData: CardDTO,
  ): Promise<Response<CardResponseDTO>> {
    const dto = await this.cardService.createOne(cardData);
    return { error: '', data: dto };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Response<CardResponseDTO[]>> {
    const dtos = await this.cardService.findAll();
    return { error: '', data: dtos };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Response<CardResponseDTO>> {
    const dto = await this.cardService.findOne(id);
    if (!dto) throw new NotFoundException(`Carte ${id} introuvable`);
    return { error: '', data: dto };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateOne(
    @Param('id') id: string,
    @Body() updateData: CardDTO,
  ): Promise<Response<CardResponseDTO>> {
    const dto = await this.cardService.updateOne(id, updateData);
    return { error: '', data: dto };
  }

  @Patch(':id/dishes/:dishId')
  @HttpCode(HttpStatus.OK)
  async addDish(
    @Param('id') id: string,
    @Param('dishId') dishId: string,
  ): Promise<Response<CardResponseDTO>> {
    const dto = await this.cardService.addDish(id, dishId);
    return { error: '', data: dto };
  }

  @Delete(':id/dishes/:dishId')
  @HttpCode(HttpStatus.OK)
  async removeDish(
    @Param('id') id: string,
    @Param('dishId') dishId: string,
  ): Promise<Response<CardResponseDTO>> {
    const dto = await this.cardService.removeDish(id, dishId);
    return { error: '', data: dto };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param('id') id: string): Promise<void> {
    await this.cardService.deleteOne(id);
  }
}
