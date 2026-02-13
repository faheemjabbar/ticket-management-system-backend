import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string, organizationId: string): Promise<any> {
    // Populate team members with user names
    const teamMembers: any[] = [];
    if (createProjectDto.teamMembers && createProjectDto.teamMembers.length > 0) {
      for (const member of createProjectDto.teamMembers) {
        const user = await this.userModel.findById(member.userId).exec();
        if (user) {
          teamMembers.push({
            userId: member.userId,
            userName: user.name,
            role: member.role,
            assignedAt: new Date(),
          });
        }
      }
    }

    const project = new this.projectModel({
      ...createProjectDto,
      organizationId,
      createdBy: userId,
      teamMembers,
    });
    const savedProject = await project.save();
    
    // Populate organization name
    await savedProject.populate('organizationId', 'name');
    
    const projectObj: any = savedProject.toJSON();
    // Transform organizationId to organization object
    if (projectObj.organizationId && typeof projectObj.organizationId === 'object') {
      projectObj.organization = {
        id: projectObj.organizationId.id || projectObj.organizationId._id,
        name: projectObj.organizationId.name,
      };
      delete projectObj.organizationId;
    }
    
    return projectObj;
  }

  async findAll(query: any = {}, user?: any): Promise<any> {
    const { status, search, page = 1, limit = 20 } = query;
    
    const filter: any = {};
    
    // Organization-based filtering
    if (user) {
      if (user.role === 'project-manager') {
        // Project Manager sees only projects in their organization
        const orgId = user.organizationId;
        filter.$or = [
          { organizationId: orgId },
          { organizationId: orgId.toString() },
          { organizationId: new Types.ObjectId(orgId.toString()) }
        ];
      } else {
        // QA and Developer see projects in their organization
        const orgId = user.organizationId;
        filter.$or = [
          { organizationId: orgId },
          { organizationId: orgId.toString() },
          { organizationId: new Types.ObjectId(orgId.toString()) }
        ];
      }
    }
    
    if (status) filter.status = status;
    if (search) {
      const searchFilter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ]
      };
      // Combine with existing $or if present
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          searchFilter
        ];
        delete filter.$or;
      } else {
        filter.$or = searchFilter.$or;
      }
    }

    const skip = (page - 1) * limit;
    const [projects, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .populate('organizationId', 'name')
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.projectModel.countDocuments(filter),
    ]);

    return {
      projects: projects.map(p => {
        const projectObj: any = p.toJSON();
        // Transform organizationId to organization object
        if (projectObj.organizationId && typeof projectObj.organizationId === 'object') {
          projectObj.organization = {
            id: projectObj.organizationId.id || projectObj.organizationId._id,
            name: projectObj.organizationId.name,
          };
          delete projectObj.organizationId;
        }
        return projectObj;
      }),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, user?: any): Promise<any> {
    const project = await this.projectModel
      .findById(id)
      .populate('organizationId', 'name')
      .exec();
      
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    
    // Check access
    if (user && user.role !== 'admin') {
      // Extract the actual ObjectId from populated field
      const projectOrgId = (project.organizationId as any)?._id || project.organizationId;
      const orgId = projectOrgId?.toString();
      const userOrgId = user.organizationId?.toString();
      
      if (orgId !== userOrgId) {
        throw new ForbiddenException('Access denied');
      }
    }
    
    const projectObj: any = project.toJSON();
    // Transform organizationId to organization object
    if (projectObj.organizationId && typeof projectObj.organizationId === 'object') {
      projectObj.organization = {
        id: projectObj.organizationId.id || projectObj.organizationId._id,
        name: projectObj.organizationId.name,
      };
      delete projectObj.organizationId;
    }
    
    return projectObj;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, user?: any): Promise<any> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check access
    if (user && user.role !== 'admin') {
      const orgId = project.organizationId?.toString();
      const userOrgId = user.organizationId?.toString();
      if (orgId !== userOrgId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Update team members if provided
    if (updateProjectDto.teamMembers) {
      const teamMembers: any[] = [];
      for (const member of updateProjectDto.teamMembers) {
        const foundUser = await this.userModel.findById(member.userId).exec();
        if (foundUser) {
          teamMembers.push({
            userId: member.userId,
            userName: foundUser.name,
            role: member.role,
            assignedAt: new Date(),
          });
        }
      }
      updateProjectDto.teamMembers = teamMembers as any;
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { new: true })
      .populate('organizationId', 'name')
      .exec();
    
    if (!updated) {
      throw new NotFoundException('Project not found');
    }
    
    const projectObj: any = updated.toJSON();
    // Transform organizationId to organization object
    if (projectObj.organizationId && typeof projectObj.organizationId === 'object') {
      projectObj.organization = {
        id: projectObj.organizationId.id || projectObj.organizationId._id,
        name: projectObj.organizationId.name,
      };
      delete projectObj.organizationId;
    }
    
    return projectObj;
  }

  async delete(id: string, user?: any): Promise<void> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check access
    if (user && user.role !== 'admin') {
      const orgId = project.organizationId?.toString();
      const userOrgId = user.organizationId?.toString();
      if (orgId !== userOrgId) {
        throw new ForbiddenException('Access denied');
      }
    }

    await this.projectModel.findByIdAndDelete(id).exec();
  }
}
