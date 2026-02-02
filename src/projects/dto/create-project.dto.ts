import { IsString, IsEnum, IsArray, IsDateString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TeamMemberDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: ['superadmin', 'admin', 'qa', 'developer'] })
  @IsEnum(['superadmin', 'admin', 'qa', 'developer'])
  role: string;
}

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: ['active', 'completed', 'archived'] })
  @IsEnum(['active', 'completed', 'archived'])
  status: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ type: [TeamMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  teamMembers: TeamMemberDto[];
}
