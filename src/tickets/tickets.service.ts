import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(@InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>) {}

  async create(createTicketDto: CreateTicketDto, user: any, projectName: string): Promise<any> {
    const ticket = new this.ticketModel({
      ...createTicketDto,
      authorId: user.id,
      authorName: user.name,
      projectName,
      status: 'pending',
    });
    const savedTicket = await ticket.save();
    return savedTicket.toJSON();
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
    const ticket = await this.ticketModel
      .findByIdAndUpdate(id, updateTicketDto, { new: true })
      .exec();
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket.toJSON();
  }

  async delete(id: string): Promise<void> {
    const result = await this.ticketModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Ticket not found');
    }
  }

  async assignTicket(id: string, assignedToId: string, assignedToName: string): Promise<any> {
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
    return ticket.toJSON();
  }

  async updateStatus(id: string, status: string): Promise<any> {
    const ticket = await this.ticketModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket.toJSON();
  }
}
