<<<<<<< HEAD
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SellerApprovalGuard } from '../auth/guards/seller-approval.guard';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { R2UploadService } from '../common/services/r2-upload.service';
import { Roles } from 'src/auth/decorators/role.decorator';
=======
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
>>>>>>> main

@ApiTags('Products')
@Controller('products')
export class ProductsController {
<<<<<<< HEAD
  constructor(
    private readonly productsService: ProductsService,
    private readonly r2UploadService: R2UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, SellerApprovalGuard)
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new product (Seller only)' })
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @CurrentUser() user: UserDocument,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const imageUrls = files
      ? await this.r2UploadService.uploadFiles(files, 'products')
      : [];
    return this.productsService.create(
      createProductDto,
      user._id.toString(),
      imageUrls,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all active products with filtering' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('seller/my-products')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerApprovalGuard)
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get logged-in seller's products" })
  getMyProducts(
    @CurrentUser() user: UserDocument,
    @Query() query: ProductQueryDto,
  ) {
    return this.productsService.getSellerProducts(user._id.toString(), query);
  }

  @Get('zone/:zoneId')
  @ApiOperation({ summary: 'Get products by geographical zone' })
  getProductsByZone(
    @Param('zoneId') zoneId: string,
    @Query() query: ProductQueryDto,
  ) {
    return this.productsService.getProductsByZone(zoneId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerApprovalGuard)
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a product (Seller only)' })
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const newImageUrls = files
      ? await this.r2UploadService.uploadFiles(files, 'products')
      : [];
    return this.productsService.update(
      id,
      updateProductDto,
      user._id.toString(),
      newImageUrls,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerApprovalGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a product (Seller or Admin)' })
  remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    // FIX: Cast `user.role` to the `Role` enum for safe comparison.
    if ((user.role as Role) === Role.ADMIN) {
      // Admin can delete any product; we bypass the ownership check by passing an empty sellerId.
      // We pass an empty string because the service expects a string, but it won't be used for the admin path.
      return this.productsService.remove(id, '');
    }
    // For sellers, we pass their actual ID to enforce ownership rules.
    return this.productsService.remove(id, user._id.toString());
  }
=======
  constructor(private readonly productsService: ProductsService) {}

  @Get('count')
  @ApiOperation({ summary: 'Get the total number of products' })
  @ApiOkResponse({
    description: 'Returns the total count of products.',
    schema: { example: { totalProducts: 542 } },
  })
  async getProductCount(): Promise<{ totalProducts: number }> {
    const count = await this.productsService.countAll();
    return { totalProducts: count };
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all products' })
  @ApiOkResponse({
    description: 'An array of product records.',
    type: [ProductResponseDto],
  })
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findAll();
    return products.map((product) =>
      ProductResponseDto.fromProductDocument(product),
    );
  }
>>>>>>> main
}
