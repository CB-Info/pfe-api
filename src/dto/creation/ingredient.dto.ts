import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IngredientDTO {
  @ApiProperty({
    description: 'Name of the ingredient (must be unique)',
    example: 'Tomate',
    minLength: 1,
  })
  @IsString()
  name: string;
}
