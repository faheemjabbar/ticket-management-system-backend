import { IsString, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkTicketDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  targetTicketId: string;

  @ApiProperty({ 
    enum: ['blocks', 'blocked_by', 'relates_to', 'duplicates', 'duplicate_of'],
    example: 'blocks'
  })
  @IsEnum(['blocks', 'blocked_by', 'relates_to', 'duplicates', 'duplicate_of'])
  relationType: string;
}
