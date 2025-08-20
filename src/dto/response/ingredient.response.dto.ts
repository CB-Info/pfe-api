import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IngredientResponseDTO {
  @ApiProperty({
    description: 'Unique identifier of the ingredient',
    example: '607f1f77bcf86cd799439011',
    format: 'ObjectId',
  })
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Name of the ingredient',
    example: 'Tomate',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Date when the ingredient was created',
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
