import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AdminUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class CreateOrganizationWithAdminDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Software development company', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: AdminUserDto })
  @ValidateNested()
  @Type(() => AdminUserDto)
  adminUser: AdminUserDto;
}
