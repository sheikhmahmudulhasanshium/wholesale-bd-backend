// FILE: src/metadata/public-metadata.controller.ts
import { Controller, Get, Param, Query, Res, Logger } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { MetadataService } from './metadata.service';
import { IGlobalConfigValue } from './types/metadata.types';
import { MetadataDocument } from './schemas/metadata.schema';

// Helper function with its own logger instance
const logger = new Logger('LanguageFilter');

const isMultilingualObject = (obj: unknown): obj is Record<string, unknown> => {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }
  const keys = Object.keys(obj);
  return keys.length > 0 && keys.every((k) => k.match(/^[a-z]{2}-[A-Z]{2}$/));
};

/**
 * Type-safe recursive function to filter data by language.
 * It accepts and returns `unknown` because the transformation changes the data's shape.
 */
const filterByLang = (
  data: unknown,
  lang: string,
  defaultLang: string,
): unknown => {
  if (isMultilingualObject(data)) {
    if (data[lang]) {
      return data[lang];
    }
    if (data[defaultLang]) {
      // Logic Warning: Log when a fallback occurs.
      logger.warn(
        `Translation for lang '${lang}' not found. Falling back to default '${defaultLang}'.`,
      );
      return data[defaultLang];
    }
    // Fallback to the very first available translation if even the default is missing
    return Object.values(data)[0];
  }

  if (Array.isArray(data)) {
    return data.map((item) => filterByLang(item, lang, defaultLang));
  }

  if (typeof data === 'object' && data !== null) {
    // Cast to Record<string, unknown> to safely iterate over keys
    const currentObject = data as Record<string, unknown>;
    const newObj: Record<string, unknown> = {};
    for (const key in currentObject) {
      newObj[key] = filterByLang(currentObject[key], lang, defaultLang);
    }
    return newObj;
  }

  return data;
};

// Define a clear return type for our controller method's successful response
type PublicMetadataResponse = {
  key: string;
  value: unknown;
  updatedAt: Date;
};

@ApiTags('Metadata (Public)')
@Controller('metadata')
export class PublicMetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get(':key')
  @ApiOperation({
    summary: 'Get a metadata document by key',
    description:
      'This is the primary public endpoint for fetching front-end configuration. It is highly optimized for speed and caching. It will automatically filter content to a single language if the `lang` query parameter is provided.',
  })
  @ApiParam({
    name: 'key',
    description: 'The key of the metadata document to retrieve.',
    example: 'layoutConfig',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description:
      'Language code to filter content (e.g., bn-BD). If omitted, the full multilingual object is returned.',
    example: 'bn-BD',
  })
  @ApiOkResponse({
    description:
      'Returns the requested metadata document, potentially filtered by language.',
  })
  async findOne(
    @Param('key') key: string,
    @Query('lang') lang: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicMetadataResponse> {
    const document: MetadataDocument =
      await this.metadataService.findByKey(key);

    let responseValue: unknown = document.value;

    if (lang) {
      const globalConfigDoc =
        await this.metadataService.findByKey('globalConfig');
      const globalConfig =
        globalConfigDoc.value as unknown as IGlobalConfigValue;
      const defaultLang = globalConfig.defaultLanguage || 'en-US';
      responseValue = filterByLang(document.value, lang, defaultLang);
    }

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=3600',
    );

    return {
      key: document.key,
      value: responseValue,
      updatedAt: document.updatedAt,
    };
  }
}
