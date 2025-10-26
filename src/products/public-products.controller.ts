// src/products/public-products.controller.ts
import { Controller, Get, Param, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
// --- MODIFY THIS IMPORT to use our new public DTO ---
import { PublicProductResponseDto } from './dto/public-product-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

@ApiTags('Products (Public)')
@Controller('products') // Stays the same to keep the URL prefix
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('public/all')
  @ApiOperation({ summary: 'Retrieve all active products (Public)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved all active products.',
    // --- UPDATE RESPONSE TYPE ---
    type: [PublicProductResponseDto],
  })
  async findAllPublic(): Promise<PublicProductResponseDto[]> {
    const products = await this.productsService.findAllActive();
    return products.map((product) =>
      // --- UPDATE DTO MAPPING ---
      plainToInstance(PublicProductResponseDto, product.toJSON()),
    );
  }

  // --- ADD THIS NEW METHOD ---
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
    const products = await this.productsService.findByCategoryId(categoryId);
    return products.map((product) =>
      plainToInstance(PublicProductResponseDto, product.toJSON()),
    );
  }

  // --- ADD THIS NEW METHOD ---
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
    const products = await this.productsService.findByZoneId(zoneId);
    return products.map((product) =>
      plainToInstance(PublicProductResponseDto, product.toJSON()),
    );
  }

  // --- ADD THIS NEW METHOD ---
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
    const products = await this.productsService.findBySellerId(sellerId);
    return products.map((product) =>
      plainToInstance(PublicProductResponseDto, product.toJSON()),
    );
  }

  @Get('public/count')
  @ApiOperation({ summary: 'Get the total count of products (Public)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the total count of products.',
    schema: { example: { totalProducts: 125 } },
  })
  async countProducts(): Promise<{ totalProducts: number }> {
    const count = await this.productsService.countAllProducts();
    return { totalProducts: count };
  }

  @Get('public/find/:id')
  @ApiOperation({ summary: 'Retrieve a single active product by ID (Public)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the active product.',
    // --- UPDATE RESPONSE TYPE ---
    type: PublicProductResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found or is not active.' })
  @ApiBadRequestResponse({ description: 'Invalid product ID format.' })
  async findPublicOne(
    @Param('id') id: string,
  ): Promise<PublicProductResponseDto> {
    const product = await this.productsService.findOneActive(id);
    // --- UPDATE DTO MAPPING ---
    return plainToInstance(PublicProductResponseDto, product.toJSON());
  }
}
