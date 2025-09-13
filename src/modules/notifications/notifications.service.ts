import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  NotificationEventDTO,
  NotificationEventType,
  NotificationTarget,
  OrderEventPayload,
} from '../../dto/notification.dto';
import { Order, OrderStatus } from '../../mongo/models/order.model';
import { UserRole } from '../../mongo/models/user.model';

export interface NotificationClient {
  id: string;
  userId: string;
  role: UserRole;
  target: NotificationTarget;
  response: any; // Express Response object
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly eventSubject = new Subject<NotificationEventDTO>();
  private readonly clients = new Map<string, NotificationClient>();

  constructor() {
    this.logger.log('NotificationsService initialized');
  }

  /**
   * Add a new SSE client
   */
  addClient(client: NotificationClient): void {
    this.clients.set(client.id, client);
    this.logger.log(
      `Client connected: ${client.id} (user: ${client.userId}, role: ${client.role}, target: ${client.target})`,
    );

    // Setup client cleanup on disconnect
    client.response.on('close', () => {
      this.removeClient(client.id);
    });

    // Send initial connection confirmation
    this.sendToClient(client.id, {
      type: NotificationEventType.ORDER_STATUS_UPDATED,
      target: client.target,
      timestamp: new Date().toISOString(),
      payload: {
        orderId: 'connection',
        tableNumber: 'System',
        status: OrderStatus.PENDING,
        dishCount: 0,
        totalPrice: 0,
      },
      message: 'Connected to real-time notifications',
    });
  }

  /**
   * Remove a SSE client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      this.logger.log(`Client disconnected: ${clientId}`);
    }
  }

  /**
   * Get observable stream filtered by target audience
   */
  getEventStream(target: NotificationTarget): Observable<NotificationEventDTO> {
    return this.eventSubject
      .asObservable()
      .pipe(
        filter(
          (event) =>
            event.target === target || event.target === NotificationTarget.ALL,
        ),
      );
  }

