import {
  Controller,
  Get,
  Post, // +++ ADD
  Param, // +++ ADD
  UploadedFile, // +++ ADD
  UseInterceptors, // +++ ADD
  UseGuards, // +++ ADD
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // +++ ADD
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiConsumes, // +++ ADD
  ApiBody, // +++ ADD
  ApiCreatedResponse, // +++ ADD
  ApiHeader, // +++ ADD
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard'; // +++ ADD

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // +++ ADD THIS ENTIRE NEW ENDPOINT +++
  @Post(':id/media')
  @UseGuards(ApiKeyGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiHeader({ name: 'x-api-key', required: true })
  @ApiOperation({
    summary: 'Upload a file and attach it to a product',
    description:
      'A direct, single-step file upload for testing and seeding. The file is sent as multipart/form-data.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'File uploaded and linked to the product successfully.',
    type: ProductResponseDto,
  })
  async uploadMedia(
    @Param('id') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const updatedProduct = await this.productsService.addMediaToProduct(
      productId,
      file,
    );
    return ProductResponseDto.fromProductDocument(updatedProduct);
  }

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
}
