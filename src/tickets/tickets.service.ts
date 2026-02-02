import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    private notificationsService: NotificationsService,
    private activitiesService: ActivitiesService,
  ) {}

  async create(createTicketDto: CreateTicketDto, user: any, projectName: string): Promise<any> {
    const ticket = new this.ticketModel({
      ...createTicketDto,
      authorId: user.id,
      authorName: user.name,
      projectName,
      status: 'pending',
    });
    const savedTicket = await ticket.save();
    const ticketJson = savedTicket.toJSON() as any;

    // Log activity
    await this.activitiesService.logTicketCreated(
      ticketJson.id,
      ticketJson.title,
      user.id,
      user.name,
    );

    return ticketJson;
  }

  async findAll(query: any = {}): Promise<any> {
    const { status, priority, projectId, page = 1, limit = 20 } = query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (projectId) filter.projectId = projectId;

    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      this.ticketModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).exec(),
      this.ticketModel.countDocuments(filter),
    ]);

    return {
      tickets: tickets.map(t => t.toJSON()),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<any> {
    const ticket = await this.ticketModel.findById(id).exec();
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket.toJSON();
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<any> {
    const oldTicket = await this.ticketModel.findById(id).exec();
    if (!oldTicket) {
      throw new NotFoundException('Ticket not found');
    }

    const ticket = await this.ticketModel
      .findByIdAndUpdate(id, updateTicketDto, { new: true })
      .exec();
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const ticketJson = ticket.toJSON() as any;

    // Log activity for updates
    const changes: string[] = [];
    if (updateTicketDto.title && updateTicketDto.title !== oldTicket.title) {
      changes.push('title');
    }
    if (updateTicketDto.description && updateTicketDto.description !== oldTicket.description) {
      changes.push('description');
    }
    if (updateTicketDto.priority && updateTicketDto.priority !== oldTicket.priority) {
      changes.push('priority');
    }

    if (changes.length > 0) {
      await this.activitiesService.logTicketUpdated(
        ticketJson.id,
        ticketJson.title,
        'System', // You can pass actual user from controller
        'System',
        `Updated ${changes.join(', ')}`,
      );
    }

    return ticketJson;
  }

  async delete(id: string): Promise<void> {
    const result = await this.ticketModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Ticket not found');
    }
  }

  async assignTicket(id: string, assignedToId: string, assignedToName: string, assignedBy: any): Promise<any> {
    const ticket = await this.ticketModel
      .findByIdAndUpdate(
        id,
        { assignedToId, assignedToName, status: 'assigned' },
        { new: true }
      )
      .exec();
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const ticketJson = ticket.toJSON() as any;

    // Log activity
    await this.activitiesService.logTicketAssigned(
      ticketJson.id,
      ticketJson.title,
      assignedBy.id,
      assignedBy.name,
      assignedToId,
      assignedToName,
    );

    // Send real-time notification
    await this.notificationsService.notifyTicketAssigned(
      assignedToId,
      ticketJson.id,
      ticketJson.title,
      assignedBy.name,
    );

    // Broadcast ticket update
    await this.notificationsService.broadcastTicketUpdate(ticketJson.id, {
      action: 'assigned',
      ticket: ticketJson,
    });

    return ticketJson;
  }

  async updateStatus(id: string, status: string, user: any): Promise<any> {
    const oldTicket = await this.ticketModel.findById(id).exec();
    if (!oldTicket) {
      throw new NotFoundException('Ticket not found');
    }

    const oldStatus = oldTicket.status;

    const ticket = await this.ticketModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const ticketJson = ticket.toJSON() as any;

    // Log activity
    await this.activitiesService.logStatusChanged(
      ticketJson.id,
      ticketJson.title,
      user.id,
      user.name,
      oldStatus,
      status,
    );

    // Send notification if ticket is closed
    if (status === 'closed') {
      if (ticket.assignedToId) {
        await this.notificationsService.notifyTicketClosed(
          ticket.assignedToId.toString(),
          ticketJson.id,
          ticketJson.title,
        );
      }

      // Log closed activity
      await this.activitiesService.logTicketClosed(
        ticketJson.id,
        ticketJson.title,
        user.id,
        user.name,
      );
    }

    // Broadcast ticket update
    await this.notificationsService.broadcastTicketUpdate(ticketJson.id, {
      action: 'status_changed',
      status,
      ticket: ticketJson,
    });

    return ticketJson;
  }
}
