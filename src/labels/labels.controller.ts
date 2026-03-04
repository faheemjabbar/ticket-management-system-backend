import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Labels')
@Controller('api/labels')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all labels' })
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.labelsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get label by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.labelsService.findById(id, user);
  }

  @Post()
  @Roles('project-manager')
  @ApiOperation({ summary: 'Create label' })
  async create(@Body() createLabelDto: CreateLabelDto, @CurrentUser() user: any) {
    return this.labelsService.create(createLabelDto, user);
  }

  @Put(':id')
  @Roles('project-manager')
  @ApiOperation({ summary: 'Update label' })
  async update(@Param('id') id: string, @Body() updateLabelDto: UpdateLabelDto, @CurrentUser() user: any) {
    return this.labelsService.update(id, updateLabelDto, user);
  }

  @Delete(':id')
  @Roles('project-manager')
  @ApiOperation({ summary: 'Delete label' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.labelsService.delete(id, user);
    return { message: 'Label deleted successfully' };
  }
}
