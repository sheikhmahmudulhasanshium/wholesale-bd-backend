// src/products/public-products.controller.ts

import {
  Controller,
  Get,
  Param,
  HttpStatus,
  UseGuards,
  Patch,
  HttpCode,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { PublicProductResponseDto } from './dto/public-product-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserDocument } from 'src/users/schemas/user.schema';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Products (Public)')
@Controller('products')
@Public() // Apply Public decorator at the controller level
@UseGuards(JwtAuthGuard) // Apply JWT guard to attempt user resolution
@ApiBearerAuth() // Add Bearer Auth to Swagger for optional token
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // --- V NEW: Organic View Count Endpoint ---
  @Patch('public/:productId/view')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Override: 5 requests per IP per minute
  @ApiOperation({
    summary: 'Increment a product view count (Public, Rate-Limited)',
  })
  @ApiOkResponse({
    description:
      'View count incremented (or silently ignored for the seller). Always returns 200 OK.',
  })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @ApiBadRequestResponse({ description: 'Invalid product ID format.' })
  async incrementViewCount(
    @Param('productId') productId: string,
    @CurrentUser() user?: UserDocument,
  ): Promise<void> {
    await this.productsService.incrementViewCount(productId, user);
  }
  // --- ^ END of NEW ---

  @Get('public/all')
  @ApiOperation({ summary: 'Retrieve all active products (Public)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved all active products.',
    type: [PublicProductResponseDto],
  })
  async findAllPublic(): Promise<PublicProductResponseDto[]> {
    const products = await this.productsService.findAllActive();
    return plainToInstance(PublicProductResponseDto, products);
  }

  @Get('public/category/:categoryId')
  @ApiOperation({ summary: 'Retrieve products by category ID (Public)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products for the given category ID.',
    type: [PublicProductResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Invalid category ID format.' })
  async findProductsByCategoryId(
    @Param('categoryId') categoryId: string,
  ): Promise<PublicProductResponseDto[]> {
    const products =
      await this.productsService.findActiveByCategoryId(categoryId);
    return plainToInstance(PublicProductResponseDto, products);
  }

  @Get('public/zone/:zoneId')
  @ApiOperation({ summary: 'Retrieve products by zone ID (Public)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products for the given zone ID.',
    type: [PublicProductResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Invalid zone ID format.' })
  async findProductsByZoneId(
    @Param('zoneId') zoneId: string,
  ): Promise<PublicProductResponseDto[]> {
    const products = await this.productsService.findActiveByZoneId(zoneId);
    return plainToInstance(PublicProductResponseDto, products);
  }

  @Get('public/seller/:sellerId')
  @ApiOperation({ summary: 'Retrieve products by seller ID (Public)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products for the given seller ID.',
    type: [PublicProductResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Invalid seller ID format.' })
  async findProductsBySellerId(
    @Param('sellerId') sellerId: string,
  ): Promise<PublicProductResponseDto[]> {
    const products = await this.productsService.findActiveBySellerId(sellerId);
    return plainToInstance(PublicProductResponseDto, products);
  }

  @Get('public/count')
  @ApiOperation({ summary: 'Get the total count of products (Public)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the total count of products.',
    schema: { example: { totalProducts: 125 } },
  })
  async countProducts(): Promise<{ totalProducts: number }> {
    const count = await this.productsService.countAllActiveProducts();
    return { totalProducts: count };
  }

  @Get('public/find/:id')
  @ApiOperation({ summary: 'Retrieve a single active product by ID (Public)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the active product.',
    type: PublicProductResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found or is not active.' })
  @ApiBadRequestResponse({ description: 'Invalid product ID format.' })
  async findPublicOne(
    @Param('id') id: string,
    @CurrentUser() user?: UserDocument, // User will be present if valid token is provided
  ): Promise<PublicProductResponseDto> {
    const product = await this.productsService.findOneActive(id, user); // Pass user to service
    return plainToInstance(PublicProductResponseDto, product);
  }
}
