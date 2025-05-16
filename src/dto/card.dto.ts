import { IsString, IsBoolean, IsArray, ArrayNotEmpty } from 'class-validator';

export class CardDTO {
  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  dishesId: string[];

  @IsBoolean()
  isActive: boolean;
}
