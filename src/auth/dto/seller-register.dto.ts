import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SellerRegisterDto {
  @ApiProperty({
    example: 'seller@example.com',
    description: 'Seller email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @ApiProperty({
    example: 'SellerPassword123!',
    description: 'Seller password (min 8 characters)',
  })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;

  @ApiProperty({ example: 'Jane', description: "Seller's first name" })
  @IsString({ message: 'First name must be a string.' })
  @IsNotEmpty({ message: 'First name is required.' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: "Seller's last name" })
  @IsString({ message: 'Last name must be a string.' })
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName: string;

  @ApiProperty({
    example: "Doe's Electronics",
    description: 'Business name of the seller',
  })
  @IsString({ message: 'Business name must be a string.' })
  @IsNotEmpty({ message: 'Business name is required.' })
  businessName: string;

  @ApiProperty({
    example: 'BL123456789',
    description: 'Business license number',
  })
  @IsString({ message: 'Business license must be a string.' })
  @IsNotEmpty({ message: 'Business license is required.' })
  businessLicense: string;

  @ApiProperty({
    example: 'Selling high-quality electronics.',
    description: 'Description of the business',
  })
  @IsString({ message: 'Business description must be a string.' })
  @IsNotEmpty({ message: 'Business description is required.' })
  businessDescription: string;

  @ApiProperty({
    example: 'Dhaka',
    description: 'Operating zone for the business',
  })
  @IsString({ message: 'Zone must be a string.' })
  @IsNotEmpty({ message: 'Zone is required.' })
  zone: string;
}
