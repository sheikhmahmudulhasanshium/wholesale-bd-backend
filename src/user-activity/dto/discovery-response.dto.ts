// src/user-activity/dto/discovery-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PublicProductResponseDto } from 'src/products/dto/public-product-response.dto';

class RecommendationSection {
  @ApiProperty({
    description: 'An explanation for why these items are being recommended.',
    example: 'Popular in Electronics',
  })
  title: string;

  @ApiProperty({
    type: () => [PublicProductResponseDto],
    description: 'A list of recommended products.',
  })
  @Type(() => PublicProductResponseDto)
  items: PublicProductResponseDto[];
}

export class DiscoveryResponseDto {
  @ApiPropertyOptional({
    type: () => [PublicProductResponseDto],
    description: 'A list of products the user has recently viewed.',
  })
  @Type(() => PublicProductResponseDto)
  recentlyViewed?: PublicProductResponseDto[];

  @ApiPropertyOptional({
    type: () => RecommendationSection,
    description: 'A section of recommended products based on user activity.',
  })
  @Type(() => RecommendationSection)
  recommendedForYou?: RecommendationSection;

  @ApiPropertyOptional({
    type: () => RecommendationSection,
    description: 'A fallback section of generally popular items for new users.',
  })
  @Type(() => RecommendationSection)
  trendingNow?: RecommendationSection;
}
