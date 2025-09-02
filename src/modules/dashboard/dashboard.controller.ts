import {
  Controller,
  Get,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { FirebaseTokenGuard } from '../../guards/firebase-token.guard';
import { DashboardResponseDto } from '../../dto/dashboard.dto';
import { UserRole } from '../../mongo/models/user.model';

@ApiTags('📊 Dashboard')
@Controller('dashboard')
@UseGuards(FirebaseTokenGuard)
@ApiSecurity('Bearer')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get dashboard data based on user role',
    description:
      "Returns dashboard sections appropriate for the authenticated user's role according to RBAC hierarchy",
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data successfully retrieved',
    type: DashboardResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during dashboard calculation',
  })
  async getDashboard(@Request() req): Promise<DashboardResponseDto> {
    try {
      // Extraire le rôle et l'ID utilisateur depuis le token Firebase
      const user = req.user;

      if (!user || !user.role) {
        throw new HttpException(
          'User role not found in token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const userRole: UserRole = user.role;
      const userId: string = user._id?.toString();

      // Calculer les données du dashboard selon le rôle
      const dashboardData = await this.dashboardService.getDashboardData(
        userRole,
        userId,
      );

      return {
        error: null,
        data: dashboardData,
      };
    } catch (error) {
      console.error('Dashboard error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Erreur lors du calcul des statistiques du dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
