import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketType } from '../enums/ticket-type.enum';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, maxlength: 500 })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    required: true, 
    enum: Object.values(TicketStatus), 
    default: TicketStatus.BACKLOG 
  })
  status: string;

  @Prop({ 
    required: true, 
    enum: Object.values(TicketType), 
    default: TicketType.TASK 
  })
  type: string;

  @Prop({ required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  priority: string;

  @Prop({ min: 0, max: 10000, default: 1000 })
  priorityScore: number;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  projectName: string;

  @Prop({ type: Types.ObjectId, ref: 'Sprint', default: null })
  sprintId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  authorName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedToId: Types.ObjectId;

  @Prop({ default: null })
  assignedToName: string;

  @Prop({ type: [Types.ObjectId], ref: 'Label', default: [] })
  labels: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  deadline: Date;

  // Estimation & Time Tracking
  @Prop({ min: 0 })
  storyPoints?: number;

  @Prop({ min: 0 })
  estimatedHours?: number;

  // Acceptance Criteria
  @Prop({ type: [String], default: [] })
  acceptanceCriteria: string[];

  // Watchers (users following this ticket)
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  watchers: Types.ObjectId[];

  // Ticket Relationships
  @Prop({ type: Types.ObjectId, ref: 'Ticket', default: null })
  parentId: Types.ObjectId;

  @Prop({ type: [{
    ticketId: { type: Types.ObjectId, ref: 'Ticket' },
    relationType: { type: String, enum: ['blocks', 'blocked_by', 'relates_to', 'duplicates', 'duplicate_of'] }
  }], default: [] })
  relatedTickets: Array<{
    ticketId: Types.ObjectId;
    relationType: string;
  }>;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Indexes
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ projectId: 1 });
TicketSchema.index({ authorId: 1 });
TicketSchema.index({ assignedToId: 1 });
TicketSchema.index({ createdAt: -1 });

// Transform
TicketSchema.set('toJSON', {
  transform: (doc, ret) => {
    (ret as any).id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});