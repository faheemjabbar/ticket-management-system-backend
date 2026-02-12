import { IsString, IsEnum, IsArray, IsDateString, IsOptional, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TeamMemberDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;

  @ApiProperty({ enum: ['admin', 'qa', 'developer'] })
  @IsEnum(['admin', 'qa', 'developer'])
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

  @ApiProperty({ type: [TeamMemberDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  teamMembers?: TeamMemberDto[];
}
