import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, enum: ['admin', 'developer', 'qa'], default: 'developer' })
  role: string;

  @Prop({ default: null })
  avatar: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ maxlength: 500 })
  bio: string;

  @Prop({ default: 'UTC' })
  timezone: string;

  @Prop({ default: 'en' })
  language: string;

  @Prop({ type: Date, default: null })
  lastLogin: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Transform _id to id and remove sensitive fields
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    (ret as any).id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    delete (ret as any).password;
    return ret;
  },
});
