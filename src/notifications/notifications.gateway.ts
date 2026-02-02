import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove user from map
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: string) {
    this.userSockets.set(userId, client.id);
    console.log(`User ${userId} registered with socket ${client.id}`);
    return { event: 'registered', data: { userId } };
  }

  // Emit notification to specific user
  sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }

  // Emit notification to all users
  sendNotificationToAll(notification: any) {
    this.server.emit('notification', notification);
  }

  // Emit ticket update to all users watching a specific ticket
  sendTicketUpdate(ticketId: string, update: any) {
    this.server.emit(`ticket:${ticketId}:update`, update);
  }

  // Emit project update
  sendProjectUpdate(projectId: string, update: any) {
    this.server.emit(`project:${projectId}:update`, update);
  }
}
