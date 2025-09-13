import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  Logger,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  NotificationsService,
  NotificationClient,
} from './notifications.service';
import { FirebaseTokenGuard } from '../../guards/firebase-token.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { UserRole } from '../../mongo/models/user.model';
import { NotificationTarget } from '../../dto/notification.dto';
import { v4 as uuidv4 } from 'uuid';

@Controller('notifications')
@ApiTags('🔔 Real-time Notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('kitchen/stream')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(
    UserRole.KITCHEN_STAFF,
    UserRole.MANAGER,
    UserRole.OWNER,
    UserRole.ADMIN,
  )
  @ApiSecurity('Bearer')
  @ApiOperation({
    summary: 'Kitchen SSE stream',
    description: 'Server-Sent Events stream for kitchen staff notifications',
  })
  async getKitchenStream(@Req() req: Request, @Res() res: Response) {
    return this.setupSSEStream(req, res, NotificationTarget.KITCHEN);
  }

  @Get('service/stream')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(UserRole.WAITER, UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiSecurity('Bearer')
  @ApiOperation({
    summary: 'Service SSE stream',
    description: 'Server-Sent Events stream for service staff notifications',
  })
  async getServiceStream(@Req() req: Request, @Res() res: Response) {
    return this.setupSSEStream(req, res, NotificationTarget.SERVICE);
  }

  @Get('stream')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiSecurity('Bearer')
  @ApiOperation({
    summary: 'Combined SSE stream',
    description:
      'Server-Sent Events stream for all notifications (managers and above)',
  })
  @ApiQuery({
    name: 'target',
    enum: NotificationTarget,
    description: 'Filter notifications by target audience',
    required: false,
  })
  async getCombinedStream(
    @Req() req: Request,
    @Res() res: Response,
    @Query('target') target?: NotificationTarget,
  ) {
    const user = req.user as any;

    // Determine target based on query param or user role
    const streamTarget = target || NotificationTarget.ALL;

    // Validate target permissions
    if (target) {
      if (
        target === NotificationTarget.KITCHEN &&
        !this.canAccessKitchen(user.role)
      ) {
        throw new BadRequestException(
          'Insufficient permissions for kitchen notifications',
        );
      }
      if (
        target === NotificationTarget.SERVICE &&
        !this.canAccessService(user.role)
      ) {
        throw new BadRequestException(
          'Insufficient permissions for service notifications',
        );
      }
    }

    return this.setupSSEStream(req, res, streamTarget);
  }

  @Get('status')
  @UseGuards(FirebaseTokenGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiSecurity('Bearer')
  @ApiOperation({
    summary: 'Get notification system status',
    description:
      'Get current status of the notification system including connected clients',
  })
  async getStatus() {
    const clientsCount = this.notificationsService.getClientsCount();

    return {
      error: '',
      data: {
        status: 'active',
        connectedClients: clientsCount,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Setup SSE stream for a client
   */
  private setupSSEStream(
    req: Request,
    res: Response,
    target: NotificationTarget,
  ): void {
    const user = req.user as any;
    const clientId = uuidv4();

    this.logger.log(
      `Setting up SSE stream for user ${user._id} (role: ${user.role}, target: ${target})`,
    );

    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection event
    res.write('retry: 10000\n');
    res.write(`id: ${clientId}\n`);
    res.write('event: connected\n');
    res.write(
      `data: {"message":"Connected to ${target} notifications","timestamp":"${new Date().toISOString()}"}\n\n`,
    );

    // Create client object
    const client: NotificationClient = {
      id: clientId,
      userId: user._id,
      role: user.role,
      target,
      response: res,
    };

    // Register client
    this.notificationsService.addClient(client);

    // Handle client disconnect
    req.on('close', () => {
      this.logger.log(`SSE connection closed for client ${clientId}`);
      this.notificationsService.removeClient(clientId);
    });

    req.on('error', (error) => {
      this.logger.error(`SSE connection error for client ${clientId}:`, error);
      this.notificationsService.removeClient(clientId);
    });

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
      try {
        res.write(`event: heartbeat\n`);
        res.write(`data: {"timestamp":"${new Date().toISOString()}"}\n\n`);
      } catch (error) {
        this.logger.error(`Heartbeat failed for client ${clientId}:`, error);
        clearInterval(heartbeat);
        this.notificationsService.removeClient(clientId);
      }
    }, 30000); // 30 seconds heartbeat

    // Clean up heartbeat on disconnect
    res.on('close', () => {
      clearInterval(heartbeat);
    });
  }

  /**
   * Check if role can access kitchen notifications
   */
  private canAccessKitchen(role: UserRole): boolean {
    return [
      UserRole.KITCHEN_STAFF,
      UserRole.MANAGER,
      UserRole.OWNER,
      UserRole.ADMIN,
    ].includes(role);
  }

  /**
   * Check if role can access service notifications
   */
  private canAccessService(role: UserRole): boolean {
    return [
      UserRole.WAITER,
      UserRole.MANAGER,
      UserRole.OWNER,
      UserRole.ADMIN,
    ].includes(role);
  }
}
