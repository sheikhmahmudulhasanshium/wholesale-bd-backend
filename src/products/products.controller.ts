import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto'; // <-- Import DTO

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // --- NEW PUBLIC COUNTER ENDPOINT ---
  @Get('count')
  @ApiOperation({ summary: 'Get the total number of products' })
  async getProductCount(): Promise<{ totalProducts: number }> {
    const count = await this.productsService.countAll();
    return { totalProducts: count };
  }

  // --- EXISTING PUBLIC ENDPOINT (NOW TYPED) ---
  @Get()
  @ApiOperation({ summary: 'Get a list of all products' })
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findAll();
    // Map the database documents to our safe DTO before sending
    return products.map((product) =>
      ProductResponseDto.fromProductDocument(product),
    );
  }
}
