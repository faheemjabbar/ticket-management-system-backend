import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketHistoryService } from './ticket-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Ticket History')
@Controller('api/tickets/:ticketId/history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketHistoryController {
  constructor(private readonly ticketHistoryService: TicketHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get ticket history' })
  async findByTicket(@Param('ticketId') ticketId: string) {
    return this.ticketHistoryService.findByTicketId(ticketId);
  }
}
