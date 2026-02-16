import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketHistoryService } from './ticket-history.service';
import { TicketsService } from '../tickets/tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Ticket History')
@Controller('api/tickets/:ticketId/history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketHistoryController {
  constructor(
    private readonly ticketHistoryService: TicketHistoryService,
    private readonly ticketsService: TicketsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get ticket history' })
  async findByTicket(@Param('ticketId') ticketId: string, @CurrentUser() user: any) {
    // Validate user has access to this ticket (organization check)
    await this.ticketsService.findById(ticketId, user);
    return this.ticketHistoryService.findByTicketId(ticketId);
  }
}
