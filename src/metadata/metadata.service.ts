import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Metadata, MetadataDocument } from './schemas/metadata.schema';
import { LanguageDto } from './dto/language.dto';
import { UpdateMetadataDto } from './dto/update-metadata.dto';
import { IGlobalConfigValue } from './types/metadata.types';
import { SEED_DATA } from './data/seed-data';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(
    @InjectModel(Metadata.name) private metadataModel: Model<MetadataDocument>,
  ) {}

  // --- PUBLIC METHODS ---

  async findByKey(key: string): Promise<MetadataDocument> {
    if (key.startsWith('draft:')) {
      throw new BadRequestException(
        'Cannot fetch draft keys via the public endpoint.',
      );
    }
    const doc = await this.metadataModel.findOne({ key }).lean().exec();
    if (!doc) {
      throw new NotFoundException(`Metadata with key "${key}" not found`);
    }
    return doc as MetadataDocument;
  }

  // --- ADMIN METHODS ---

  async findAllPaginated(page: number, limit: number, search?: string) {
    const query = search ? { key: { $regex: search, $options: 'i' } } : {};
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      this.metadataModel
        .find(query, { key: 1, description: 1, updatedAt: 1 })
        .sort({ key: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.metadataModel.countDocuments(query),
    ]);

    return { data: results, total, page, lastPage: Math.ceil(total / limit) };
  }

  async findAdminByKey(key: string): Promise<MetadataDocument> {
    const doc = await this.metadataModel.findOne({ key }).lean().exec();
    if (!doc) {
      throw new NotFoundException(`Metadata with key "${key}" not found`);
    }
    return doc as MetadataDocument;
  }

  async update(key: string, dto: UpdateMetadataDto): Promise<MetadataDocument> {
    return this.metadataModel
      .findOneAndUpdate(
        { key },
        { $set: { value: dto.value, description: dto.description } },
        { new: true, upsert: true },
      )
      .exec();
  }

  async publishDraft(
    draftKey: string,
  ): Promise<{ message: string; liveKey: string }> {
    if (!draftKey.startsWith('draft:')) {
      throw new BadRequestException(
        'The provided key is not a valid draft key.',
      );
    }
    const liveKey = draftKey.replace('draft:', '');
    this.logger.log(
      `Publishing draft '${draftKey}' to live key '${liveKey}'...`,
    );

    const draftDoc = await this.findAdminByKey(draftKey);

    await this.update(liveKey, {
      value: draftDoc.value,
      description: draftDoc.description,
    });
    await this.metadataModel.deleteOne({ key: draftKey }).exec();

    this.logger.log(`Successfully published '${liveKey}' and removed draft.`);
    return { message: `Successfully published draft to '${liveKey}'`, liveKey };
  }

  async seedDatabase(): Promise<{ message: string; count: number }> {
    const count = await this.metadataModel.countDocuments().exec();
    if (count > 0) {
      throw new ConflictException(
        'Database is not empty. Seeding is only allowed on a fresh database.',
      );
    }

    this.logger.log(`Seeding database with ${SEED_DATA.length} documents...`);
    await this.metadataModel.insertMany(SEED_DATA);
    this.logger.log('Database seeding complete.');

    return {
      message: 'Database seeded successfully.',
      count: SEED_DATA.length,
    };
  }

  // --- LANGUAGE MANAGEMENT ---

  private async getGlobalConfig(): Promise<{
    doc: MetadataDocument;
    value: IGlobalConfigValue;
  }> {
    const doc = await this.findAdminByKey('globalConfig');
    return { doc, value: doc.value as unknown as IGlobalConfigValue };
  }

  async getLanguages(): Promise<IGlobalConfigValue['availableLanguages']> {
    const { value } = await this.getGlobalConfig();
    return value.availableLanguages || [];
  }

  async setDefaultLanguage(code: string): Promise<MetadataDocument> {
    const { doc, value } = await this.getGlobalConfig();
    if (!value.availableLanguages.find((lang) => lang.code === code)) {
      throw new BadRequestException(
        `Language code "${code}" is not available.`,
      );
    }
    value.defaultLanguage = code;
    return this.update('globalConfig', {
      // --- THE FIX ---
      value: value as unknown as Record<string, unknown>,
      description: doc.description,
    });
  }

  async addLanguage(dto: LanguageDto): Promise<void> {
    this.logger.log(`Adding new language: ${dto.code} (${dto.name})`);
    const { doc, value } = await this.getGlobalConfig();

    if (value.availableLanguages.find((lang) => lang.code === dto.code)) {
      throw new ConflictException(
        `Language code "${dto.code}" already exists.`,
      );
    }
    value.availableLanguages.push(dto);
    const langCodes = value.availableLanguages.map((l) => l.code);

    await this.update('globalConfig', {
      // --- THE FIX ---
      value: value as unknown as Record<string, unknown>,
      description: doc.description,
    });

    await this.traverseAndUpdateAllDocuments((obj) => {
      if (this.isLanguageObject(obj, langCodes)) {
        obj[dto.code] = `[NEEDS TRANSLATION: ${dto.name}]`;
      }
    });
    this.logger.log(`Finished propagating language ${dto.code}.`);
  }

  async removeLanguage(code: string): Promise<void> {
    this.logger.warn(`Removing language: ${code}`);
    const { doc, value } = await this.getGlobalConfig();

    if (value.defaultLanguage === code) {
      throw new BadRequestException('Cannot remove the default language.');
    }
    const initialLength = value.availableLanguages.length;
    value.availableLanguages = value.availableLanguages.filter(
      (lang) => lang.code !== code,
    );
    if (initialLength === value.availableLanguages.length) {
      throw new NotFoundException(`Language code "${code}" not found.`);
    }

    await this.update('globalConfig', {
      // --- THE FIX ---
      value: value as unknown as Record<string, unknown>,
      description: doc.description,
    });

    const langCodes = value.availableLanguages.map((l) => l.code);
    await this.traverseAndUpdateAllDocuments((obj) => {
      if (this.isLanguageObject(obj, langCodes)) {
        delete obj[code];
      }
    });
    this.logger.log(`Finished removing language ${code}.`);
  }

  // --- HELPERS ---

  private isLanguageObject(
    obj: unknown,
    langCodes: string[],
  ): obj is Record<string, unknown> {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return false;
    }
    const keys = Object.keys(obj);
    if (keys.length === 0) return false;
    return keys.some((key) => langCodes.includes(key));
  }

  private async traverseAndUpdateAllDocuments(
    updateFn: (obj: Record<string, unknown>) => void,
  ) {
    const cursor = this.metadataModel.find({}).cursor();
    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      this.recursiveApply(doc.value, updateFn);
      doc.markModified('value');
      await doc.save();
    }
  }

  private recursiveApply(
    obj: unknown,
    updateFn: (obj: Record<string, unknown>) => void,
  ) {
    if (typeof obj !== 'object' || obj === null) return;
    const currentObj = obj as Record<string, unknown>;
    updateFn(currentObj);

    for (const key in currentObj) {
      if (Object.prototype.hasOwnProperty.call(currentObj, key)) {
        this.recursiveApply(currentObj[key], updateFn);
      }
    }
  }
}
