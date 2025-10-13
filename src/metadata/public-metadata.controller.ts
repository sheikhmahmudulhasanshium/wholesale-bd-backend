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

const logger = new Logger('LanguageFilter');

const isMultilingualObject = (obj: unknown): obj is Record<string, unknown> => {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }
  const keys = Object.keys(obj);
  return keys.length > 0 && keys.every((k) => k.match(/^[a-z]{2}-[A-Z]{2}$/));
};

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
      logger.warn(
        `Translation for lang '${lang}' not found. Falling back to default '${defaultLang}'.`,
      );
      return data[defaultLang];
    }
    return Object.values(data)[0];
  }

  if (Array.isArray(data)) {
    return data.map((item) => filterByLang(item, lang, defaultLang));
  }

  if (typeof data === 'object' && data !== null) {
    const currentObject = data as Record<string, unknown>;
    const newObj: Record<string, unknown> = {};
    for (const key in currentObject) {
      newObj[key] = filterByLang(currentObject[key], lang, defaultLang);
    }
    return newObj;
  }

  return data;
};

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
  })
  @ApiParam({
    name: 'key',
    example: 'layoutConfig',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
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
