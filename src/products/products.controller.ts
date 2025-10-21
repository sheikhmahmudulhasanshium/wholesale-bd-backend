// src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpStatus,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { plainToInstance } from 'class-transformer';

@ApiTags('Products')
@ApiHeader({
  name: 'x-api-key',
  description: 'The secret API key for access',
  required: true,
})
@UseGuards(ApiKeyGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The product has been successfully created.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or duplicate name/SKU.',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.create(createProductDto);
    return plainToInstance(ProductResponseDto, product.toJSON());
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all products' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved all products.',
    type: [ProductResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findAll();
    return products.map((product) =>
      plainToInstance(ProductResponseDto, product.toJSON()),
    );
  }

  @Get('count') // This must come BEFORE @Get(':id')
  @ApiOperation({ summary: 'Get the total count of products' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the total count of products.',
    type: Number,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  async countProducts(): Promise<number> {
    return this.productsService.countAllProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a product by its ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the product.',
    type: ProductResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @ApiBadRequestResponse({ description: 'Invalid product ID format.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);
    return plainToInstance(ProductResponseDto, product.toJSON());
  }

  // --- EXISTING ENDPOINT TO GET PRODUCTS BY CATEGORY ID ---
  @Get('category/:categoryId') // Route: /products/category/:categoryId
  @ApiOperation({ summary: 'Retrieve products by category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products for the given category ID.',
    type: [ProductResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Invalid category ID format.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  async findProductsByCategoryId(
    @Param('categoryId') categoryId: string,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findByCategoryId(categoryId);
    return products.map((product) =>
      plainToInstance(ProductResponseDto, product.toJSON()),
    );
  }
  // --- END EXISTING ENDPOINT ---

  // --- EXISTING ENDPOINT TO GET PRODUCTS BY ZONE ID ---
  @Get('zone/:zoneId') // Route: /products/zone/:zoneId
  @ApiOperation({ summary: 'Retrieve products by zone ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products for the given zone ID.',
    type: [ProductResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Invalid zone ID format.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  async findProductsByZoneId(
    @Param('zoneId') zoneId: string,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findByZoneId(zoneId);
    return products.map((product) =>
      plainToInstance(ProductResponseDto, product.toJSON()),
    );
  }
  // --- END EXISTING ENDPOINT ---

  // --- NEW ENDPOINT TO GET PRODUCTS BY SELLER ID ---
  @Get('seller/:sellerId') // New route: /products/seller/:sellerId
  @ApiOperation({ summary: 'Retrieve products by seller ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products for the given seller ID.',
    type: [ProductResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Invalid seller ID format.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  async findProductsBySellerId(
    @Param('sellerId') sellerId: string,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findBySellerId(sellerId);
    return products.map((product) =>
      plainToInstance(ProductResponseDto, product.toJSON()),
    );
  }
  // --- END NEW ENDPOINT ---

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing product by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The product has been successfully updated.',
    type: ProductResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @ApiBadRequestResponse({
    description: 'Invalid product ID format or invalid update data.',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(id, updateProductDto);
    return plainToInstance(ProductResponseDto, product.toJSON());
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product by its ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The product has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @ApiBadRequestResponse({ description: 'Invalid product ID format.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
