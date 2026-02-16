import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from './schemas/organization.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateOrganizationWithAdminDto } from './dto/create-organization-with-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto, adminId: string): Promise<any> {
    const organization = new this.organizationModel({
      ...createOrganizationDto,
      createdBy: adminId,
    });
    const saved = await organization.save();
    return saved.toJSON();
  }

  async createWithAdmin(
    createDto: CreateOrganizationWithAdminDto,
    adminId: string,
  ): Promise<any> {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email: createDto.projectManager.email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Create organization
    const organization = new this.organizationModel({
      name: createDto.name,
      description: createDto.description,
      createdBy: adminId,
    });

    let savedOrganization;
    let savedPM;

    try {
      // Save organization
      savedOrganization = await organization.save();

      // Create project manager user (password will be hashed by pre-save hook)
      const pmUser = new this.userModel({
        name: createDto.projectManager.name,
        email: createDto.projectManager.email,
        password: createDto.projectManager.password,
        role: 'project-manager',
        organizationId: savedOrganization._id,
        createdBy: adminId,
      });

      savedPM = await pmUser.save();

      return {
        organization: savedOrganization.toJSON(),
        projectManager: savedPM.toJSON(),
      };
    } catch (error) {
      // Rollback: Delete organization if project manager creation fails
      if (savedOrganization) {
        await this.organizationModel.findByIdAndDelete(savedOrganization._id).exec();
      }
      throw error;
    }
  }

  async findAll(adminId?: string): Promise<any> {
    const filter: any = {};
    if (adminId) {
      filter.createdBy = adminId;
    }
    
    const organizations = await this.organizationModel.find(filter).exec();
    
    // Get project managers for each organization
    const orgsWithPMs = await Promise.all(
      organizations.map(async (org) => {
        const projectManagers = await this.userModel
          .find({ 
            organizationId: org._id, 
            role: 'project-manager' 
          })
          .select('name email isActive lastLogin')
          .exec();
        
        return {
          ...org.toJSON(),
          projectManagers: projectManagers.map(pm => pm.toJSON()),
        };
      })
    );
    
    return orgsWithPMs;
  }

  async findById(id: string, adminId?: string): Promise<any> {
    const filter: any = { _id: id };
    if (adminId) {
      filter.createdBy = adminId;
    }
    
    const organization = await this.organizationModel.findOne(filter).exec();
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    
    // Get project managers for this organization
    const projectManagers = await this.userModel
      .find({ 
        organizationId: organization._id, 
        role: 'project-manager' 
      })
      .select('name email isActive lastLogin')
      .exec();
    
    return {
      ...organization.toJSON(),
      projectManagers: projectManagers.map(pm => pm.toJSON()),
    };
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto, adminId?: string): Promise<any> {
    const filter: any = { _id: id };
    if (adminId) {
      filter.createdBy = adminId;
    }
    
    const organization = await this.organizationModel
      .findOneAndUpdate(filter, updateOrganizationDto, { new: true })
      .exec();
    
    if (!organization) {
      throw new NotFoundException('Organization not found or you do not have permission to update it');
    }
    
    // Get project managers for this organization
    const projectManagers = await this.userModel
      .find({ 
        organizationId: organization._id, 
        role: 'project-manager' 
      })
      .select('name email isActive lastLogin')
      .exec();
    
    return {
      ...organization.toJSON(),
      projectManagers: projectManagers.map(pm => pm.toJSON()),
    };
  }

  async delete(id: string): Promise<void> {
    // Check if organization has users
    const userCount = await this.userModel.countDocuments({ organizationId: id }).exec();
    if (userCount > 0) {
      throw new BadRequestException(
        `Cannot delete organization with ${userCount} user(s). Please delete or reassign users first.`,
      );
    }

    const result = await this.organizationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Organization not found');
    }
  }

  async getStats(id: string): Promise<any> {
    const [userCount, projectCount] = await Promise.all([
      this.userModel.countDocuments({ organizationId: id }).exec(),
      // Add project count when needed
      Promise.resolve(0),
    ]);

    return {
      users: userCount,
      projects: projectCount,
    };
  }
}
