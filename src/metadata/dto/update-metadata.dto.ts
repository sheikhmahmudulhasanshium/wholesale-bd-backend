import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateMetadataDto {
  @ApiProperty({
    description: 'The entire new value object for the metadata key.',
    example: { siteName: 'My Awesome Site', defaultLanguage: 'en-US' },
    type: 'object',
    // --- THE FIX ---
    // This property is required by Swagger when defining a generic object
    // to indicate that it can have arbitrary keys.
    additionalProperties: true,
  })
  @IsObject()
  @IsNotEmpty()
  value: Record<string, unknown>;

  @ApiProperty({
    required: false,
    description: 'An optional internal-facing description for this entry.',
    example: 'Global configuration for the main website.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
