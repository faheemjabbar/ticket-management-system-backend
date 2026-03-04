import { IsString, IsEnum, IsOptional, IsMongoId, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLabelDto {
  @ApiProperty({ example: 'Frontend' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: '#3B82F6' })
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'Color must be a valid hex code (e.g., #3B82F6)' })
  color: string;

  @ApiProperty({ example: 'Frontend related issues', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiProperty({ enum: ['general', 'priority', 'type', 'platform', 'team'], default: 'general' })
  @IsOptional()
  @IsEnum(['general', 'priority', 'type', 'platform', 'team'])
  category?: string;
}
