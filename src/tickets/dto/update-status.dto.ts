import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '../enums/ticket-status.enum';

export class UpdateStatusDto {
  @ApiProperty({
    enum: Object.values(TicketStatus),
    description: 'New status for the ticket',
  })
  @IsEnum(Object.values(TicketStatus), {
    message: `Status must be one of: ${Object.values(TicketStatus).join(', ')}`,
  })
  status: string;
}
