import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({
    enum: ['pending', 'assigned', 'awaiting', 'closed'],
    description: 'New status for the ticket',
  })
  @IsEnum(['pending', 'assigned', 'awaiting', 'closed'], {
    message: 'Status must be one of: pending, assigned, awaiting, closed',
  })
  status: string;
}
