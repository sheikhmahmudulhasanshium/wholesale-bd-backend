import { Media } from '../schemas/media.schema';

/**
 * Defines the structure for a single category within the grouped overview.
 * The arrays contain plain objects matching the Media schema, not full Mongoose documents.
 */
export interface GroupedCategory {
  photos: Media[];
  files: Media[];
  links: Media[];
}

/**
 * Defines the final structure of the grouped overview response.
 * The keys will be entity names like 'product', 'user', etc.
 */
export interface GroupedResult {
  [key: string]: GroupedCategory;
}
