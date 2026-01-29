import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TicketHistory, TicketHistoryDocument } from './schemas/ticket-history.schema';

@Injectable()
export class TicketHistoryService {
  constructor(
    @InjectModel(TicketHistory.name) private ticketHistoryModel: Model<TicketHistoryDocument>,
  ) {}

  async create(ticketId: string, userId: string, userName: string, action: string, details?: string): Promise<any> {
    const history = new this.ticketHistoryModel({
      ticketId,
      userId,
      userName,
      action,
      details,
    });
    const savedHistory = await history.save();
    return savedHistory.toJSON();
  }

  async findByTicketId(ticketId: string): Promise<any[]> {
    const history = await this.ticketHistoryModel
      .find({ ticketId })
      .sort({ timestamp: -1 })
      .exec();
    return history.map(h => h.toJSON());
  }
}
