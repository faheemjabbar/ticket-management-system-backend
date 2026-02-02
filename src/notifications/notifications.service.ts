import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

export interface Notification {
  id: string;
  type: 'ticket_assigned' | 'ticket_updated' | 'ticket_closed' | 'comment_added' | 'mention';
  title: string;
  message: string;
  userId: string;
  ticketId?: string;
  projectId?: string;
  createdAt: Date;
  read: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(private notificationsGateway: NotificationsGateway) {}

  async notifyTicketAssigned(userId: string, ticketId: string, ticketTitle: string, assignedBy: string) {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'ticket_assigned',
      title: 'New Ticket Assigned',
      message: `You have been assigned to ticket: ${ticketTitle} by ${assignedBy}`,
      userId,
      ticketId,
      createdAt: new Date(),
      read: false,
    };

    this.notificationsGateway.sendNotificationToUser(userId, notification);
  }

  async notifyTicketUpdated(userId: string, ticketId: string, ticketTitle: string, updatedBy: string) {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'ticket_updated',
      title: 'Ticket Updated',
      message: `Ticket "${ticketTitle}" was updated by ${updatedBy}`,
      userId,
      ticketId,
      createdAt: new Date(),
      read: false,
    };

    this.notificationsGateway.sendNotificationToUser(userId, notification);
  }

  async notifyTicketClosed(userId: string, ticketId: string, ticketTitle: string) {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'ticket_closed',
      title: 'Ticket Closed',
      message: `Ticket "${ticketTitle}" has been closed`,
      userId,
      ticketId,
      createdAt: new Date(),
      read: false,
    };

    this.notificationsGateway.sendNotificationToUser(userId, notification);
  }

  async notifyCommentAdded(userId: string, ticketId: string, ticketTitle: string, commentBy: string) {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'comment_added',
      title: 'New Comment',
      message: `${commentBy} commented on ticket: ${ticketTitle}`,
      userId,
      ticketId,
      createdAt: new Date(),
      read: false,
    };

    this.notificationsGateway.sendNotificationToUser(userId, notification);
  }

  async broadcastTicketUpdate(ticketId: string, update: any) {
    this.notificationsGateway.sendTicketUpdate(ticketId, update);
  }

  async broadcastProjectUpdate(projectId: string, update: any) {
    this.notificationsGateway.sendProjectUpdate(projectId, update);
  }
}