  /**
   * Send notification to specific client
   */
  private sendToClient(clientId: string, event: NotificationEventDTO): void {
    const client = this.clients.get(clientId);
    if (!client) {
      this.logger.warn(`Client not found: ${clientId}`);
      return;
    }

    try {
      const data = JSON.stringify(event);
      client.response.write(`data: ${data}\n\n`);
      this.logger.debug(`Event sent to client ${clientId}: ${event.type}`);
    } catch (error) {
      this.logger.error(`Failed to send event to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  /**
   * Broadcast event to all relevant clients
   */
  private broadcastEvent(event: NotificationEventDTO): void {
    const relevantClients = Array.from(this.clients.values()).filter((client) =>
      this.shouldReceiveEvent(client, event),
    );

    this.logger.log(
      `Broadcasting ${event.type} to ${relevantClients.length} clients (target: ${event.target})`,
    );

    relevantClients.forEach((client) => {
      this.sendToClient(client.id, event);
    });
  }

  /**
   * Check if a client should receive a specific event based on role and target
   */
  private shouldReceiveEvent(
    client: NotificationClient,
    event: NotificationEventDTO,
  ): boolean {
    // Check target match
    if (
      event.target !== NotificationTarget.ALL &&
      event.target !== client.target
    ) {
      return false;
    }

    // Check role permissions
    switch (event.target) {
      case NotificationTarget.KITCHEN:
        return this.canAccessKitchen(client.role);
      case NotificationTarget.SERVICE:
        return this.canAccessService(client.role);
      case NotificationTarget.ALL:
        return (
          this.canAccessKitchen(client.role) ||
          this.canAccessService(client.role)
        );
      default:
        return false;
    }
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

  /**
   * Emit a new order created event
   */
  emitOrderCreated(order: Order, tableNumber: string): void {
    const event: NotificationEventDTO = {
      type: NotificationEventType.ORDER_CREATED,
      target: NotificationTarget.KITCHEN,
      timestamp: new Date().toISOString(),
      payload: this.buildOrderPayload(order, tableNumber),
      message: `Nouvelle commande reçue pour ${tableNumber}`,
    };

    this.logger.log(`Emitting ORDER_CREATED event for order ${order._id}`);
    this.eventSubject.next(event);
    this.broadcastEvent(event);
  }

  /**
   * Emit an order status updated event
   */
  emitOrderStatusUpdated(
    order: Order,
    tableNumber: string,
    previousStatus: OrderStatus,
  ): void {
    const target = this.getTargetForStatusUpdate(order.status, previousStatus);

    const event: NotificationEventDTO = {
      type: NotificationEventType.ORDER_STATUS_UPDATED,
      target,
      timestamp: new Date().toISOString(),
      payload: {
        ...this.buildOrderPayload(order, tableNumber),
        previousStatus,
      },
      message: this.getStatusUpdateMessage(order.status, tableNumber),
    };

    this.logger.log(
      `Emitting ORDER_STATUS_UPDATED event for order ${order._id}: ${previousStatus} → ${order.status}`,
    );
    this.eventSubject.next(event);
    this.broadcastEvent(event);
  }

  /**
   * Emit an order ready to serve event (specific for service team)
   */
  emitOrderReadyToServe(order: Order, tableNumber: string): void {
    const event: NotificationEventDTO = {
      type: NotificationEventType.ORDER_READY_TO_SERVE,
      target: NotificationTarget.SERVICE,
      timestamp: new Date().toISOString(),
      payload: this.buildOrderPayload(order, tableNumber),
      message: `Commande prête à servir pour ${tableNumber}`,
    };

    this.logger.log(
      `Emitting ORDER_READY_TO_SERVE event for order ${order._id}`,
    );
    this.eventSubject.next(event);
    this.broadcastEvent(event);
  }

  /**
   * Build order payload for events
   */
  private buildOrderPayload(
    order: Order,
    tableNumber: string,
  ): OrderEventPayload {
    return {
      orderId: order._id.toString(),
      tableNumber,
      status: order.status,
      dishCount: order.dishes.length,
      totalPrice: order.totalPrice,
    };
  }

  /**
   * Determine target audience based on status change
   */
  private getTargetForStatusUpdate(
    newStatus: OrderStatus,
    previousStatus: OrderStatus,
  ): NotificationTarget {
    // Ready status should notify service team
    if (newStatus === OrderStatus.READY) {
      return NotificationTarget.SERVICE;
    }

    // Kitchen-related statuses
    if (
      newStatus === OrderStatus.IN_PREPARATION ||
      previousStatus === OrderStatus.PENDING
    ) {
      return NotificationTarget.KITCHEN;
    }

    // Delivered/Finished statuses can notify both
    if (
      newStatus === OrderStatus.DELIVERED ||
      newStatus === OrderStatus.FINISH
    ) {
      return NotificationTarget.ALL;
    }

    return NotificationTarget.ALL;
  }

  /**
   * Generate appropriate message for status updates
   */
  private getStatusUpdateMessage(
    status: OrderStatus,
    tableNumber: string,
  ): string {
    switch (status) {
      case OrderStatus.PENDING:
        return `Commande en attente pour ${tableNumber}`;
      case OrderStatus.IN_PREPARATION:
        return `Préparation commencée pour ${tableNumber}`;
      case OrderStatus.READY:
        return `Commande prête à servir pour ${tableNumber}`;
      case OrderStatus.DELIVERED:
        return `Commande livrée pour ${tableNumber}`;
      case OrderStatus.FINISH:
        return `Commande terminée pour ${tableNumber}`;
      case OrderStatus.CANCELLED:
        return `Commande annulée pour ${tableNumber}`;
      default:
        return `Statut mis à jour pour ${tableNumber}`;
    }
  }

  /**
   * Get connected clients count by target
   */
  getClientsCount(): { kitchen: number; service: number; total: number } {
    const clients = Array.from(this.clients.values());
    return {
      kitchen: clients.filter((c) => c.target === NotificationTarget.KITCHEN)
        .length,
      service: clients.filter((c) => c.target === NotificationTarget.SERVICE)
        .length,
      total: clients.length,
    };
  }
}
