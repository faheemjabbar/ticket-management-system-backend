import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Projects')
@Controller('api/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Roles('superadmin', 'admin', 'qa')
  @ApiOperation({ summary: 'Get all projects' })
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.projectsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.findById(id, user);
  }

  @Post()
  @Roles('superadmin', 'admin', 'qa')
  @ApiOperation({ summary: 'Create project' })
  async create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  @Put(':id')
  @Roles('superadmin', 'admin', 'qa')
  @ApiOperation({ summary: 'Update project' })
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Delete project' })
  async delete(@Param('id') id: string) {
    await this.projectsService.delete(id);
    return { message: 'Project deleted successfully' };
  }
}
