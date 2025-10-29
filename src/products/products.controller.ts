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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { AddMediaFromUrlDto } from './dto/add-media-from-url.dto';
import { UpdateMediaPropertiesDto } from './dto/update-media-properties.dto';
import { ProductMediaPurpose } from './enums/product-media-purpose.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileMimeTypeValidator } from './validators/file-mimetype.validator';
import { AddTagsDto } from './dto/add-tags.dto';

@ApiTags('Products (Protected)')
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
    @CurrentUser() user: UserDocument,
  ): Promise<ProductResponseDto> {
    const productDoc = await this.productsService.create(
      createProductDto,
      user,
    );
    const mappedProduct = await this.productsService.findOne(
      productDoc._id.toHexString(),
    );
    return plainToInstance(ProductResponseDto, mappedProduct);
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
    return plainToInstance(ProductResponseDto, products);
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
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id, user);
    return plainToInstance(ProductResponseDto, product);
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
    @CurrentUser() user: UserDocument,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(
      id,
      updateProductDto,
      user,
    );
    return plainToInstance(ProductResponseDto, product);
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
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<void> {
    return this.productsService.remove(id, user);
  }

  @Post(':id/thumbnail/upload')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload or replace the product thumbnail' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async uploadThumbnail(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileMimeTypeValidator({
            mimeType: ['image/jpeg', 'image/png', 'image/webp'],
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.addMediaFromFile(
      id,
      file,
      ProductMediaPurpose.THUMBNAIL,
      user,
    );
    return plainToInstance(ProductResponseDto, product);
  }

  @Post(':id/thumbnail/from-url')
  // --- V FIX: Corrected typo from 'UserTo ser' to 'UserRole.SELLER' ---
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Set or replace the product thumbnail from a URL' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async setThumbnailFromUrl(
    @Param('id') id: string,
    @Body() dto: AddMediaFromUrlDto,
    @CurrentUser() user: UserDocument,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.addMediaFromUrl(
      id,
      dto,
      ProductMediaPurpose.THUMBNAIL,
      user,
    );
    return plainToInstance(ProductResponseDto, product);
  }

  @Post(':id/previews/upload')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a new product preview image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async uploadPreview(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileMimeTypeValidator({
            mimeType: ['image/jpeg', 'image/png', 'image/webp'],
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.addMediaFromFile(
      id,
      file,
      ProductMediaPurpose.PREVIEW,
      user,
    );
    return plainToInstance(ProductResponseDto, product);
  }

  @Post(':id/previews/from-url')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Add a new product preview image from a URL' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async addPreviewFromUrl(
    @Param('id') id: string,
    @Body() dto: AddMediaFromUrlDto,
    @CurrentUser() user: UserDocument,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.addMediaFromUrl(
      id,
      dto,
      ProductMediaPurpose.PREVIEW,
      user,
    );
    return plainToInstance(ProductResponseDto, product);
  }

  @Patch(':id/media/:mediaId')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Update media properties (purpose, priority)' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async updateMediaProperties(
    @Param('id') productId: string,
    @Param('mediaId') mediaId: string,
    @Body() dto: UpdateMediaPropertiesDto,
    @CurrentUser() user: UserDocument,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.updateMediaProperties(
      productId,
      mediaId,
      dto,
      user,
    );
    return plainToInstance(ProductResponseDto, product);
  }

  @Delete(':id/media/:mediaId')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a specific media item from a product' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async deleteMedia(
    @Param('id') productId: string,
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: UserDocument,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.deleteMedia(
      productId,
      mediaId,
      user,
    );
    return plainToInstance(ProductResponseDto, product);
  }

  @Post(':id/tags')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Add tags to a product (Requires Admin/Seller Role)',
    description:
      'Adds an array of tags to a product. Existing tags are kept, and duplicates are ignored.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tags have been successfully added to the product.',
    type: ProductResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized or insufficient permissions.',
  })
  async addTags(
    @Param('id') id: string,
    @Body() addTagsDto: AddTagsDto,
    @CurrentUser() user: UserDocument,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.addTags(id, addTagsDto, user);
    return plainToInstance(ProductResponseDto, product);
  }
}
