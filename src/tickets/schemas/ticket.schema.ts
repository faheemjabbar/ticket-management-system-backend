import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, maxlength: 500 })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['pending', 'assigned', 'awaiting', 'closed'], default: 'pending' })
  status: string;

  @Prop({ required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  priority: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  projectName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  authorName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedToId: Types.ObjectId;

  @Prop({ default: null })
  assignedToName: string;

  @Prop({ type: [String], default: [] })
  labels: string[];

  @Prop({ type: Date, default: null })
  deadline: Date;
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