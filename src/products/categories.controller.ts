import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/enums/role.enum';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Roles } from 'src/auth/decorators/role.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiResponse({ status: 200, description: 'List of active categories.' })
  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by ID' })
  @ApiResponse({ status: 200, description: 'Category details.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async findOne(@Param('id') id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryDocument> {
    const newCategory = new this.categoryModel(createCategoryDto);
    return newCategory.save();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();
    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return updatedCategory;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a category (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Category deactivated successfully.',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    const result = await this.categoryModel
      .findByIdAndUpdate(id, { isActive: false })
      .exec();
    if (!result) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return { message: 'Category deactivated successfully' };
  }
}
