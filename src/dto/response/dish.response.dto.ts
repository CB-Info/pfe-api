import { DishCategory, DishIngredientUnity } from 'src/mongo/models/dish.model';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IngredientResponseDTO } from './ingredient.response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class DishResponseDTO {
  @ApiProperty({
    description: 'Unique identifier of the dish',
    example: '607f1f77bcf86cd799439012',
    format: 'ObjectId',
  })
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Name of the dish',
    example: 'Spaghetti Carbonara',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'List of ingredients with quantities used in this dish',
    type: 'DishIngredientResponseDTO',
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DishIngredientResponseDTO)
  ingredients: DishIngredientResponseDTO[];

  @ApiProperty({
    description: 'Price of the dish in euros',
    example: 15.5,
    minimum: 0,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Detailed description of the dish',
    example:
      'Pâtes italiennes traditionnelles avec lardons, parmesan et crème fraîche',
  })
  @IsString()
  description: string;

  @ApiProperty({
    enum: DishCategory,
    enumName: 'DishCategory',
    description: 'Category of the dish',
    example: DishCategory.MAIN_DISHES,
  })
  @IsEnum(DishCategory)
  category: DishCategory;

  @ApiProperty({
    description: 'Cooking time in minutes',
    example: 15,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  timeCook?: number;

  @ApiProperty({
    description: 'Whether the dish is currently available for ordering',
    example: true,
  })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({
    description: 'Date when the dish was created',
    example: '2024-01-15 14:30:00',
    format: 'date-time',
  })
  @IsString()
  dateOfCreation: string;

  @ApiProperty({
    description: 'Date of last modification',
    example: '2024-01-20 16:45:00',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateLastModified?: string;
}

export class DishIngredientResponseDTO {
  @ApiProperty({
    description: 'Ingredient details',
    type: 'IngredientResponseDTO',
  })
  @ValidateNested()
  @Type(() => IngredientResponseDTO)
  ingredientRef: IngredientResponseDTO;

  @ApiProperty({
    enum: DishIngredientUnity,
    enumName: 'DishIngredientUnity',
    description: 'Unit of measurement for the ingredient quantity',
    example: DishIngredientUnity.MILLILITRE,
  })
  @IsEnum(DishIngredientUnity)
  unity: DishIngredientUnity;

  @ApiProperty({
    description: 'Quantity of the ingredient needed',
    example: 200,
    minimum: 0,
  })
  @IsNumber()
  quantity: number;
}
