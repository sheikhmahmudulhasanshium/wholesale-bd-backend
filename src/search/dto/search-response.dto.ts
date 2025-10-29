// src/search/dto/search-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicProductResponseDto } from '../../products/dto/public-product-response.dto';
import { PaginatedResponseDto } from './paginated-response.dto';

export class SearchResponseDto extends PaginatedResponseDto<PublicProductResponseDto> {
  @ApiProperty({
    type: () => [PublicProductResponseDto], // Explicitly set the type for Swagger
    description: 'The array of product search results for the current page.',
  })
  // FIX: Use 'declare' to properly augment the property from the base class.
  declare data: PublicProductResponseDto[];

  @ApiPropertyOptional({
    description: 'A suggested search query if a typo was corrected.',
    example: 'Did you mean: samsung phone',
  })
  suggestion?: string;
}
