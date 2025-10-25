// src/products/public-products.controller.ts  <-- (You can create this new file)
import { Controller, Get, Param, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
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
    type: [ProductResponseDto],
  })
  async findAllPublic(): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findAllActive();
    return products.map((product) =>
      plainToInstance(ProductResponseDto, product.toJSON()),
    );
  }

  @Get('count')
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
    type: ProductResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found or is not active.' })
  @ApiBadRequestResponse({ description: 'Invalid product ID format.' })
  async findPublicOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findOneActive(id);
    return plainToInstance(ProductResponseDto, product.toJSON());
  }
}
