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

  async findAll(query: any = {}): Promise<any> {
    const { status, search, page = 1, limit = 20 } = query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
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

  async findById(id: string): Promise<any> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
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
