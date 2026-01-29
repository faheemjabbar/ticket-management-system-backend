import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(@InjectModel(Comment.name) private commentModel: Model<CommentDocument>) {}

  async create(ticketId: string, createCommentDto: CreateCommentDto, user: any): Promise<any> {
    const comment = new this.commentModel({
      ...createCommentDto,
      ticketId,
      authorId: user.id,
      authorName: user.name,
    });
    const savedComment = await comment.save();
    return savedComment.toJSON();
  }

  async findByTicketId(ticketId: string): Promise<any[]> {
    const comments = await this.commentModel
      .find({ ticketId })
      .sort({ createdAt: -1 })
      .exec();
    return comments.map(c => c.toJSON());
  }

  async findById(id: string): Promise<any> {
    const comment = await this.commentModel.findById(id).exec();
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment.toJSON();
  }

  async update(id: string, updateCommentDto: UpdateCommentDto): Promise<any> {
    const comment = await this.commentModel
      .findByIdAndUpdate(id, updateCommentDto, { new: true })
      .exec();
    
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment.toJSON();
  }

  async delete(id: string): Promise<void> {
    const result = await this.commentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Comment not found');
    }
  }
}
