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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { CardService } from './card.service';
import { CardDTO } from 'src/dto/card.dto';
import { Response } from 'src/utils/response';
import { Card } from 'src/mongo/models/card.model';
import { DataType } from 'src/mongo/repositories/base.repository';
import { FirebaseTokenGuard } from 'src/guards/firebase-token.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/guards/roles.decorator';
import { UserRole } from 'src/mongo/models/user.model';

@Controller('cards')
@ApiTags('📋 Cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.CREATED)
  async createOne(@Body() cardData: CardDTO): Promise<Response<Card>> {
    const dto = await this.cardService.createOne(cardData);
    return { error: '', data: dto };
  }

  @Get()
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Response<Card[]>> {
    const dtos = await this.cardService.findAll();
    return { error: '', data: dtos };
  }

  @Get(':id')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() params: any): Promise<Response<Card>> {
    const response = await this.cardService.findOne(params.id);

    return { error: '', data: response };
  }

  @Put(':id')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  async updateOne(
    @Param('id') id: string,
    @Body() updateData: DataType,
  ): Promise<Response<Card>> {
    const dto = await this.cardService.updateOne(id, updateData);
    return { error: '', data: dto };
  }

  @Patch(':id/dishes/:dishId')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  async addDish(
    @Param('id') id: string,
    @Param('dishId') dishId: string,
  ): Promise<Response<Card>> {
    const dto = await this.cardService.addDish(id, dishId);
    return { error: '', data: dto };
  }

  @Delete(':id/dishes/:dishId')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  async removeDish(
    @Param('id') id: string,
    @Param('dishId') dishId: string,
  ): Promise<Response<Card>> {
    const dto = await this.cardService.removeDish(id, dishId);
    return { error: '', data: dto };
  }

  @Delete(':id')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param('id') id: string): Promise<void> {
    await this.cardService.deleteOne(id);
  }
}
