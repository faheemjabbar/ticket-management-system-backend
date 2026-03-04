import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SprintDocument = Sprint & Document;

@Schema({ timestamps: true })
export class Sprint {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ maxlength: 1000 })
  goal: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({ required: true, enum: ['planning', 'active', 'completed'], default: 'planning' })
  status: string;

  @Prop({ min: 0, default: 0 })
  capacity: number; // Story points capacity

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const SprintSchema = SchemaFactory.createForClass(Sprint);

// Indexes
SprintSchema.index({ projectId: 1 });
SprintSchema.index({ status: 1 });
SprintSchema.index({ startDate: 1 });
SprintSchema.index({ endDate: 1 });

// Transform
SprintSchema.set('toJSON', {
  transform: (doc, ret) => {
    (ret as any).id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});
