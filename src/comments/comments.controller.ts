import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Comments')
@Controller('api/tickets/:ticketId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get comments for ticket' })
  async findByTicket(@Param('ticketId') ticketId: string) {
    return this.commentsService.findByTicketId(ticketId);
  }

  @Post()
  @ApiOperation({ summary: 'Create comment' })
  async create(
    @Param('ticketId') ticketId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.create(ticketId, createCommentDto, user);
  }
}

@Controller('api/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsManagementController {
  constructor(private readonly commentsService: CommentsService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Update comment' })
  async update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment' })
  async delete(@Param('id') id: string) {
    await this.commentsService.delete(id);
    return { message: 'Comment deleted successfully' };
  }
}
