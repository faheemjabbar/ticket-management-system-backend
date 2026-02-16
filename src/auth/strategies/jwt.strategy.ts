import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../../users/users.service';
import { Organization, OrganizationDocument } from '../../organizations/schemas/organization.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findByIdForAuth(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    
    // Check organization status for non-admin users
    if (user.organizationId && user.role !== 'admin') {
      const organization = await this.organizationModel.findById(user.organizationId).exec();
      
      if (!organization) {
        throw new UnauthorizedException('Organization not found');
      }
      
      if (!organization.isActive) {
        throw new ForbiddenException('Your organization has been deactivated. Please contact support.');
      }
    }
    
    return user;
  }
}
