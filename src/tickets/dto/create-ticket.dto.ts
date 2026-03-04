import { IsString, IsEnum, IsArray, IsOptional, IsDateString, IsNumber, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketType } from '../enums/ticket-type.enum';

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: Object.values(TicketType), default: 'task' })
  @IsOptional()
  @IsEnum(Object.values(TicketType))
  type?: string;

  @ApiProperty({ enum: Object.values(TicketStatus), default: 'backlog' })
  @IsOptional()
  @IsEnum(Object.values(TicketStatus))
  status?: string;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority: string;

  @ApiProperty({ required: false, minimum: 0, maximum: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  priorityScore?: number;

  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  labels?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  storyPoints?: number;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  acceptanceCriteria?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sprintId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parentId?: string;
}
