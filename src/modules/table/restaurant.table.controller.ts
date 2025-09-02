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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RestaurantTableService } from './restaurant.table.service';
import { RestaurantTable } from 'src/mongo/models/restaurant.table.model';
import { DataType } from 'src/mongo/repositories/base.repository';
import { Response } from 'src/utils/response';
import { RestaurantTableDTO } from 'src/dto/restaurant.table.dto';

@Controller('tables')
@ApiTags('🪑 Tables')
export class RestaurantTableController {
  constructor(
    private readonly restaurantTableService: RestaurantTableService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une nouvelle table',
    description:
      'Créer une nouvelle table de restaurant avec un numéro unique.',
  })
  @ApiBody({
    type: RestaurantTableDTO,
    description: 'Données de la table à créer',
    examples: {
      example1: {
        summary: 'Nouvelle table',
        value: {
          number: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Table créée avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            number: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou numéro de table déjà existant.',
  })
  async createOne(
    @Body() restaurantTableData: RestaurantTableDTO,
  ): Promise<Response<RestaurantTable>> {
    const response =
      await this.restaurantTableService.createOne(restaurantTableData);

    return { error: '', data: response };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer toutes les tables',
    description:
      'Récupérer la liste complète de toutes les tables du restaurant.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des tables récupérée avec succès.',
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
              number: { type: 'number', example: 5 },
            },
          },
        },
      },
    },
  })
  async findAll(): Promise<Response<RestaurantTable[]>> {
    const response = await this.restaurantTableService.findAll();

    return { error: '', data: response };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer une table par ID',
    description: "Récupérer les détails d'une table spécifique.",
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la table',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Table récupérée avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            number: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Table non trouvée.' })
  async findOne(@Param('id') id: string): Promise<Response<RestaurantTable>> {
    const response = await this.restaurantTableService.findOne(id);

    return { error: '', data: response };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour une table',
    description: "Mettre à jour les informations d'une table existante.",
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la table à mettre à jour',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiBody({
    description: 'Données à mettre à jour (partielles)',
    examples: {
      example1: {
        summary: 'Changer le numéro de table',
        value: {
          number: 12,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Table mise à jour avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            number: { type: 'number', example: 12 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Table non trouvée.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  async updateOne(
    @Param('id') id: string,
    @Body() updateData: DataType,
  ): Promise<Response<RestaurantTable>> {
    const response = await this.restaurantTableService.updateOne(
      id,
      updateData,
    );

    return { error: '', data: response };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une table',
    description: 'Supprimer définitivement une table du restaurant.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la table à supprimer',
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Table supprimée avec succès.',
  })
  @ApiResponse({ status: 404, description: 'Table non trouvée.' })
  async deleteOne(@Param('id') id: string) {
    await this.restaurantTableService.deleteOne(id);
  }
}
