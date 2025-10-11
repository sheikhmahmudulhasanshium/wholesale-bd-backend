import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
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
}
