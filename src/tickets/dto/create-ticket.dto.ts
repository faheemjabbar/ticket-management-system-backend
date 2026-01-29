import { IsString, IsEnum, IsArray, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority: string;

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
}
