import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto | any, createdBy?: string): Promise<any> {
    try {
      const userData: any = { ...createUserDto };
      if (createdBy) {
        userData.createdBy = createdBy;
      }
      
      // Password will be hashed by pre-save hook
      const user = new this.userModel(userData);
      const savedUser = await user.save();
      
      // Populate organization name
      await savedUser.populate('organizationId', 'name');
      
      const userObj: any = savedUser.toJSON();
      // Transform organizationId to organization object
      if (userObj.organizationId && typeof userObj.organizationId === 'object') {
        userObj.organization = {
          id: userObj.organizationId.id || userObj.organizationId._id,
          name: userObj.organizationId.name,
        };
        delete userObj.organizationId;
      }
      
      return userObj;
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
    
    // Organization-based filtering
    if (user) {
      if (user.role === 'admin') {
        // Admin sees only users in their organization
        // Convert to ObjectId to match both string and ObjectId in database
        const orgId = user.organizationId;
        filter.$or = [
          { organizationId: orgId },
          { organizationId: orgId.toString() },
          { organizationId: new Types.ObjectId(orgId.toString()) }
        ];
      } else if (user.role === 'superadmin') {
        // Superadmin sees all users
      } else {
        // QA and Developer see users in their organization
        const orgId = user.organizationId;
        filter.$or = [
          { organizationId: orgId },
          { organizationId: orgId.toString() },
          { organizationId: new Types.ObjectId(orgId.toString()) }
        ];
      }
    }
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      const searchFilter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
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
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .populate('organizationId', 'name')
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users: users.map(u => {
        const userObj: any = u.toJSON();
        // Transform organizationId to organization object
        if (userObj.organizationId && typeof userObj.organizationId === 'object') {
          userObj.organization = {
            id: userObj.organizationId.id || userObj.organizationId._id,
            name: userObj.organizationId.name,
          };
          delete userObj.organizationId;
        }
        return userObj;
      }),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, user?: any): Promise<any> {
    const foundUser = await this.userModel
      .findById(id)
      .populate('organizationId', 'name')
      .exec();
      
    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    // Check access
    if (user && user.role !== 'superadmin') {
      const orgId = foundUser.organizationId?.toString() || (foundUser.organizationId as any)?._id?.toString();
      if (orgId !== user.organizationId && user.id !== id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const userObj: any = foundUser.toJSON();
    // Transform organizationId to organization object
    if (userObj.organizationId && typeof userObj.organizationId === 'object') {
      userObj.organization = {
        id: userObj.organizationId.id || userObj.organizationId._id,
        name: userObj.organizationId.name,
      };
      delete userObj.organizationId;
    }
    
    return userObj;
  }

  // Internal method for JWT validation - returns raw user data without transformation
  async findByIdForAuth(id: string): Promise<any> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      return null;
    }
    const userObj: any = user.toJSON();
    return userObj;
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
      .populate('organizationId', 'name')
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const userObj: any = user.toJSON();
    // Transform organizationId to organization object
    if (userObj.organizationId && typeof userObj.organizationId === 'object') {
      userObj.organization = {
        id: userObj.organizationId.id || userObj.organizationId._id,
        name: userObj.organizationId.name,
      };
      delete userObj.organizationId;
    }
    
    return userObj;
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
    
    // Populate and transform
    await user.populate('organizationId', 'name');
    const userObj: any = user.toJSON();
    
    if (userObj.organizationId && typeof userObj.organizationId === 'object') {
      userObj.organization = {
        id: userObj.organizationId.id || userObj.organizationId._id,
        name: userObj.organizationId.name,
      };
      delete userObj.organizationId;
    }
    
    return userObj;
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
        resetPasswordExpires: { $gt: new Date() },
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
