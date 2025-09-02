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
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Créer un nouveau stock',
    description:
      'Créer un nouveau stock avec ses ingrédients et quantités associées.',
  })
  @ApiBody({
    type: StockDTO,
    description: 'Données du stock à créer',
    examples: {
      example1: {
        summary: 'Exemple de stock',
        value: {
          name: 'Stock Principal',
          ingredients: [
            {
              ingredientId: '65b3bb33c4b21cc38e0990eb',
              currentQuantity: 50,
              minimalQuantity: 10,
              dateAddedToStock: '2024-01-15 14:30:00',
              dateLastModified: '2024-01-20 16:45:00',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Stock créé avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Stock Principal' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ingredientId: {
                    type: 'string',
                    example: '65b3bb33c4b21cc38e0990eb',
                  },
                  currentQuantity: { type: 'number', example: 50 },
                  minimalQuantity: { type: 'number', example: 10 },
                  dateAddedToStock: {
                    type: 'string',
                    example: '2024-01-15 14:30:00',
                  },
                  dateLastModified: {
                    type: 'string',
                    example: '2024-01-20 16:45:00',
                  },
                },
              },
            },
            dateOfCreation: { type: 'string', example: '2024-01-15 14:30:00' },
            dateLastModified: {
              type: 'string',
              example: '2024-01-20 16:45:00',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  async createOne(@Body() stockData: StockDTO): Promise<Response<Stock>> {
    const response = await this.stockService.createOne(stockData);

    return { error: '', data: response };
  }

  @Get()
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer tous les stocks',
    description:
      'Récupérer la liste complète de tous les stocks avec leurs ingrédients.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des stocks récupérée avec succès.',
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
              name: { type: 'string', example: 'Légumes' },
              ingredients: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ingredientId: {
                      type: 'string',
                      example: '65b3bb33c4b21cc38e0990eb',
                    },
                    currentQuantity: { type: 'number', example: 10 },
                    minimalQuantity: { type: 'number', example: 0 },
                    dateAddedToStock: { type: 'string', example: 'date' },
                    dateLastModified: { type: 'string', example: null },
                  },
                },
              },
              dateOfCreation: {
                type: 'string',
                example: '2024-01-26 15:11:30',
              },
              dateLastModified: {
                type: 'string',
                example: '2024-01-26 15:13:42',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  async findAll(): Promise<Response<Stock[]>> {
    const response = await this.stockService.findAll();

    return { error: '', data: response };
  }

  @Get(':id')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer un stock par ID',
    description:
      "Récupérer les détails d'un stock spécifique avec ses ingrédients.",
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique du stock',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock récupéré avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Légumes' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ingredientId: {
                    type: 'string',
                    example: '65b3bb33c4b21cc38e0990eb',
                  },
                  currentQuantity: { type: 'number', example: 10 },
                  minimalQuantity: { type: 'number', example: 0 },
                  dateAddedToStock: { type: 'string', example: 'date' },
                  dateLastModified: { type: 'string', example: null },
                },
              },
            },
            dateOfCreation: { type: 'string', example: '2024-01-26 15:11:30' },
            dateLastModified: {
              type: 'string',
              example: '2024-01-26 15:13:42',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 404, description: 'Stock non trouvé.' })
  async findOne(@Param('id') id: string): Promise<Response<Stock>> {
    const response = await this.stockService.findOne(id);

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
  @ApiOperation({
    summary: 'Mettre à jour un stock',
    description: "Mettre à jour les informations d'un stock existant.",
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique du stock à mettre à jour',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiBody({
    description: 'Données à mettre à jour (partielles)',
    examples: {
      example1: {
        summary: 'Mise à jour du nom',
        value: {
          name: 'Nouveau nom du stock',
        },
      },
      example2: {
        summary: 'Mise à jour des ingrédients',
        value: {
          ingredients: [
            {
              ingredientId: '65b3bb33c4b21cc38e0990eb',
              currentQuantity: 25,
              minimalQuantity: 5,
              dateAddedToStock: '2024-01-15 14:30:00',
              dateLastModified: '2024-01-20 16:45:00',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Stock mis à jour avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Nouveau nom du stock' },
            ingredients: { type: 'array' },
            dateOfCreation: { type: 'string', example: '2024-01-26 15:11:30' },
            dateLastModified: {
              type: 'string',
              example: '2024-01-26 15:13:42',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({ status: 404, description: 'Stock non trouvé.' })
  async updateOne(
    @Param('id') id: string,
    @Body() updateData: DataType,
  ): Promise<Response<Stock>> {
    const response = await this.stockService.updateOne(id, updateData);

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
  @ApiOperation({
    summary: 'Supprimer un stock',
    description: 'Supprimer définitivement un stock et tous ses ingrédients.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique du stock à supprimer',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Stock supprimé avec succès.',
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({ status: 404, description: 'Stock non trouvé.' })
  async deleteOne(@Param('id') id: string) {
    await this.stockService.deleteOne(id);
  }
}
