import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationPreferencesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  ticketAssigned?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  ticketUpdated?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  ticketClosed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  mentionNotifications?: boolean;
}
