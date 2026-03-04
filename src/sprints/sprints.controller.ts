import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Sprints')
@Controller('api/sprints')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sprints' })
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.sprintsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sprint by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sprintsService.findById(id, user);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get sprint statistics' })
  async getStats(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sprintsService.getSprintStats(id, user);
  }

  @Post()
  @Roles('project-manager')
  @ApiOperation({ summary: 'Create sprint' })
  async create(@Body() createSprintDto: CreateSprintDto, @CurrentUser() user: any) {
    return this.sprintsService.create(createSprintDto, user);
  }

  @Put(':id')
  @Roles('project-manager')
  @ApiOperation({ summary: 'Update sprint' })
  async update(@Param('id') id: string, @Body() updateSprintDto: UpdateSprintDto, @CurrentUser() user: any) {
    return this.sprintsService.update(id, updateSprintDto, user);
  }

  @Delete(':id')
  @Roles('project-manager')
  @ApiOperation({ summary: 'Delete sprint' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.sprintsService.delete(id, user);
    return { message: 'Sprint deleted successfully' };
  }
}
