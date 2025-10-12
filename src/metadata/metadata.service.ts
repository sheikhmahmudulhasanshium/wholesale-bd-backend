// src/metadata/metadata.service.ts

import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Metadata } from './schemas/metadata.schema';
import { IMetadata } from './metadata.types';

export type MetadataModuleKey =
  | 'brand'
  | 'i18n'
  | 'theme'
  | 'social'
  | 'legal'
  | 'pages'
  | 'reusableContent'
  | 'seo';

@Injectable()
export class MetadataService implements OnModuleInit {
  private readonly logger = new Logger(MetadataService.name);

  constructor(
    @InjectModel(Metadata.name) private readonly metadataModel: Model<Metadata>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.metadataModel.findOne().exec();
    if (!existing) {
      this.logger.log(
        'No metadata document found. Creating one with default values.',
      );
      await this.metadataModel.create({});
    }
  }

  async getMetadata(
    lang?: string,
    module?: MetadataModuleKey,
  ): Promise<unknown> {
    const metadataDoc = (await this.metadataModel
      .findOne()
      .lean()
      .exec()) as IMetadata | null;

    if (!metadataDoc) {
      throw new NotFoundException('Metadata configuration not found.');
    }

    const result: unknown = module ? metadataDoc[module] : metadataDoc;

    if (result === undefined) {
      throw new NotFoundException(`Metadata module '${module}' not found.`);
    }

    if (lang) {
      return this.transformI18n(
        result,
        lang,
        metadataDoc.i18n?.defaultLanguage || 'en-US',
      );
    }

    return result;
  }

  async updateModule(
    module: MetadataModuleKey,
    data: unknown,
  ): Promise<Metadata | null> {
    const update = { $set: { [module]: data } };
    const updatedDoc: Metadata | null = await this.metadataModel
      .findOneAndUpdate({}, update, { new: true })
      .exec();
    return updatedDoc;
  }

  private transformI18n<T>(obj: T, lang: string, defaultLang: string): T {
    if (Array.isArray(obj)) {
      return obj.map((item: unknown) =>
        this.transformI18n(item, lang, defaultLang),
      ) as T;
    }

    if (obj !== null && typeof obj === 'object') {
      const keys = Object.keys(obj);
      const isI18nString = keys.some((k) => k.includes('-'));

      if (isI18nString && !('status' in obj)) {
        // --- THIS IS THE FIX ---
        // We cast `obj` to a type with a string index signature.
        // This explicitly tells the linter that indexing with a variable is safe and intended here.
        const indexedObj = obj as { [key: string]: unknown };
        return (indexedObj[lang] || indexedObj[defaultLang] || '') as T;
      }

      const newObj: { [key: string]: unknown } = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = this.transformI18n(
            obj[key as keyof T],
            lang,
            defaultLang,
          );
        }
      }
      return newObj as T;
    }

    return obj;
  }
}
