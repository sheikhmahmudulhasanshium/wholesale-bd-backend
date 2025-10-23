import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreateLinkDto {
  @IsUrl({}, { message: 'A valid URL must be provided.' })
  @IsNotEmpty()
  url: string;
}
