import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

@ApiTags('Tickets')
@Controller('api/tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all tickets' })
  async findAll(@Query() query: any) {
    return this.ticketsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.ticketsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create ticket' })
  async create(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user: any) {
    const project = await this.projectsService.findById(createTicketDto.projectId);
    return this.ticketsService.create(createTicketDto, user, project.name);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ticket' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ticket' })
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    await this.ticketsService.delete(id);
    return { message: 'Ticket deleted successfully' };
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign ticket' })
  async assign(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() assignTicketDto: AssignTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.assignTicket(
      id,
      assignTicketDto.assignedToId,
      assignTicketDto.assignedToName,
      user,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.updateStatus(id, updateStatusDto.status, user);
  }
}
