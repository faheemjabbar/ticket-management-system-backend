import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketHistoryController } from './ticket-history.controller';
import { TicketHistoryService } from './ticket-history.service';
import { TicketHistory, TicketHistorySchema } from './schemas/ticket-history.schema';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TicketHistory.name, schema: TicketHistorySchema }]),
    TicketsModule,
  ],
  controllers: [TicketHistoryController],
  providers: [TicketHistoryService],
  exports: [TicketHistoryService],
})
export class TicketHistoryModule {}
