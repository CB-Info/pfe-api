import {
  IsString,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CardDTO {
  @ApiProperty({
    description: 'Name of the restaurant menu card (must be unique)',
    example: 'Menu Principal',
    minLength: 1,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Array of dish IDs included in this menu card',
    example: ['607f1f77bcf86cd799439011', '607f1f77bcf86cd799439012'],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  dishesId: string[];

  @ApiProperty({
    description:
      'Whether this menu card is currently active and visible to customers',
    example: true,
    default: false,
  })
  @IsBoolean()
  isActive: boolean;
}
