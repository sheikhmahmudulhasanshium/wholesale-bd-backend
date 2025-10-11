import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('count')
  @ApiOperation({ summary: 'Get the total number of categories' })
  @ApiOkResponse({
    description: 'Returns the total count of categories.',
    schema: { example: { totalCategories: 15 } },
  })
  async getCategoryCount(): Promise<{ totalCategories: number }> {
    const count = await this.categoriesService.countAll();
    return { totalCategories: count };
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all categories' })
  @ApiOkResponse({
    description: 'An array of category records, sorted by sortOrder.',
    type: [CategoryResponseDto],
  })
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesService.findAll();
    return categories.map((cat) =>
      CategoryResponseDto.fromCategoryDocument(cat),
    );
  }
}
