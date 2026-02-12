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
  @Roles('superadmin')
  @ApiOperation({ summary: 'Get all organizations (Superadmin only)' })
  async findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get organization by ID' })
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findById(id);
  }

  @Get(':id/stats')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get organization statistics' })
  async getStats(@Param('id') id: string) {
    return this.organizationsService.getStats(id);
  }

  @Post()
  @Roles('superadmin')
  @ApiOperation({ summary: 'Create organization (Superadmin only)' })
  async create(@Body() createOrganizationDto: CreateOrganizationDto, @CurrentUser() user: any) {
    return this.organizationsService.create(createOrganizationDto, user.id);
  }

  @Post('with-admin')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Create organization with admin user (Superadmin only)' })
  async createWithAdmin(
    @Body() createDto: CreateOrganizationWithAdminDto,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.createWithAdmin(createDto, user.id);
  }

  @Put(':id')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Update organization (Superadmin only)' })
  async update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Delete organization (Superadmin only)' })
  async delete(@Param('id') id: string) {
    await this.organizationsService.delete(id);
    return { message: 'Organization deleted successfully' };
  }
}

