import { Controller, Get, Param, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PublicProductResponseDto } from './dto/public-product-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer'; // <-- Re-import this

@ApiTags('Products (Public)')
@Controller('products')
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
    // FIX: Transform to the correct Public DTO to omit sensitive fields
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
    // FIX: Transform to the correct Public DTO
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
    // FIX: Transform to the correct Public DTO
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
    // FIX: Transform to the correct Public DTO
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
  ): Promise<PublicProductResponseDto> {
    const product = await this.productsService.findOneActive(id);
    // FIX: Transform to the correct Public DTO
    return plainToInstance(PublicProductResponseDto, product);
  }
}
