import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetDefaultLanguageDto {
  @ApiProperty({
    example: 'bn-BD',
    description: 'The language code to set as the new default.',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
