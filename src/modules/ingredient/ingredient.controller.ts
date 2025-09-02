import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { IngredientService } from './ingredient.service';
import { IngredientDTO } from 'src/dto/creation/ingredient.dto';
import { Ingredient } from 'src/mongo/models/ingredient.model';
import { Response } from 'src/utils/response';
import { DataType } from 'src/mongo/repositories/base.repository';
import { FirebaseTokenGuard } from 'src/guards/firebase-token.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/guards/roles.decorator';
import { UserRole } from 'src/mongo/models/user.model';

@Controller('ingredients')
@ApiTags('🥬 Ingredients')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Post()
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(
    UserRole.KITCHEN_STAFF,
    UserRole.MANAGER,
    UserRole.OWNER,
    UserRole.ADMIN,
  )
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouvel ingrédient',
    description: 'Créer un nouvel ingrédient avec un nom unique.',
  })
  @ApiBody({
    type: IngredientDTO,
    description: "Données de l'ingrédient à créer",
    examples: {
      example1: {
        summary: 'Nouvel ingrédient',
        value: {
          name: 'Tomate',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ingrédient créé avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Tomate' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou nom déjà existant.',
  })
  async createOne(
    @Body() ingredientData: IngredientDTO,
  ): Promise<Response<Ingredient>> {
    const response = await this.ingredientService.createOne(ingredientData);

    return { error: '', data: response };
  }

  @Get('/search')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @ApiOperation({
    summary: 'Rechercher des ingrédients par nom',
    description:
      'Rechercher des ingrédients en filtrant par nom (recherche partielle).',
  })
  @ApiQuery({
    name: 'name',
    description: "Nom ou partie du nom de l'ingrédient à rechercher",
    example: 'tom',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultats de la recherche récupérés avec succès.',
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
              name: { type: 'string', example: 'Tomate' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  async searchIngredients(
    @Query('name') name: string,
  ): Promise<Response<Ingredient[]>> {
    const response = await this.ingredientService.findByName(name);

    return { error: '', data: response };
  }

  @Get()
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer tous les ingrédients',
    description:
      'Récupérer la liste complète de tous les ingrédients disponibles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des ingrédients récupérée avec succès.',
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
              name: { type: 'string', example: 'Tomate' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  async findAll(): Promise<Response<Ingredient[]>> {
    const response = await this.ingredientService.findAll();

    return { error: '', data: response };
  }

  @Get(':id')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer un ingrédient par ID',
    description: "Récupérer les détails d'un ingrédient spécifique.",
  })
  @ApiParam({
    name: 'id',
    description: "ID unique de l'ingrédient",
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Ingrédient récupéré avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Tomate' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 404, description: 'Ingrédient non trouvé.' })
  async findOne(@Param('id') id: string): Promise<Response<Ingredient>> {
    const response = await this.ingredientService.findOne(id);

    return { error: '', data: response };
  }

  @Put(':id')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(
    UserRole.KITCHEN_STAFF,
    UserRole.MANAGER,
    UserRole.OWNER,
    UserRole.ADMIN,
  )
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour un ingrédient',
    description: "Mettre à jour les informations d'un ingrédient existant.",
  })
  @ApiParam({
    name: 'id',
    description: "ID unique de l'ingrédient à mettre à jour",
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiBody({
    description: 'Données à mettre à jour (partielles)',
    examples: {
      example1: {
        summary: 'Changer le nom',
        value: {
          name: 'Tomate cerise',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ingrédient mis à jour avec succès.',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65b3bdff2047d76f7600f160' },
            name: { type: 'string', example: 'Tomate cerise' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({ status: 404, description: 'Ingrédient non trouvé.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  async updateOne(
    @Param('id') id: string,
    @Body() updateData: DataType,
  ): Promise<Response<Ingredient>> {
    const response = await this.ingredientService.updateOne(id, updateData);

    return { error: '', data: response };
  }

  @Delete(':id')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(
    UserRole.KITCHEN_STAFF,
    UserRole.MANAGER,
    UserRole.OWNER,
    UserRole.ADMIN,
  )
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un ingrédient',
    description: 'Supprimer définitivement un ingrédient.',
  })
  @ApiParam({
    name: 'id',
    description: "ID unique de l'ingrédient à supprimer",
    example: '65b3bdff2047d76f7600f160',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Ingrédient supprimé avec succès.',
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes.' })
  @ApiResponse({ status: 404, description: 'Ingrédient non trouvé.' })
  async deleteOne(@Param('id') id: string) {
    await this.ingredientService.deleteOne(id);
  }
}
