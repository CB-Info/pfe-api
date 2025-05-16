import {
  IsString,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  IsMongoId,
} from 'class-validator';

export class CardDTO {
  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  dishesId: string[];

  @IsBoolean()
  isActive: boolean;
}
