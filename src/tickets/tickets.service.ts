import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Validates that a user can be assigned to a ticket in a project
   * Rules:
   * 1. User must be a member of the project team
   * 2. User must be in the same organization as the project
   * 3. User must have developer or qa role (not admin)
   */
  private async validateTicketAssignment(projectId: string, assignedToId: string): Promise<void> {
    // Get the project
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get the user
    const user = await this.userModel.findById(assignedToId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is in the same organization as the project
    const userOrgId = user.organizationId?.toString();
    const projectOrgId = project.organizationId?.toString();
    
    if (userOrgId !== projectOrgId) {
      throw new BadRequestException('Cannot assign ticket: User is not in the same organization as the project');
    }

    // Check if user has appropriate role (not project-manager)
    if (user.role === 'project-manager') {
      throw new BadRequestException('Cannot assign ticket: Project Manager users cannot be assigned to tickets');
    }

    // Check if user is a member of the project team
    const isTeamMember = project.teamMembers.some(
      member => member.userId.toString() === assignedToId
    );

    if (!isTeamMember) {
      throw new BadRequestException('Cannot assign ticket: User is not a member of this project team');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new BadRequestException('Cannot assign ticket: User account is inactive');
    }
  }

  async create(createTicketDto: CreateTicketDto, user: any, projectName: string): Promise<any> {
    // Validate assignment if assignedToId is provided
    let assignedToName: string | null = null;
    if (createTicketDto.assignedToId) {
      await this.validateTicketAssignment(createTicketDto.projectId, createTicketDto.assignedToId);
      
      // Get assignee name
      const assignee = await this.userModel.findById(createTicketDto.assignedToId).exec();
      if (assignee) {
        assignedToName = assignee.name;
      }
    }

    const ticket = new this.ticketModel({
      ...createTicketDto,
      assignedToName,
      authorId: user.id,
      authorName: user.name,
      projectName,
      status: createTicketDto.assignedToId ? 'assigned' : 'pending',
    });
    const savedTicket = await ticket.save();
    const ticketJson = savedTicket.toJSON() as any;

    return ticketJson;
  }

  async findAll(query: any = {}, user?: any): Promise<any> {
    const { status, priority, projectId, page = 1, limit = 20 } = query;
    
    const filter: any = {};
    
    // Role-based filtering: Project Managers only see tickets from their assigned projects
    if (user && user.role === 'project-manager') {
      // Get all project IDs where project manager is involved
      const pmProjects = await this.projectModel.find({
        $or: [
          { createdBy: user.id },
          { 'teamMembers.userId': user.id }
        ]
      }).select('_id').exec();
      
      const projectIds = pmProjects.map(p => p._id.toString());
      
      if (projectIds.length === 0) {
        // Project Manager has no projects, return empty
        return {
          tickets: [],
          total: 0,
          page: Number(page),
          limit: Number(limit),
          totalPages: 0,
        };
      }
      
      filter.projectId = { $in: projectIds };
    }
    // Admin, QA, Developer see all tickets (or implement their own logic)
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (projectId) {
      // If specific projectId is requested, use it (but still respect admin filter)
      if (filter.projectId) {
        // Check if requested projectId is in project manager's allowed projects
        if (filter.projectId.$in.includes(projectId)) {
          filter.projectId = projectId;
        } else {
          // Project Manager trying to access project they're not part of
          return {
            tickets: [],
            total: 0,
            page: Number(page),
            limit: Number(limit),
            totalPages: 0,
          };
        }
      } else {
        filter.projectId = projectId;
      }
    }

    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      this.ticketModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).exec(),
      this.ticketModel.countDocuments(filter),
    ]);

    return {
      tickets: tickets.map(t => t.toJSON()),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, user?: any): Promise<any> {
    const ticket = await this.ticketModel.findById(id).exec();
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    
    // Check if project manager has access to this ticket's project
    if (user && user.role === 'project-manager') {
      const project = await this.projectModel.findById(ticket.projectId).exec();
      if (project) {
        const hasAccess = 
          project.createdBy.toString() === user.id ||
          project.teamMembers.some(member => member.userId.toString() === user.id);
        
        if (!hasAccess) {
          throw new NotFoundException('Ticket not found');
        }
      } else {
        throw new NotFoundException('Ticket not found');
      }
    }
    
    return ticket.toJSON();
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<any> {
    const oldTicket = await this.ticketModel.findById(id).exec();
    if (!oldTicket) {
      throw new NotFoundException('Ticket not found');
    }

    // Validate assignment if assignedToId is being changed
    if (updateTicketDto.assignedToId && updateTicketDto.assignedToId !== oldTicket.assignedToId?.toString()) {
      await this.validateTicketAssignment(oldTicket.projectId.toString(), updateTicketDto.assignedToId);
    }

    const ticket = await this.ticketModel
      .findByIdAndUpdate(id, updateTicketDto, { new: true })
      .exec();
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket.toJSON();
  }

  async delete(id: string): Promise<void> {
    const result = await this.ticketModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Ticket not found');
    }
  }

  async assignTicket(id: string, assignedToId: string, assignedToName: string, assignedBy: any): Promise<any> {
    const ticket = await this.ticketModel.findById(id).exec();
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Validate assignment
    await this.validateTicketAssignment(ticket.projectId.toString(), assignedToId);

    const updatedTicket = await this.ticketModel
      .findByIdAndUpdate(
        id,
        { assignedToId, assignedToName, status: 'assigned' },
        { new: true }
      )
      .exec();
    
    if (!updatedTicket) {
      throw new NotFoundException('Ticket not found');
    }

    return updatedTicket.toJSON();
  }

  async updateStatus(id: string, status: string, user: any): Promise<any> {
    const ticket = await this.ticketModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket.toJSON();
  }
}
