import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class SetProfilePictureFromUrlDto {
  @ApiProperty({
    description: 'The external URL of the image to use.',
    example:
      'https://lh3.googleusercontent.com/a/ACg8ocK6YC2zQe5GJGOoT_ebyF8B__88oPeQ14iD2pWzRcJ3ZzXPcIY=s96-c',
  })
  @IsUrl({}, { message: 'A valid URL must be provided.' })
  @IsNotEmpty()
  url: string;
}
