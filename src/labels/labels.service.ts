import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Label, LabelDocument } from './schemas/label.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(
    @InjectModel(Label.name) private labelModel: Model<LabelDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createLabelDto: CreateLabelDto, user: any): Promise<any> {
    // Verify project exists and user has access
    const project = await this.projectModel.findById(createLabelDto.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check organization access
    if (user.role !== 'admin') {
      const projectOrgId = project.organizationId?.toString();
      const userOrgId = user.organizationId?.toString();
      
      if (projectOrgId !== userOrgId) {
        throw new ForbiddenException('Access denied: Project belongs to a different organization');
      }
    }

    // Check if label name already exists in project
    const existing = await this.labelModel.findOne({
      projectId: createLabelDto.projectId,
      name: createLabelDto.name,
    }).exec();

    if (existing) {
      throw new BadRequestException(`Label "${createLabelDto.name}" already exists in this project`);
    }

    const label = new this.labelModel({
      ...createLabelDto,
      createdBy: user.id,
    });

    const savedLabel = await label.save();
    return savedLabel.toJSON();
  }

  async findAll(query: any = {}, user?: any): Promise<any> {
    const { projectId, category, page = 1, limit = 100 } = query;
    
    const filter: any = {};
    
    // Organization-based filtering for non-admin users
    if (user && user.role !== 'admin') {
      const userOrgId = user.organizationId;
      const orgProjects = await this.projectModel.find({
        $or: [
          { organizationId: userOrgId },
          { organizationId: userOrgId.toString() },
          { organizationId: new Types.ObjectId(userOrgId.toString()) }
        ]
      }).select('_id').exec();
      
      const projectIds = orgProjects.map(p => p._id.toString());
      
      if (projectIds.length === 0) {
        return {
          labels: [],
          total: 0,
          page: Number(page),
          limit: Number(limit),
          totalPages: 0,
        };
      }
      
      filter.projectId = { $in: projectIds };
    }
    
    if (projectId) {
      filter.projectId = projectId;
    }
    
    if (category) {
      filter.category = category;
    }

    const skip = (page - 1) * limit;
    const [labels, total] = await Promise.all([
      this.labelModel
        .find(filter)
        .populate('projectId', 'name')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.labelModel.countDocuments(filter),
    ]);

    return {
      labels: labels.map(l => l.toJSON()),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, user?: any): Promise<any> {
    const label = await this.labelModel
      .findById(id)
      .populate('projectId', 'name')
      .exec();
      
    if (!label) {
      throw new NotFoundException('Label not found');
    }
    
    // Check access
    if (user && user.role !== 'admin') {
      const project = await this.projectModel.findById(label.projectId).exec();
      if (!project) {
        throw new NotFoundException('Label not found');
      }
      
      const projectOrgId = project.organizationId?.toString();
      const userOrgId = user.organizationId?.toString();
      
      if (projectOrgId !== userOrgId) {
        throw new ForbiddenException('Access denied');
      }
    }
    
    return label.toJSON();
  }

  async update(id: string, updateLabelDto: UpdateLabelDto, user?: any): Promise<any> {
    const label = await this.labelModel.findById(id).exec();
    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Check access
    if (user && user.role !== 'admin') {
      const project = await this.projectModel.findById(label.projectId).exec();
      if (!project) {
        throw new NotFoundException('Label not found');
      }
      
      const projectOrgId = project.organizationId?.toString();
      const userOrgId = user.organizationId?.toString();
      
      if (projectOrgId !== userOrgId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Check name uniqueness if name is being updated
    if (updateLabelDto.name && updateLabelDto.name !== label.name) {
      const existing = await this.labelModel.findOne({
        projectId: label.projectId,
        name: updateLabelDto.name,
        _id: { $ne: id },
      }).exec();

      if (existing) {
        throw new BadRequestException(`Label "${updateLabelDto.name}" already exists in this project`);
      }
    }

    const updated = await this.labelModel
      .findByIdAndUpdate(id, updateLabelDto, { new: true })
      .populate('projectId', 'name')
      .exec();
    
    if (!updated) {
      throw new NotFoundException('Label not found');
    }
    
    return updated.toJSON();
  }

  async delete(id: string, user?: any): Promise<void> {
    const label = await this.labelModel.findById(id).exec();
    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Check access
    if (user && user.role !== 'admin') {
      const project = await this.projectModel.findById(label.projectId).exec();
      if (!project) {
        throw new NotFoundException('Label not found');
      }
      
      const projectOrgId = project.organizationId?.toString();
      const userOrgId = user.organizationId?.toString();
      
      if (projectOrgId !== userOrgId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Check if label is used by any tickets
    const ticketModel = this.labelModel.db.model('Ticket');
    const ticketsUsingLabel = await ticketModel.countDocuments({
      labels: id,
    }).exec();

    if (ticketsUsingLabel > 0) {
      throw new BadRequestException(
        `Cannot delete label: It is used by ${ticketsUsingLabel} ticket(s). Remove it from tickets first.`
      );
    }

    await this.labelModel.findByIdAndDelete(id).exec();
  }
}
