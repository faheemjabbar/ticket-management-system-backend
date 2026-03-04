import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sprint, SprintDocument } from './schemas/sprint.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Ticket, TicketDocument } from '../tickets/schemas/ticket.schema';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

@Injectable()
export class SprintsService {
  constructor(
    @InjectModel(Sprint.name) private sprintModel: Model<SprintDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
  ) {}

  async create(createSprintDto: CreateSprintDto, user: any): Promise<any> {
    // Verify project exists and user has access
    const project = await this.projectModel.findById(createSprintDto.projectId).exec();
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

    // Validate dates
    const startDate = new Date(createSprintDto.startDate);
    const endDate = new Date(createSprintDto.endDate);
    
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for overlapping sprints in the same project
    const overlapping = await this.sprintModel.findOne({
      projectId: createSprintDto.projectId,
      status: { $in: ['planning', 'active'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    }).exec();

    if (overlapping) {
      throw new BadRequestException(`Sprint overlaps with existing sprint: ${overlapping.name}`);
    }

    const sprint = new this.sprintModel({
      ...createSprintDto,
      createdBy: user.id,
    });

    const savedSprint = await sprint.save();
    return savedSprint.toJSON();
  }

  async findAll(query: any = {}, user?: any): Promise<any> {
    const { projectId, status, page = 1, limit = 20 } = query;
    
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
          sprints: [],
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
    
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const [sprints, total] = await Promise.all([
      this.sprintModel
        .find(filter)
        .populate('projectId', 'name')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.sprintModel.countDocuments(filter),
    ]);

    return {
      sprints: sprints.map(s => s.toJSON()),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, user?: any): Promise<any> {
    const sprint = await this.sprintModel
      .findById(id)
      .populate('projectId', 'name')
      .exec();
      
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }
    
    // Check access
    if (user && user.role !== 'admin') {
      const project = await this.projectModel.findById(sprint.projectId).exec();
      if (!project) {
        throw new NotFoundException('Sprint not found');
      }
      
      const projectOrgId = project.organizationId?.toString();
      const userOrgId = user.organizationId?.toString();
      
      if (projectOrgId !== userOrgId) {
        throw new ForbiddenException('Access denied');
      }
    }
    
    return sprint.toJSON();
  }

  async update(id: string, updateSprintDto: UpdateSprintDto, user?: any): Promise<any> {
    const sprint = await this.sprintModel.findById(id).exec();
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    // Check access
    if (user && user.role !== 'admin') {
      const project = await this.projectModel.findById(sprint.projectId).exec();
      if (!project) {
        throw new NotFoundException('Sprint not found');
      }
      
      const projectOrgId = project.organizationId?.toString();
      const userOrgId = user.organizationId?.toString();
      
      if (projectOrgId !== userOrgId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Validate dates if provided
    if (updateSprintDto.startDate || updateSprintDto.endDate) {
      const startDate = updateSprintDto.startDate ? new Date(updateSprintDto.startDate) : sprint.startDate;
      const endDate = updateSprintDto.endDate ? new Date(updateSprintDto.endDate) : sprint.endDate;
      
      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    const updated = await this.sprintModel
      .findByIdAndUpdate(id, updateSprintDto, { new: true })
      .populate('projectId', 'name')
      .exec();
    
    if (!updated) {
      throw new NotFoundException('Sprint not found');
    }
    
    return updated.toJSON();
  }

  async delete(id: string, user?: any): Promise<void> {
    const sprint = await this.sprintModel.findById(id).exec();
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    // Check access
    if (user && user.role !== 'admin') {
      const project = await this.projectModel.findById(sprint.projectId).exec();
      if (!project) {
        throw new NotFoundException('Sprint not found');
      }
      
      const projectOrgId = project.organizationId?.toString();
      const userOrgId = user.organizationId?.toString();
      
      if (projectOrgId !== userOrgId) {
        throw new ForbiddenException('Access denied');
      }
    }

    await this.sprintModel.findByIdAndDelete(id).exec();
  }

  async getSprintStats(id: string, user?: any): Promise<any> {
    const sprint = await this.findById(id, user);
    
    // Get tickets in this sprint
    const tickets = await this.ticketModel.find({ sprintId: id }).exec();
    
    const stats = {
      totalTickets: tickets.length,
      completedTickets: tickets.filter((t: any) => ['done', 'closed'].includes(t.status)).length,
      inProgressTickets: tickets.filter((t: any) => ['in_progress', 'in_review', 'qa_testing'].includes(t.status)).length,
      todoTickets: tickets.filter((t: any) => ['backlog', 'todo'].includes(t.status)).length,
      blockedTickets: tickets.filter((t: any) => t.status === 'blocked').length,
      totalStoryPoints: tickets.reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0),
      completedStoryPoints: tickets
        .filter((t: any) => ['done', 'closed'].includes(t.status))
        .reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0),
      capacity: sprint.capacity || 0,
    };
    
    return {
      sprint,
      stats,
      progress: stats.totalStoryPoints > 0 
        ? Math.round((stats.completedStoryPoints / stats.totalStoryPoints) * 100)
        : 0,
    };
  }
}
