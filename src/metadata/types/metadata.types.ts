// Represents a language entry in the global configuration.
export interface ILanguage {
  code: string;
  name: string;
}

// Represents an object where keys are language codes (e.g., "en-US")
// and values are the translated strings.
export type TMultilingual<T> = Record<string, T>;

// Defines the structure of the 'value' field for the 'globalConfig' document.
export interface IGlobalConfigValue {
  siteName: string;
  defaultLanguage: string;
  availableLanguages: ILanguage[];
  brand: {
    officialName: string;
    tagline: TMultilingual<{ sm: string; md: string; lg: string }>;
    logos: Array<{
      useCase: string;
      path: string;
      alt: TMultilingual<string>;
    }>;
  };
}

// Defines the structure for a generic metadata document stored in the database.
// The `value` can be of a known type or a generic object for pageMeta etc.
export interface IMetadata<T = Record<string, unknown>> {
  key: string;
  value: T;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
