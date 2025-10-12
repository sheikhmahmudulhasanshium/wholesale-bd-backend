// src/metadata/metadata.controller.ts

import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { MetadataService, MetadataModuleKey } from './metadata.service';
import {
  ApiBody,
  ApiExtraModels, // <-- 1. Import ApiExtraModels
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  getSchemaPath, // <-- 2. Import getSchemaPath
} from '@nestjs/swagger';
// 3. Import the DTOs you want to reference
import { UpdateBrandDto } from './dto/update-brand.dto';
import { UpdatePagesDto } from './dto/update-pages.dto';

const sampleLanguageCodes = ['en-US', 'de-DE', 'es-ES', 'fr-FR', 'bn-BD'];

@ApiTags('Metadata')
@Controller('metadata')
// 4. Register the DTOs with the controller so Swagger can discover them
@ApiExtraModels(UpdateBrandDto, UpdatePagesDto)
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get()
  @ApiOperation({ summary: 'Get the entire public metadata configuration' })
  @ApiQuery({
    name: 'lang',
    required: false,
    type: String,
    enum: sampleLanguageCodes,
    description:
      'Select a language to receive transformed, language-specific data. If omitted, you get the full multi-language objects.',
  })
  @ApiOkResponse({
    description:
      'Returns the full metadata object, optionally transformed by language.',
  })
  async getPublicMetadata(@Query('lang') lang?: string): Promise<any> {
    return this.metadataService.getMetadata(lang);
  }

  @Get('admin')
  @ApiOperation({
    summary: 'Get the entire raw metadata configuration for admin panels',
  })
  @ApiOkResponse({
    description:
      'Returns the full, untransformed metadata object with all languages.',
  })
  @ApiSecurity('api_key')
  @UseGuards(ApiKeyGuard)
  async getAdminMetadata(): Promise<any> {
    return this.metadataService.getMetadata();
  }

  @Get(':module')
  @ApiOperation({
    summary: 'Get a specific module from the metadata configuration',
  })
  @ApiParam({
    name: 'module',
    required: true,
    type: String,
    enum: [
      'brand',
      'i18n',
      'theme',
      'social',
      'legal',
      'pages',
      'reusableContent',
      'seo',
    ],
    description: 'The specific slice of metadata to retrieve.',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    type: String,
    enum: sampleLanguageCodes,
    description:
      'Select a language to see how I18nString objects are transformed into simple strings.',
  })
  @ApiOkResponse({
    description: `
    Returns the data for the specified module. If the 'lang' query parameter is selected, any I18nString objects will be transformed into simple strings.
    An **I18nString** is a key-value object for storing translations.
    ... (description content) ...
    `,
  })
  async getMetadataModule(
    @Param('module') module: MetadataModuleKey,
    @Query('lang') lang?: string,
  ): Promise<any> {
    return this.metadataService.getMetadata(lang, module);
  }

  @Patch(':module')
  @ApiOperation({
    summary:
      'Update a specific module in the metadata configuration (Admin Only)',
  })
  @ApiParam({
    name: 'module',
    required: true,
    type: String,
    enum: [
      'brand',
      'i18n',
      'theme',
      'social',
      'legal',
      'pages',
      'reusableContent',
      'seo',
    ],
    description: 'The specific slice of metadata to update.',
  })
  @ApiBody({
    description:
      'The data to update the module with. The shape of this object depends on the :module parameter. Select a schema from the dropdown below to see an example.',
    schema: {
      oneOf: [
        // 5. Use getSchemaPath to create a valid reference to the now-registered models
        { $ref: getSchemaPath(UpdateBrandDto) },
        { $ref: getSchemaPath(UpdatePagesDto) },
      ],
    },
  })
  @ApiSecurity('api_key')
  @UseGuards(ApiKeyGuard)
  async updateMetadataModule(
    @Param('module') module: MetadataModuleKey,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: any,
  ): Promise<any> {
    return this.metadataService.updateModule(module, body);
  }
}
