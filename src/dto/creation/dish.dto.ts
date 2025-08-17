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
import { ApiProperty } from '@nestjs/swagger';

export class DishDTO {
  @ApiProperty({
    description: 'Name of the dish (must be unique)',
    example: 'Spaghetti Carbonara',
    minLength: 1,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'List of ingredients required for this dish',
    type: 'DishIngredientDTO',
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DishIngredientDTO)
  ingredients: DishIngredientDTO[];

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
    minLength: 1,
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
    description: 'Cooking time in minutes (optional)',
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
    default: true,
  })
  @IsBoolean()
  isAvailable: boolean;
}

export class DishIngredientDTO {
  @ApiProperty({
    description: 'ID of the ingredient used in this dish',
    example: '607f1f77bcf86cd799439011',
    format: 'ObjectId',
  })
  @IsString()
  ingredientId: string;

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
