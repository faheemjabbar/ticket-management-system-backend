import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsController, CommentsManagementController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    TicketsModule,
  ],
  controllers: [CommentsController, CommentsManagementController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
