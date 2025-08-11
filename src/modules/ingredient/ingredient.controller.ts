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
import { IngredientService } from './ingredient.service';
import { IngredientDTO } from 'src/dto/creation/ingredient.dto';
import { Ingredient } from 'src/mongo/models/ingredient.model';
import { Response } from 'src/utils/response';
import { DataType } from 'src/mongo/repositories/base.repository';
import { FirebaseTokenGuard } from 'src/guards/firebase-token.guard';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Ingredients')
@Controller('ingredients')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Post()
  @UseGuards(FirebaseTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new ingredient' })
  @ApiResponse({
    status: 201,
    description: 'Ingredient created',
    type: Ingredient,
  })
  @ApiBody({ type: IngredientDTO })
  @ApiSecurity('Bearer')
  async createOne(
    @Body() ingredientData: IngredientDTO,
  ): Promise<Response<Ingredient>> {
    const response = await this.ingredientService.createOne(ingredientData);

    return { error: '', data: response };
  }

  @Get('/search')
  @UseGuards(FirebaseTokenGuard)
  @ApiOperation({ summary: 'Search ingredients by name' })
  @ApiResponse({
    status: 200,
    description: 'Ingredients matching search',
    type: Ingredient,
    isArray: true,
  })
  @ApiSecurity('Bearer')
  async searchIngredients(
    @Query('name') name: string,
  ): Promise<Response<Ingredient[]>> {
    const response = await this.ingredientService.findByName(name);

    return { error: '', data: response };
  }

  @Get()
  @UseGuards(FirebaseTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all ingredients' })
  @ApiResponse({
    status: 200,
    description: 'List all ingredients',
    type: Ingredient,
    isArray: true,
  })
  @ApiSecurity('Bearer')
  async findAll(): Promise<Response<Ingredient[]>> {
    const response = await this.ingredientService.findAll();

    return { error: '', data: response };
  }

  @Get(':id')
  @UseGuards(FirebaseTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find an ingredient by ID' })
  @ApiResponse({
    status: 200,
    description: 'Ingredient found',
    type: Ingredient,
  })
  @ApiParam({ name: 'id', description: 'Ingredient ID' })
  @ApiSecurity('Bearer')
  async findOne(@Param() params: any): Promise<Response<Ingredient>> {
    const response = await this.ingredientService.findOne(params.id);

    return { error: '', data: response };
  }

  @Put(':id')
  @UseGuards(FirebaseTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an ingredient by ID' })
  @ApiResponse({
    status: 200,
    description: 'Ingredient updated',
    type: Ingredient,
  })
  @ApiParam({ name: 'id', description: 'Ingredient ID' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiSecurity('Bearer')
  async updateOne(
    @Param() params: any,
    @Body() updateData: DataType,
  ): Promise<Response<Ingredient>> {
    const response = await this.ingredientService.updateOne(
      params.id,
      updateData,
    );

    return { error: '', data: response };
  }

  @Delete(':id')
  @UseGuards(FirebaseTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an ingredient by ID' })
  @ApiResponse({ status: 204, description: 'Ingredient deleted' })
  @ApiParam({ name: 'id', description: 'Ingredient ID' })
  @ApiSecurity('Bearer')
  async deleteOne(@Param() params: any) {
    await this.ingredientService.deleteOne(params.id);
  }
}
