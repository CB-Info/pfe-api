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

export class CardResponseDTO {
  @IsString()
  _id: string;

  @IsString()
  name: string;

  /**
   * Liste des plats peuplés via Mongoose `populate('dishesId')`
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DishResponseDTO)
  dishes: DishResponseDTO[];

  @IsBoolean()
  isActive: boolean;

  @IsString()
  dateOfCreation: string;

  @IsOptional()
  @IsString()
  dateLastModified?: string;
}
