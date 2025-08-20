import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDTO<T> {
  @ApiProperty({
    description: 'Error message (empty string if no error)',
    example: '',
  })
  error: string;

  @ApiProperty({
    description: 'Response data',
  })
  data: T;
}

export class ApiLoginResponseDTO {
  @ApiProperty({
    description: 'Error message (empty string if no error)',
    example: '',
  })
  error: string;

  @ApiProperty({
    description: 'Login response data',
    type: 'object',
    properties: {
      user: {
        description: 'User information',
        example: {
          _id: '607f1f77bcf86cd799439011',
          email: 'john.doe@restaurant.com',
          firstname: 'John',
          lastname: 'Doe',
          role: 'customer',
        },
      },
      token: {
        type: 'string',
        description: 'JWT authentication token',
        example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      message: {
        type: 'string',
        description: 'Success message with instructions',
        example:
          '✅ Connexion réussie ! Copiez le token ci-dessus et utilisez-le dans "Authorize" 🔓',
      },
    },
  })
  data: {
    user: any;
    token: string;
    message: string;
  };
}
