import { IsString, IsDateString, IsEnum, IsOptional, IsNumber, IsMongoId, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSprintDto {
  @ApiProperty({ example: 'Sprint 23' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Complete user authentication features', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  goal?: string;

  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: ['planning', 'active', 'completed'], default: 'planning' })
  @IsOptional()
  @IsEnum(['planning', 'active', 'completed'])
  status?: string;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;
}
