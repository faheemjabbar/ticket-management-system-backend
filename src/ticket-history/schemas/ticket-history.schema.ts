import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketHistoryDocument = TicketHistory & Document;

@Schema()
export class TicketHistory {
  @Prop({ type: Types.ObjectId, ref: 'Ticket', required: true })
  ticketId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  action: string;

  @Prop({ default: null })
  details: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const TicketHistorySchema = SchemaFactory.createForClass(TicketHistory);

// Indexes
TicketHistorySchema.index({ ticketId: 1 });
TicketHistorySchema.index({ timestamp: -1 });

// Transform
TicketHistorySchema.set('toJSON', {
  transform: (doc, ret) => {
    (ret as any).id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});