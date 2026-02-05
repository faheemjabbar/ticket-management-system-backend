import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<any> {
    const project = new this.projectModel({
      ...createProjectDto,
      createdBy: userId,
    });
    const savedProject = await project.save();
    return savedProject.toJSON();
  }

  async findAll(query: any = {}, user?: any): Promise<any> {
    const { status, search, page = 1, limit = 20 } = query;
    
    const filter: any = {};
    
    // Role-based filtering: Admins only see their assigned projects
    if (user && user.role === 'admin') {
      filter.$or = [
        { createdBy: user.id },
        { 'teamMembers.userId': user.id }
      ];
    }
    // Superadmin, QA, and Developer see all projects (or implement their own logic)
    
    if (status) filter.status = status;
    if (search) {
      const searchFilter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ]
      };
      
      // Combine with existing filter
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          searchFilter
        ];
        delete filter.$or;
      } else {
        Object.assign(filter, searchFilter);
      }
    }

    const skip = (page - 1) * limit;
    const [projects, total] = await Promise.all([
      this.projectModel.find(filter).skip(skip).limit(Number(limit)).exec(),
      this.projectModel.countDocuments(filter),
    ]);

    return {
      projects: projects.map(p => p.toJSON()),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, user?: any): Promise<any> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    
    // Check if admin has access to this project
    if (user && user.role === 'admin') {
      const hasAccess = 
        project.createdBy.toString() === user.id ||
        project.teamMembers.some(member => member.userId.toString() === user.id);
      
      if (!hasAccess) {
        throw new NotFoundException('Project not found');
      }
    }
    
    return project.toJSON();
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<any> {
    const project = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { new: true })
      .exec();
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project.toJSON();
  }

  async delete(id: string): Promise<void> {
    const result = await this.projectModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Project not found');
    }
  }
}
