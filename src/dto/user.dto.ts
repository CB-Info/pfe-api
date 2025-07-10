import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../mongo/models/user.model';

export class UserDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

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
    default: UserRole.CUSTOMER 
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ required: false, description: 'Phone number of the user' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
