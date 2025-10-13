import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LanguageDto {
  @ApiProperty({
    example: 'fr-FR',
    description: 'The IETF language tag (e.g., en-US, bn-BD).',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  code: string;

  @ApiProperty({
    example: 'Français',
    description: 'The native name of the language.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
