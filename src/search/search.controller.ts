// src/search/search.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { Public } from 'src/auth/decorators/public.decorator'; // --- V NEW ---
import { CurrentUser } from 'src/auth/decorators/current-user.decorator'; // --- V NEW ---

@ApiTags('Search (Public)')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public() // --- V NEW ---
  @UseGuards(JwtAuthGuard) // --- V NEW ---
  @ApiBearerAuth() // --- V NEW ---
  @ApiOperation({
    summary: 'Perform a text search for products',
    description:
      'Searches for active products by name, description, brand, and model. Results are sorted by relevance. Handles typos and suggests corrections.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully.',
    type: SearchResponseDto,
  })
  async searchProducts(
    @Query(new ValidationPipe({ transform: true })) queryDto: SearchQueryDto,
    @CurrentUser() user?: UserDocument, // --- V NEW ---
  ): Promise<SearchResponseDto> {
    return this.searchService.searchProducts(queryDto, user);
  }

  @Post('update-dictionary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update the search dictionary (Admin Only)',
    description:
      'Scans all products and rebuilds the search dictionary used for typo correction. This is an intensive operation and should be run periodically as a background task.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dictionary update process completed successfully.',
    schema: { example: { wordCount: 5432 } },
  })
  async updateDictionary(): Promise<{ wordCount: number }> {
    return this.searchService.updateDictionary();
  }
}
