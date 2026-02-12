import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Software development company', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
