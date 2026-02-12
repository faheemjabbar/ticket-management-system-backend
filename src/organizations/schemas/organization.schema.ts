import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ createdBy: 1 });

OrganizationSchema.set('toJSON', {
  transform: (doc, ret) => {
    (ret as any).id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});
