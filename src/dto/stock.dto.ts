import {
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class IngredientItemDTO {
  @ApiProperty({
    description: 'ID of the ingredient in stock',
    example: '607f1f77bcf86cd799439011',
    format: 'ObjectId',
  })
  @IsString()
  ingredientId: string;

  @ApiProperty({
    description: 'Current quantity available in stock',
    example: 50,
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  currentQuantity: number;

  @ApiProperty({
    description: 'Minimum quantity threshold for restocking alerts',
    example: 10,
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  minimalQuantity: number;

  @ApiProperty({
    description: 'Date when this ingredient was added to stock',
    example: '2024-01-15 14:30:00',
    format: 'date-time',
  })
  @IsString()
  dateAddedToStock: string;

  @ApiProperty({
    description: 'Date of last modification (optional)',
    example: '2024-01-20 16:45:00',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateLastModified?: string;
}

export class StockDTO {
  @ApiProperty({
    description: 'Name of the stock location or category (must be unique)',
    example: 'Stock Principal',
    minLength: 1,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'List of ingredients in this stock',
    type: [IngredientItemDTO],
    example: [
      {
        ingredientId: '607f1f77bcf86cd799439011',
        currentQuantity: 50,
        minimalQuantity: 10,
        dateAddedToStock: '2024-01-15 14:30:00',
        dateLastModified: '2024-01-20 16:45:00',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientItemDTO)
  ingredients: IngredientItemDTO[];
}
