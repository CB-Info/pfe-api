import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestaurantTableDTO {
  @ApiProperty({
    description: 'Table number in the restaurant (must be unique)',
    example: 5,
    minimum: 1,
  })
  @IsNumber()
  number: number;
}
