import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get all users' })
  async findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // Superadmin, Admin or self can view
    if (user.role !== 'superadmin' && user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Create user' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    // Superadmin, Admin or self can update
    if (user.role !== 'superadmin' && user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You do not have permission to update this resource');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Delete user' })
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }

  @Patch(':id/toggle-status')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Toggle user status' })
  async toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }

  @Put(':id/notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updateNotificationPreferences(
    @Param('id') id: string,
    @Body() preferences: NotificationPreferencesDto,
    @CurrentUser() user: any,
  ) {
    // Superadmin, Admin or self can update
    if (user.role !== 'superadmin' && user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You do not have permission to update notification preferences');
    }
    return this.usersService.updateNotificationPreferences(id, preferences);
  }

  @Get(':id/notification-preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getNotificationPreferences(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // Superadmin, Admin or self can view
    if (user.role !== 'superadmin' && user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You do not have permission to access notification preferences');
    }
    return this.usersService.getNotificationPreferences(id);
  }
}
