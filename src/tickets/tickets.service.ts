import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { TicketStatus, isValidStatusTransition } from './enums/ticket-status.enum';

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
   * 1. User must be in the same organization as the project (REQUIRED)
   * 2. User must be active (REQUIRED)
   * 3. Team membership is recommended but not enforced (WARNING only)
   * 4. All roles can be assigned (including project-manager)
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

    // Check if user is in the same organization as the project (REQUIRED)
    const userOrgId = user.organizationId?.toString();
    const projectOrgId = project.organizationId?.toString();
    
    if (userOrgId !== projectOrgId) {
      throw new BadRequestException('Cannot assign ticket: User is not in the same organization as the project');
    }

    // Check if user is active (REQUIRED)
    if (!user.isActive) {
      throw new BadRequestException('Cannot assign ticket: User account is inactive');
    }

    // Check if user is a member of the project team (WARNING only - not enforced)
    const isTeamMember = project.teamMembers.some(
      member => member.userId.toString() === assignedToId
    );

    if (!isTeamMember) {
      console.warn(`Warning: User ${user.name} (${assignedToId}) is not a team member of project ${project.name} but assignment is allowed`);
    }
  }

  /**
   * Validates status transition
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    if (currentStatus === newStatus) {
      return; // No change
    }

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`
      );
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

    // Status and assignment are independent
    // Default status is 'backlog' if not provided
    const ticket = new this.ticketModel({
      ...createTicketDto,
      assignedToName,
      authorId: user.id,
      authorName: user.name,
      projectName,
      status: createTicketDto.status || TicketStatus.BACKLOG,
      type: createTicketDto.type || 'task',
      priorityScore: createTicketDto.priorityScore || 1000,
    });
    const savedTicket = await ticket.save();
    const ticketJson = savedTicket.toJSON() as any;

    return ticketJson;
  }

  async findAll(query: any = {}, user?: any): Promise<any> {
    const { status, priority, projectId, page = 1, limit = 20 } = query;
    
    const filter: any = {};
    
    // Organization-based filtering for all non-admin users
    if (user && user.role !== 'admin') {
      // Get all projects in user's organization
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
        // User's organization has no projects, return empty
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
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (projectId) {
      // If specific projectId is requested, use it (but still respect organization filter)
      if (filter.projectId) {
        // Check if requested projectId is in user's allowed projects
        if (filter.projectId.$in.includes(projectId)) {
          filter.projectId = projectId;
        } else {
          // User trying to access project they don't have access to
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
    
    // Check if user has access to this ticket's project (organization-based)
    if (user && user.role !== 'admin') {
      const project = await this.projectModel.findById(ticket.projectId).exec();
      if (!project) {
        throw new NotFoundException('Ticket not found');
      }
      
      // Check if project belongs to user's organization
      const projectOrgId = project.organizationId?.toString();
      const userOrgId = user.organizationId?.toString();
      
      if (projectOrgId !== userOrgId) {
        throw new ForbiddenException('Access denied: Ticket belongs to a different organization');
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

    // Assignment does NOT automatically change status
    // Status and assignment are independent
    const updatedTicket = await this.ticketModel
      .findByIdAndUpdate(
        id,
        { assignedToId, assignedToName },
        { new: true }
      )
      .exec();
    
    if (!updatedTicket) {
      throw new NotFoundException('Ticket not found');
    }

    return updatedTicket.toJSON();
  }

  async updateStatus(id: string, status: string, user: any): Promise<any> {
    const ticket = await this.ticketModel.findById(id).exec();
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Validate status transition
    this.validateStatusTransition(ticket.status, status);

    // Check if ticket is blocked by other tickets
    if (status === 'done' || status === 'closed') {
      const blockingTickets = await this.ticketModel.find({
        'relatedTickets.ticketId': id,
        'relatedTickets.relationType': 'blocks',
        status: { $nin: ['done', 'closed', 'rejected'] }
      }).exec();

      if (blockingTickets.length > 0) {
        const blockingTitles = blockingTickets.map(t => t.title).join(', ');
        throw new BadRequestException(
          `Cannot close ticket: Blocked by ${blockingTickets.length} ticket(s): ${blockingTitles}`
        );
      }
    }

    const updatedTicket = await this.ticketModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    
    if (!updatedTicket) {
      throw new NotFoundException('Ticket not found');
    }

    return updatedTicket.toJSON();
  }

  async linkTickets(ticketId: string, targetTicketId: string, relationType: string, user: any): Promise<any> {
    // Validate both tickets exist
    const [ticket, targetTicket] = await Promise.all([
      this.ticketModel.findById(ticketId).exec(),
      this.ticketModel.findById(targetTicketId).exec(),
    ]);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    if (!targetTicket) {
      throw new NotFoundException('Target ticket not found');
    }

    // Check if link already exists
    const existingLink = ticket.relatedTickets?.find(
      (rel: any) => rel.ticketId.toString() === targetTicketId && rel.relationType === relationType
    );

    if (existingLink) {
      throw new BadRequestException('Tickets are already linked with this relationship');
    }

    // Add relationship
    const updatedTicket = await this.ticketModel.findByIdAndUpdate(
      ticketId,
      {
        $push: {
          relatedTickets: {
            ticketId: targetTicketId,
            relationType,
          },
        },
      },
      { new: true }
    ).exec();

    // Add reciprocal relationship for certain types
    const reciprocalTypes: Record<string, string> = {
      'blocks': 'blocked_by',
      'blocked_by': 'blocks',
      'duplicates': 'duplicate_of',
      'duplicate_of': 'duplicates',
    };

    if (reciprocalTypes[relationType]) {
      await this.ticketModel.findByIdAndUpdate(
        targetTicketId,
        {
          $push: {
            relatedTickets: {
              ticketId: ticketId,
              relationType: reciprocalTypes[relationType],
            },
          },
        }
      ).exec();
    }

    return updatedTicket?.toJSON();
  }

  async unlinkTickets(ticketId: string, targetTicketId: string, relationType: string, user: any): Promise<any> {
    const ticket = await this.ticketModel.findById(ticketId).exec();
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Remove relationship
    const updatedTicket = await this.ticketModel.findByIdAndUpdate(
      ticketId,
      {
        $pull: {
          relatedTickets: {
            ticketId: targetTicketId,
            relationType,
          },
        },
      },
      { new: true }
    ).exec();

    // Remove reciprocal relationship
    const reciprocalTypes: Record<string, string> = {
      'blocks': 'blocked_by',
      'blocked_by': 'blocks',
      'duplicates': 'duplicate_of',
      'duplicate_of': 'duplicates',
    };

    if (reciprocalTypes[relationType]) {
      await this.ticketModel.findByIdAndUpdate(
        targetTicketId,
        {
          $pull: {
            relatedTickets: {
              ticketId: ticketId,
              relationType: reciprocalTypes[relationType],
            },
          },
        }
      ).exec();
    }

    return updatedTicket?.toJSON();
  }

  async getRelatedTickets(ticketId: string, user: any): Promise<any> {
    const ticket = await this.ticketModel
      .findById(ticketId)
      .populate('relatedTickets.ticketId', 'title status type priority')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Get child tickets (where this ticket is parent)
    const children = await this.ticketModel
      .find({ parentId: ticketId })
      .select('id title status type priority')
      .exec();

    return {
      related: ticket.relatedTickets || [],
      children: children.map(c => c.toJSON()),
      parent: ticket.parentId ? await this.ticketModel.findById(ticket.parentId).select('id title status type priority').exec() : null,
    };
  }

  async addWatcher(ticketId: string, userId: string, user: any): Promise<any> {
    const ticket = await this.ticketModel.findById(ticketId).exec();
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Verify user exists
    const watcherUser = await this.userModel.findById(userId).exec();
    if (!watcherUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already watching
    const isWatching = ticket.watchers?.some((w: any) => w.toString() === userId);
    if (isWatching) {
      throw new BadRequestException('User is already watching this ticket');
    }

    const updatedTicket = await this.ticketModel
      .findByIdAndUpdate(
        ticketId,
        { $addToSet: { watchers: userId } },
        { new: true }
      )
      .populate('watchers', 'name email')
      .exec();

    return updatedTicket?.toJSON();
  }

  async removeWatcher(ticketId: string, userId: string, user: any): Promise<any> {
    const ticket = await this.ticketModel.findById(ticketId).exec();
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updatedTicket = await this.ticketModel
      .findByIdAndUpdate(
        ticketId,
        { $pull: { watchers: userId } },
        { new: true }
      )
      .populate('watchers', 'name email')
      .exec();

    return updatedTicket?.toJSON();
  }

  async getWatchers(ticketId: string, user: any): Promise<any> {
    const ticket = await this.ticketModel
      .findById(ticketId)
      .populate('watchers', 'name email avatar')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return {
      watchers: ticket.watchers || [],
      count: ticket.watchers?.length || 0,
    };
  }
}
