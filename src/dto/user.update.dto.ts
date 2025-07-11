import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '../mongo/models/user.model';

export class UserUpdateDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    description: 'Role of the user in the restaurant',
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ required: false, description: 'Phone number of the user' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    required: false,
    description: 'Whether the user account is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
