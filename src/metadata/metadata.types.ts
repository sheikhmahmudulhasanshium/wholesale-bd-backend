// src/metadata/metadata.types.ts

// These interfaces define the shape of our data, providing a strong type contract.

interface I18nString {
  [key: string]: string;
}

interface IAsset {
  name: string;
  url: string;
  type: string;
  width: number;
  height: number;
  alt?: I18nString;
}

interface ILink {
  label: I18nString;
  url: string;
  icon?: string;
}

interface ICustomButton extends ILink {
  id: string;
  variant?: string;
}

interface IPageNavigation {
  headerLinks?: ILink[];
  footerLinks?: ILink[];
  sidebarLinks?: ILink[];
  customButtons?: ICustomButton[];
}

interface IPageMeta {
  title: I18nString;
  description: I18nString;
}

interface IPageItem {
  id: string;
  name: string;
  path: string;
  accessType: 'public' | 'protected' | 'private' | 'admin';
  meta: IPageMeta;
  navigation: IPageNavigation;
}

// Top-level module interfaces
interface IBrand {
  status: 'configured' | 'pending';
  brandName?: string;
  brandSlogan?: I18nString;
  brandSymbol?: IAsset[];
  brandLogo?: IAsset[];
  favicon?: IAsset[];
}

interface II18nConfig {
  status: 'configured' | 'pending';
  availableLanguages?: { code: string; name: string }[];
  defaultLanguage?: string;
}

interface IPages {
  status: 'configured' | 'pending';
  items: IPageItem[];
}

// The main interface for the entire metadata document
export interface IMetadata {
  brand: IBrand;
  i18n: II18nConfig;
  pages: IPages;
  // Add other modules like theme, social, etc., as you define them
  [key: string]: any; // Allows for other dynamic modules
}
