import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTicketDto {
  @ApiProperty({ description: 'User ID to assign ticket to' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  assignedToId: string;

  @ApiProperty({ description: 'Name of user being assigned' })
  @IsString()
  @IsNotEmpty()
  assignedToName: string;
}
