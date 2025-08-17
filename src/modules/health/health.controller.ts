import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('🏥 Health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Returns the health status of the application and basic environment information',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 123.456 },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '0.0.1' },
      },
    },
  })
  checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.0.1',
    };
  }
}
