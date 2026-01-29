import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Tickets')
@Controller('api/tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tickets' })
  async findAll(@Query() query: any) {
    return this.ticketsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create ticket' })
  async create(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user: any) {
    // In real app, fetch project name from ProjectsService
    const projectName = 'Project Name'; // TODO: Fetch from project
    return this.ticketsService.create(createTicketDto, user, projectName);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ticket' })
  async update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ticket' })
  async delete(@Param('id') id: string) {
    await this.ticketsService.delete(id);
    return { message: 'Ticket deleted successfully' };
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign ticket' })
  async assign(@Param('id') id: string, @Body() body: { assignedToId: string; assignedToName: string }) {
    return this.ticketsService.assignTicket(id, body.assignedToId, body.assignedToName);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ticketsService.updateStatus(id, body.status);
  }
}
