import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '../mongo/models/user.model';

export class UserDTO {
  @ApiProperty({
    description: 'Email address of the user (must be unique)',
    example: 'john.doe@restaurant.com',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for Firebase authentication',
    example: 'SecurePassword123!',
    minLength: 6,
  })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    minLength: 1,
  })
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    minLength: 1,
  })
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    description: 'Role of the user in the restaurant system',
    example: UserRole.CUSTOMER,
    default: UserRole.CUSTOMER,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    description: 'Phone number of the user (optional)',
    example: '+33123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class LoginDTO {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@restaurant.com',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'SecurePassword123!',
    minLength: 6,
  })
  @IsNotEmpty()
  password: string;
}
