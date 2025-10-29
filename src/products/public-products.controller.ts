// src/products/public-products.controller.ts
import { Controller, Get, Param, HttpStatus, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PublicProductResponseDto } from './dto/public-product-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Public } from 'src/auth/decorators/public.decorator'; // --- V NEW ---
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // --- V NEW ---
import { CurrentUser } from 'src/auth/decorators/current-user.decorator'; // --- V NEW ---
import { UserDocument } from 'src/users/schemas/user.schema'; // --- V NEW ---

@ApiTags('Products (Public)')
@Controller('products')
@Public() // --- V NEW: Apply Public decorator at the controller level ---
@UseGuards(JwtAuthGuard) // --- V NEW: Apply JWT guard to attempt user resolution ---
@ApiBearerAuth() // --- V NEW: Add Bearer Auth to Swagger for optional token ---
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
  // --- V MODIFIED: Added optional CurrentUser ---
  async findPublicOne(
    @Param('id') id: string,
    @CurrentUser() user?: UserDocument, // User will be present if valid token is provided
  ): Promise<PublicProductResponseDto> {
    const product = await this.productsService.findOneActive(id, user); // Pass user to service
    return plainToInstance(PublicProductResponseDto, product);
  }
}
