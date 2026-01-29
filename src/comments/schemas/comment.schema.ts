import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

class Attachment {
  @Prop()
  id: string;

  @Prop()
  name: string;

  @Prop()
  size: number;

  @Prop()
  type: string;

  @Prop()
  url: string;
}

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Ticket', required: true })
  ticketId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  authorName: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [Attachment], default: [] })
  attachments: Attachment[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Indexes
CommentSchema.index({ ticketId: 1 });
CommentSchema.index({ createdAt: -1 });

// Transform
CommentSchema.set('toJSON', {
  transform: (doc, ret) => {
    (ret as any).id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});