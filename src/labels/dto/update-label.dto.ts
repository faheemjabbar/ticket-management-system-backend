import { IsString, IsEnum, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLabelDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'Color must be a valid hex code (e.g., #3B82F6)' })
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ enum: ['general', 'priority', 'type', 'platform', 'team'], required: false })
  @IsOptional()
  @IsEnum(['general', 'priority', 'type', 'platform', 'team'])
  category?: string;
}
