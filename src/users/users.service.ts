import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createUserDto: CreateUserDto | any): Promise<any> {
    try {
      const user = new this.userModel(createUserDto);
      const savedUser = await user.save();
      return savedUser.toJSON();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findAll(query: any = {}, user?: any): Promise<any> {
    const { role, isActive, search, page = 1, limit = 20 } = query;
    
    const filter: any = {};
    
    // Role-based filtering: Admins and QAs only see users from their assigned projects
    if (user && (user.role === 'admin' || user.role === 'qa')) {
      // Find all projects where the user is involved (created by them or they're a team member)
      const projects = await this.projectModel.find({
        $or: [
          { createdBy: user.id },
          { 'teamMembers.userId': user.id }
        ]
      }).exec();
      
      // Extract all unique user IDs from team members
      const teamMemberIds = new Set<string>();
      projects.forEach(project => {
        // Add the project creator
        teamMemberIds.add(project.createdBy.toString());
        // Add all team members
        project.teamMembers.forEach(member => {
          teamMemberIds.add(member.userId.toString());
        });
      });
      
      // Filter users to only include team members
      filter._id = { $in: Array.from(teamMemberIds) };
    }
    // Superadmin and Developer see all users
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      const searchFilter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]
      };
      
      // Combine with existing filter if needed
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
    const [users, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(Number(limit)).exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users: users.map(u => u.toJSON()),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<any> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.toJSON();
  }

  async findByEmail(email: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).select('+password').exec();
    if (!user) {
      return null;
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.toJSON();
  }

  async delete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async toggleStatus(id: string): Promise<any> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    user.isActive = !user.isActive;
    await user.save();
    return user.toJSON();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLogin: new Date() }).exec();
  }

  async updateNotificationPreferences(id: string, preferences: any): Promise<any> {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { notificationPreferences: preferences },
        { new: true }
      )
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.toJSON();
  }

  async getNotificationPreferences(id: string): Promise<any> {
    const user = await this.userModel.findById(id).select('notificationPreferences').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.notificationPreferences;
  }

  async setResetPasswordToken(email: string, token: string, expires: Date): Promise<void> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();
  }

  async findByResetToken(token: string): Promise<any> {
    const user = await this.userModel
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }, // Token not expired
      })
      .select('+password')
      .exec();
    
    return user;
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .exec();
  }
}
