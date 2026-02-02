import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: true })
export class Activity {
  @Prop({
    required: true,
    enum: [
      'ticket_created',
      'ticket_assigned',
      'ticket_updated',
      'status_changed',
      'comment_added',
      'ticket_closed',
      'priority_changed',
      'label_added',
      'label_removed',
    ],
  })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Ticket', required: true })
  ticketId: Types.ObjectId;

  @Prop({ required: true })
  ticketTitle: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  details: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  targetUserId: Types.ObjectId; // For assignments

  @Prop({ default: null })
  targetUserName: string;

  @Prop({ default: null })
  oldValue: string; // For tracking changes (e.g., old status)

  @Prop({ default: null })
  newValue: string; // For tracking changes (e.g., new status)

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Indexes for efficient querying
ActivitySchema.index({ timestamp: -1 }); // Most recent first
ActivitySchema.index({ ticketId: 1, timestamp: -1 });
ActivitySchema.index({ userId: 1, timestamp: -1 });
ActivitySchema.index({ targetUserId: 1, timestamp: -1 });
ActivitySchema.index({ type: 1, timestamp: -1 });

// Transform
ActivitySchema.set('toJSON', {
  transform: (doc, ret) => {
    (ret as any).id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});
