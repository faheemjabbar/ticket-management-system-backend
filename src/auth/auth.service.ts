import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async registerAdmin(registerAdminDto: RegisterAdminDto) {
    // Check if any admin already exists
    const existingAdmins = await this.usersService.findAll({ role: 'admin' }, null);
    
    if (existingAdmins.total > 0) {
      throw new BadRequestException('Admin user already exists. Only one admin is allowed.');
    }

    // Create admin user (password will be hashed by pre-save hook)
    const admin = await this.usersService.create({
      ...registerAdminDto,
      role: 'admin',
      // Admin doesn't need organizationId
    });

    const payload = { 
      userId: admin.id, 
      email: admin.email, 
      role: admin.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Get organization name if user has organizationId
    let organizationName = null;
    if (user.organizationId) {
      const userWithOrg = await this.usersService.findById(user.id);
      organizationName = userWithOrg.organization?.name || null;
    }

    const payload = { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      organizationId: user.organizationId 
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organizationId ? {
          id: user.organizationId,
          name: organizationName,
        } : null,
        isActive: user.isActive,
      },
    };
  }

  async getCurrentUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    
    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving to database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiry (1 hour from now)
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Save hashed token to user
    await this.usersService.setResetPasswordToken(email, hashedToken, expires);
    
    // Send email with unhashed token
    try {
      await this.mailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new BadRequestException('Failed to send password reset email');
    }
    
    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;
    
    // Hash the token to compare with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user by token and check if not expired
    const user = await this.usersService.findByResetToken(hashedToken);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token
    await this.usersService.resetPassword(user.id, hashedPassword);
    
    return {
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }
}
