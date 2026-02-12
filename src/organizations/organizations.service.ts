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

  async create(createOrganizationDto: CreateOrganizationDto, superadminId: string): Promise<any> {
    const organization = new this.organizationModel({
      ...createOrganizationDto,
      createdBy: superadminId,
    });
    const saved = await organization.save();
    return saved.toJSON();
  }

  async createWithAdmin(
    createDto: CreateOrganizationWithAdminDto,
    superadminId: string,
  ): Promise<any> {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email: createDto.adminUser.email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Create organization
    const organization = new this.organizationModel({
      name: createDto.name,
      description: createDto.description,
      createdBy: superadminId,
    });

    let savedOrganization;
    let savedAdmin;

    try {
      // Save organization
      savedOrganization = await organization.save();

      // Create admin user (password will be hashed by pre-save hook)
      const adminUser = new this.userModel({
        name: createDto.adminUser.name,
        email: createDto.adminUser.email,
        password: createDto.adminUser.password,
        role: 'admin',
        organizationId: savedOrganization._id,
        createdBy: superadminId,
      });

      savedAdmin = await adminUser.save();

      return {
        organization: savedOrganization.toJSON(),
        admin: savedAdmin.toJSON(),
      };
    } catch (error) {
      // Rollback: Delete organization if admin creation fails
      if (savedOrganization) {
        await this.organizationModel.findByIdAndDelete(savedOrganization._id).exec();
      }
      throw error;
    }
  }

  async findAll(): Promise<any> {
    const organizations = await this.organizationModel.find().exec();
    return organizations.map(org => org.toJSON());
  }

  async findById(id: string): Promise<any> {
    const organization = await this.organizationModel.findById(id).exec();
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization.toJSON();
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<any> {
    const organization = await this.organizationModel
      .findByIdAndUpdate(id, updateOrganizationDto, { new: true })
      .exec();
    
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization.toJSON();
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
