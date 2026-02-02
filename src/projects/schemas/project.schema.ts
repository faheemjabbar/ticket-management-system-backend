import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

class TeamMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true, enum: ['superadmin', 'admin', 'qa', 'developer'] })
  role: string;

  @Prop({ type: Date, default: Date.now })
  assignedAt: Date;
}

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['active', 'completed', 'archived'], default: 'active' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [TeamMember], default: [] })
  teamMembers: TeamMember[];

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Indexes
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ 'teamMembers.userId': 1 });

// Transform
ProjectSchema.set('toJSON', {
  transform: (doc, ret) => {
    (ret as any).id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});