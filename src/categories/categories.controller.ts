import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // --- ADD THIS NEW ENDPOINT ---
  @Get('count')
  @ApiOperation({ summary: 'Get the total number of categories' })
  async getCategoryCount(): Promise<{ totalCategories: number }> {
    const count = await this.categoriesService.countAll();
    return { totalCategories: count };
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all categories' })
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesService.findAll();
    return categories.map((cat) =>
      CategoryResponseDto.fromCategoryDocument(cat),
    );
  }
}
