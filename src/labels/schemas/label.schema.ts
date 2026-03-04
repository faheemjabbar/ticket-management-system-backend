import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LabelDocument = Label & Document;

@Schema({ timestamps: true })
export class Label {
  @Prop({ required: true, trim: true, maxlength: 50 })
  name: string;

  @Prop({ required: true, match: /^#[0-9A-F]{6}$/i })
  color: string; // Hex color code

  @Prop({ maxlength: 200 })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ enum: ['general', 'priority', 'type', 'platform', 'team'], default: 'general' })
  category: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const LabelSchema = SchemaFactory.createForClass(Label);

// Indexes
LabelSchema.index({ projectId: 1 });
LabelSchema.index({ name: 1, projectId: 1 }, { unique: true }); // Unique name per project
LabelSchema.index({ category: 1 });

// Transform
LabelSchema.set('toJSON', {
  transform: (doc, ret) => {
    (ret as any).id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});
