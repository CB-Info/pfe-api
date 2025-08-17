// src/mongo/dto/card.response.dto.ts

import {
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DishResponseDTO } from './dish.response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CardResponseDTO {
  @ApiProperty({
    description: 'Unique identifier of the menu card',
    example: '607f1f77bcf86cd799439013',
    format: 'ObjectId',
  })
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Name of the restaurant menu card',
    example: 'Menu Principal',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description:
      'List of dishes included in this menu card (populated from dishesId)',
    type: 'DishResponseDTO',
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DishResponseDTO)
  dishes: DishResponseDTO[];

  @ApiProperty({
    description:
      'Whether this menu card is currently active and visible to customers',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Date when the menu card was created',
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
