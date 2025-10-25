// src/products/products.controller.ts (Updated)
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
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Products (Protected)') // Updated tag for clarity in Swagger
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Create a new product (Requires Admin/Seller Role)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The product has been successfully created.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or duplicate name/SKU.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.create(createProductDto);
    return plainToInstance(ProductResponseDto, product.toJSON());
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all products (Requires Auth)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved all products.',
    type: [ProductResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findAll();
    return products.map((product) =>
      plainToInstance(ProductResponseDto, product.toJSON()),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a product by its ID (Requires Auth)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the product.',
    type: ProductResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @ApiBadRequestResponse({ description: 'Invalid product ID format.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);
    return plainToInstance(ProductResponseDto, product.toJSON());
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Retrieve products by category ID (Requires Auth)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products for the given category ID.',
    type: [ProductResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Invalid category ID format.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  async findProductsByCategoryId(
    @Param('categoryId') categoryId: string,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findByCategoryId(categoryId);
    return products.map((product) =>
      plainToInstance(ProductResponseDto, product.toJSON()),
    );
  }

  @Get('zone/:zoneId')
  @ApiOperation({ summary: 'Retrieve products by zone ID (Requires Auth)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products for the given zone ID.',
    type: [ProductResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Invalid zone ID format.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  async findProductsByZoneId(
    @Param('zoneId') zoneId: string,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findByZoneId(zoneId);
    return products.map((product) =>
      plainToInstance(ProductResponseDto, product.toJSON()),
    );
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Retrieve products by seller ID (Requires Auth)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products for the given seller ID.',
    type: [ProductResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Invalid seller ID format.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  async findProductsBySellerId(
    @Param('sellerId') sellerId: string,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findBySellerId(sellerId);
    return products.map((product) =>
      plainToInstance(ProductResponseDto, product.toJSON()),
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Update an existing product by ID (Requires Admin/Seller Role)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The product has been successfully updated.',
    type: ProductResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @ApiBadRequestResponse({
    description: 'Invalid product ID format or invalid update data.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(id, updateProductDto);
    return plainToInstance(ProductResponseDto, product.toJSON());
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Delete a product by its ID (Requires Admin/Seller Role)',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The product has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @ApiBadRequestResponse({ description: 'Invalid product ID format.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
