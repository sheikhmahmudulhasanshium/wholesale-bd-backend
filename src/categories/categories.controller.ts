import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards, // Make sure this is imported
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// --- Import your RBAC and Auth components ---
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // <-- IMPORTANT: Import the JWT guard
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/users/schemas/user.schema';

@ApiTags('Categories')
@Controller('categories')
// --- We REMOVED @UseGuards from the controller level ---
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ================================================================= //
  // ===================== ADMIN-ONLY ENDPOINTS ====================== //
  // ================================================================= //

  // CREATE (Admin Only)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- APPLY GUARDS IN ORDER: 1. Authenticate, 2. Authorize
  @Roles(UserRole.ADMIN) // <-- Specify the required role
  @ApiBearerAuth() // <-- Tell Swagger this needs a token
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiCreatedResponse({
    description: 'The category has been successfully created.',
    type: CategoryResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden. User is not an admin.' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const newCategory = await this.categoriesService.create(createCategoryDto);
    return CategoryResponseDto.fromCategoryDocument(newCategory);
  }

  // UPDATE (Admin Only)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category by its ID (Admin only)' })
  @ApiOkResponse({
    description: 'The category has been successfully updated.',
    type: CategoryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden. User is not an admin.' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const updatedCategory = await this.categoriesService.update(
      id,
      updateCategoryDto,
    );
    return CategoryResponseDto.fromCategoryDocument(updatedCategory);
  }

  // DELETE (Admin Only)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category by its ID (Admin only)' })
  @ApiNoContentResponse({
    description: 'The category has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden. User is not an admin.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.categoriesService.remove(id);
  }

  // ================================================================= //
  // ======================== PUBLIC ENDPOINTS ======================= //
  // ================================================================= //

  // READ (All) - Public
  @Public() // This endpoint is public and requires no authentication
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

  // COUNT - Public
  @Public() // This endpoint is public and requires no authentication
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

  // READ (One by ID) - Public
  @Public() // Also making this public for consistency
  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by its ID' })
  @ApiOkResponse({
    description: 'The category record.',
    type: CategoryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.findById(id);
    return CategoryResponseDto.fromCategoryDocument(category);
  }
}
