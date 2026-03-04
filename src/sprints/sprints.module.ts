import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';
import { Sprint, SprintSchema } from './schemas/sprint.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Ticket, TicketSchema } from '../tickets/schemas/ticket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sprint.name, schema: SprintSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Ticket.name, schema: TicketSchema },
    ]),
  ],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}
