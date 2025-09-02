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
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Créer une nouvelle carte menu',
    description: 'Créer une nouvelle carte de menu avec des plats associés.',
  })
  @ApiBody({
    type: CardDTO,
    description: 'Données de la carte à créer',
    examples: {
      example1: {
        summary: 'Nouvelle carte menu',
        value: {
          name: 'Menu Principal',
          dishesId: ['607f1f77bcf86cd799439011', '607f1f77bcf86cd799439012'],
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Carte créée avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Menu Principal' },
            dishesId: {
              type: 'array',
              items: { type: 'string' },
              example: ['607f1f77bcf86cd799439011'],
            },
            isActive: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  async createOne(@Body() cardData: CardDTO): Promise<Response<Card>> {
    const dto = await this.cardService.createOne(cardData);
    return { error: '', data: dto };
  }

  @Get()
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer toutes les cartes menu',
    description: 'Récupérer la liste complète de toutes les cartes de menu.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des cartes récupérée avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
              name: { type: 'string', example: 'Menu Principal' },
              dishesId: { type: 'array', items: { type: 'string' } },
              isActive: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  async findAll(): Promise<Response<Card[]>> {
    const dtos = await this.cardService.findAll();
    return { error: '', data: dtos };
  }

  @Get(':id')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer une carte menu par ID',
    description: "Récupérer les détails d'une carte de menu spécifique.",
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la carte menu',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Carte récupérée avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Menu Principal' },
            dishesId: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 404, description: 'Carte non trouvée.' })
  async findOne(@Param('id') id: string): Promise<Response<Card>> {
    const response = await this.cardService.findOne(id);

    return { error: '', data: response };
  }

  @Put(':id')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour une carte menu',
    description:
      "Mettre à jour les informations d'une carte de menu existante.",
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la carte menu à mettre à jour',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiBody({
    description: 'Données à mettre à jour (partielles)',
    examples: {
      example1: {
        summary: 'Changer le nom',
        value: {
          name: 'Menu Spécial',
        },
      },
      example2: {
        summary: 'Activer/Désactiver',
        value: {
          isActive: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Carte mise à jour avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Menu Spécial' },
            dishesId: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({ status: 404, description: 'Carte non trouvée.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
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
  @ApiOperation({
    summary: 'Ajouter un plat à une carte menu',
    description: 'Ajouter un plat existant à une carte de menu.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la carte menu',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiParam({
    name: 'dishId',
    description: 'ID unique du plat à ajouter',
    example: '607f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Plat ajouté à la carte avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Menu Principal' },
            dishesId: {
              type: 'array',
              items: { type: 'string' },
              example: ['607f1f77bcf86cd799439011', '607f1f77bcf86cd799439012'],
            },
            isActive: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({ status: 404, description: 'Carte ou plat non trouvé.' })
  @ApiResponse({ status: 400, description: 'Plat déjà présent dans la carte.' })
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
  @ApiOperation({
    summary: "Retirer un plat d'une carte menu",
    description: "Retirer un plat d'une carte de menu existante.",
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la carte menu',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiParam({
    name: 'dishId',
    description: 'ID unique du plat à retirer',
    example: '607f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Plat retiré de la carte avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Menu Principal' },
            dishesId: {
              type: 'array',
              items: { type: 'string' },
              example: ['607f1f77bcf86cd799439012'],
            },
            isActive: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({ status: 404, description: 'Carte ou plat non trouvé.' })
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
  @ApiOperation({
    summary: 'Supprimer une carte menu',
    description: 'Supprimer définitivement une carte de menu.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la carte menu à supprimer',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Carte supprimée avec succès.',
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({ status: 404, description: 'Carte non trouvée.' })
  async deleteOne(@Param('id') id: string): Promise<void> {
    await this.cardService.deleteOne(id);
  }
}
