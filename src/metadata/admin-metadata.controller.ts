import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { MetadataService } from './metadata.service';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateMetadataDto } from './dto/update-metadata.dto';
import { LanguageDto } from './dto/language.dto';
import { SetDefaultLanguageDto } from './dto/set-default-language.dto';

@ApiTags('Metadata (Admin)')
@Controller('admin/metadata')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  required: true,
  description: 'The secret API key for admin access.',
})
export class AdminMetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Post('/seed')
  @ApiOperation({
    summary: 'Seed the database with initial data',
    description:
      'Populates the metadata collection with default documents (globalConfig, layoutConfig, etc.). This endpoint will fail if any data already exists in the collection, preventing accidental overwrites.',
  })
  @ApiResponse({
    status: 201,
    description: 'Database seeded successfully.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Database is not empty.',
  })
  seedDatabase() {
    return this.metadataService.seedDatabase();
  }

  @Get()
  @ApiOperation({
    summary: 'List all metadata keys (Paginated)',
    description:
      'Provides a paginated list of all metadata keys for the admin panel. The full `value` is not returned for performance; use the GET /:key endpoint to fetch the full data for editing.',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination.',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page.',
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: 'search',
    description: 'Filter keys by a search term (case-insensitive).',
    example: 'pageMeta',
    required: false,
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.metadataService.findAllPaginated(page, limit, search);
  }

  @Get(':key')
  @ApiOperation({
    summary: 'Get a single metadata document for editing',
    description:
      'Fetches a single, complete metadata document with all its language variants, suitable for populating an admin editing form.',
  })
  @ApiParam({
    name: 'key',
    description:
      'The full key of the document to fetch, including `draft:` prefix if applicable.',
    example: 'globalConfig',
  })
  findOne(@Param('key') key: string) {
    return this.metadataService.findAdminByKey(key);
  }

  @Put(':key')
  @ApiOperation({
    summary: 'Update or create a metadata document',
    description:
      'Saves changes to a metadata document. If the key does not exist, it will be created. This is the primary endpoint for saving content from the admin panel. To work on changes without affecting the live site, use a `draft:` prefix on your key (e.g., `draft:layoutConfig`).',
  })
  @ApiParam({
    name: 'key',
    description: 'The key of the document to save.',
    example: 'draft:layoutConfig',
  })
  update(@Param('key') key: string, @Body() updateDto: UpdateMetadataDto) {
    return this.metadataService.update(key, updateDto);
  }

  @Post('/publish/:draftKey')
  @ApiOperation({
    summary: 'Publish a draft to the live site',
    description:
      'Copies the content from a draft document (e.g., `draft:layoutConfig`) to its corresponding live document (`layoutConfig`) and then deletes the draft. This is the action for making staged changes visible to the public.',
  })
  @ApiParam({
    name: 'draftKey',
    description: 'The full key of the draft to publish.',
    example: 'draft:layoutConfig',
  })
  @HttpCode(HttpStatus.OK)
  publishDraft(@Param('draftKey') draftKey: string) {
    return this.metadataService.publishDraft(draftKey);
  }

  @Get('config/languages')
  @ApiOperation({
    summary: 'Get the list of available languages',
    description:
      'Retrieves the `availableLanguages` array from the `globalConfig` document.',
  })
  getLanguages() {
    return this.metadataService.getLanguages();
  }

  @Post('config/languages')
  @ApiOperation({
    summary: 'Add a new language to the system',
    description:
      'Adds a new language to `globalConfig` and then traverses all other metadata documents to add a placeholder value for the new language code in every multilingual text field.',
  })
  @ApiResponse({ status: 201, description: 'Language added successfully.' })
  addLanguage(@Body() languageDto: LanguageDto) {
    return this.metadataService.addLanguage(languageDto);
  }

  @Delete('config/languages/:code')
  @ApiOperation({
    summary: 'Remove a language from the system (Destructive)',
    description:
      'Removes a language from `globalConfig` and deletes its corresponding key from every multilingual text field in all other metadata documents. This action cannot be undone. The default language cannot be deleted.',
  })
  @ApiParam({
    name: 'code',
    description: 'The language code to delete.',
    example: 'es-ES',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLanguage(@Param('code') code: string) {
    return this.metadataService.removeLanguage(code);
  }

  @Put('config/default-language')
  @ApiOperation({
    summary: 'Set the default language',
    description:
      'Updates the `defaultLanguage` property in the `globalConfig` document.',
  })
  setDefaultLanguage(@Body() dto: SetDefaultLanguageDto) {
    return this.metadataService.setDefaultLanguage(dto.code);
  }
}
