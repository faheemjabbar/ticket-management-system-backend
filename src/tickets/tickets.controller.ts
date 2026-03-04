import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { LinkTicketDto } from './dto/link-ticket.dto';
import { AddWatcherDto, RemoveWatcherDto } from './dto/manage-watchers.dto';
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
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.ticketsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string, @CurrentUser() user: any) {
    return this.ticketsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create ticket' })
  async create(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user: any) {
    const project = await this.projectsService.findById(createTicketDto.projectId, user);
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

  @Post(':id/link')
  @ApiOperation({ summary: 'Link ticket to another ticket' })
  async linkTickets(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() linkTicketDto: LinkTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.linkTickets(
      id,
      linkTicketDto.targetTicketId,
      linkTicketDto.relationType,
      user,
    );
  }

  @Delete(':id/link/:targetId/:relationType')
  @ApiOperation({ summary: 'Unlink ticket from another ticket' })
  async unlinkTickets(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('targetId', ParseObjectIdPipe) targetId: string,
    @Param('relationType') relationType: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.unlinkTickets(id, targetId, relationType, user);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related tickets' })
  async getRelatedTickets(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.getRelatedTickets(id, user);
  }

  @Post(':id/watchers')
  @ApiOperation({ summary: 'Add watcher to ticket' })
  async addWatcher(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() addWatcherDto: AddWatcherDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.addWatcher(id, addWatcherDto.userId, user);
  }

  @Delete(':id/watchers/:userId')
  @ApiOperation({ summary: 'Remove watcher from ticket' })
  async removeWatcher(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) userId: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.removeWatcher(id, userId, user);
  }

  @Get(':id/watchers')
  @ApiOperation({ summary: 'Get ticket watchers' })
  async getWatchers(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.getWatchers(id, user);
  }
}
