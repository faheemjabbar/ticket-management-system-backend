import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';

export interface CreateActivityDto {
  type: string;
  ticketId: string;
  ticketTitle: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  targetUserId?: string;
  targetUserName?: string;
  oldValue?: string;
  newValue?: string;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
  ) {}

  async create(createActivityDto: CreateActivityDto): Promise<any> {
    const activity = new this.activityModel(createActivityDto);
    const savedActivity = await activity.save();
    return savedActivity.toJSON();
  }

  async findAll(query: any = {}, userRole: string, userId: string): Promise<any> {
    const { limit = 20, offset = 0, userId: filterUserId } = query;
    
    const limitNum = Math.min(Number(limit), 100); // Max 100
    const offsetNum = Number(offset);

    const filter: any = {};

    // Access control
    if (userRole === 'developer') {
      // Developers only see activities for tickets they're involved with
      filter.$or = [
        { userId }, // Activities they created
        { targetUserId: userId }, // Activities where they're the target (assigned to them)
      ];
    }

    // Optional user filter (for admin/qa viewing specific user's activities)
    if (filterUserId && (userRole === 'admin' || userRole === 'qa')) {
      filter.$or = [
        { userId: filterUserId },
        { targetUserId: filterUserId },
      ];
    }

    const [activities, total] = await Promise.all([
      this.activityModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .exec(),
      this.activityModel.countDocuments(filter),
    ]);

    return {
      activities: activities.map(a => a.toJSON()),
      total,
      hasMore: offsetNum + limitNum < total,
    };
  }

  async findByTicketId(ticketId: string): Promise<any[]> {
    const activities = await this.activityModel
      .find({ ticketId })
      .sort({ timestamp: -1 })
      .exec();
    return activities.map(a => a.toJSON());
  }

  async findByUserId(userId: string, limit: number = 20): Promise<any[]> {
    const activities = await this.activityModel
      .find({
        $or: [{ userId }, { targetUserId: userId }],
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
    return activities.map(a => a.toJSON());
  }

  // Helper methods for creating specific activity types
  async logTicketCreated(ticketId: string, ticketTitle: string, userId: string, userName: string) {
    return this.create({
      type: 'ticket_created',
      ticketId,
      ticketTitle,
      userId,
      userName,
      action: 'created',
      details: `Created new ticket`,
    });
  }

  async logTicketAssigned(
    ticketId: string,
    ticketTitle: string,
    userId: string,
    userName: string,
    targetUserId: string,
    targetUserName: string,
  ) {
    return this.create({
      type: 'ticket_assigned',
      ticketId,
      ticketTitle,
      userId,
      userName,
      action: 'assigned',
      details: `Assigned ticket to ${targetUserName}`,
      targetUserId,
      targetUserName,
    });
  }

  async logStatusChanged(
    ticketId: string,
    ticketTitle: string,
    userId: string,
    userName: string,
    oldStatus: string,
    newStatus: string,
  ) {
    return this.create({
      type: 'status_changed',
      ticketId,
      ticketTitle,
      userId,
      userName,
      action: 'status_changed',
      details: `Changed status from ${oldStatus} to ${newStatus}`,
      oldValue: oldStatus,
      newValue: newStatus,
    });
  }

  async logCommentAdded(
    ticketId: string,
    ticketTitle: string,
    userId: string,
    userName: string,
  ) {
    return this.create({
      type: 'comment_added',
      ticketId,
      ticketTitle,
      userId,
      userName,
      action: 'commented',
      details: `Added a comment`,
    });
  }

  async logTicketUpdated(
    ticketId: string,
    ticketTitle: string,
    userId: string,
    userName: string,
    changes: string,
  ) {
    return this.create({
      type: 'ticket_updated',
      ticketId,
      ticketTitle,
      userId,
      userName,
      action: 'updated',
      details: changes,
    });
  }

  async logTicketClosed(
    ticketId: string,
    ticketTitle: string,
    userId: string,
    userName: string,
  ) {
    return this.create({
      type: 'ticket_closed',
      ticketId,
      ticketTitle,
      userId,
      userName,
      action: 'closed',
      details: `Closed the ticket`,
    });
  }
}
