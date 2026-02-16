import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateOrganizationWithAdminDto } from './dto/create-organization-with-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Organizations')
@Controller('api/organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all organizations (Admin only)' })
  async findAll(@CurrentUser() user: any) {
    return this.organizationsService.findAll(user.id);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get organization by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.organizationsService.findById(id, user.id);
  }

  @Get(':id/stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get organization statistics' })
  async getStats(@Param('id') id: string) {
    return this.organizationsService.getStats(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create organization (Admin only)' })
  async create(@Body() createOrganizationDto: CreateOrganizationDto, @CurrentUser() user: any) {
    return this.organizationsService.create(createOrganizationDto, user.id);
  }

  @Post('with-admin')
  @Roles('admin')
  @ApiOperation({ summary: 'Create organization with project manager user (Admin only)' })
  async createWithAdmin(
    @Body() createDto: CreateOrganizationWithAdminDto,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.createWithAdmin(createDto, user.id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update organization (Admin only)' })
  async update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto, @CurrentUser() user: any) {
    return this.organizationsService.update(id, updateOrganizationDto, user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete organization (Admin only)' })
  async delete(@Param('id') id: string) {
    await this.organizationsService.delete(id);
    return { message: 'Organization deleted successfully' };
  }
}

