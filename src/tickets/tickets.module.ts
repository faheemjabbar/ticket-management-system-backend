import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivitiesModule } from '../activities/activities.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
    NotificationsModule,
    ActivitiesModule,
    ProjectsModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
