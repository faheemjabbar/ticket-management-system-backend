import { IsString, IsEnum, IsArray, IsDateString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TeamMemberUpdateDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: ['admin', 'project-manager', 'qa', 'developer'] })
  @IsEnum(['admin', 'project-manager', 'qa', 'developer'])
  role: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  assignedAt?: string;
}

export class UpdateProjectDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['active', 'completed', 'archived'], required: false })
  @IsOptional()
  @IsEnum(['active', 'completed', 'archived'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ type: [TeamMemberUpdateDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberUpdateDto)
  teamMembers?: TeamMemberUpdateDto[];
}
