/**
 * The initial data to seed the database with.
 * This ensures the application has a valid starting configuration.
 */
export const SEED_DATA = [
  {
    key: 'globalConfig',
    description: 'Global site configuration, cached long-term on clients.',
    value: {
      siteName: 'Wholesale BD',
      defaultLanguage: 'en-US',
      availableLanguages: [
        { code: 'en-US', name: 'English' },
        { code: 'bn-BD', name: 'বাংলা' },
        { code: 'es-ES', name: 'Español' },
      ],
      brand: {
        officialName: 'Wholesale Bangladesh Ltd.',
        tagline: {
          'en-US': {
            sm: 'B2B Wholesale Platform',
            md: 'The Premier B2B Wholesale Platform',
            lg: 'The Premier B2B Wholesale Platform in Bangladesh',
          },
          'bn-BD': {
            sm: 'B2B পাইকারি প্ল্যাটফর্ম',
            md: 'প্রিমিয়ার B2B পাইকারি প্ল্যাটফর্ম',
            lg: 'বাংলাদেশের প্রিমিয়ার B2B পাইকারি প্ল্যাটফর্ম',
          },
        },
        logos: [
          {
            useCase: 'Primary Logo Light',
            path: '/assets/logos/logo-light.svg',
            alt: {
              'en-US': 'Wholesale BD Official Logo',
              'bn-BD': 'হোলসেল বিডি অফিসিয়াল লোগো',
            },
          },
          {
            useCase: 'Favicon',
            path: '/favicon.ico',
            alt: {
              'en-US': 'Wholesale BD Icon',
              'bn-BD': 'হোলসেল বিডি আইকন',
            },
          },
        ],
      },
    },
  },
  {
    key: 'layoutConfig',
    description: 'Data for the main UI layout, cached long-term on clients.',
    value: {
      navigation: {
        headerNav: [
          {
            id: 'nav-home',
            path: '/',
            label: { 'en-US': 'Home', 'bn-BD': 'হোম' },
            icon: 'Home',
          },
        ],
        footerLinkGroups: [
          {
            title: { 'en-US': 'Company', 'bn-BD': 'কোম্পানি' },
            links: [
              {
                id: 'footer-about',
                path: '/about',
                label: {
                  'en-US': { lg: 'About Us', md: 'About', sm: 'ℹ️' },
                  'bn-BD': {
                    lg: 'আমাদের সম্পর্কে',
                    md: 'সম্পর্কে',
                    sm: 'ℹ️',
                  },
                },
              },
            ],
          },
        ],
      },
      footer: {
        description: {
          'en-US': {
            sm: 'Your B2B destination.',
            lg: 'Your one-stop destination for bulk purchasing and seamless B2B connections across Bangladesh.',
          },
          'bn-BD': {
            sm: 'আপনার B2B গন্তব্য।',
            lg: 'বাংলাদেশ জুড়ে বাল্ক ক্রয় এবং নির্বিঘ্ন B2B সংযোগের জন্য আপনার ওয়ান-স্টপ গন্তব্য।',
          },
        },
        socialLinks: [
          {
            platform: 'Facebook',
            url: 'https://facebook.com/wholesalebd',
            icon: 'Facebook',
          },
        ],
        copyright: {
          'en-US': '© {currentYear} Wholesale BD Ltd. All rights reserved.',
          'bn-BD': '© {currentYear} হোলসেল বিডি লিমিটেড। সর্বস্বত্ব সংরক্ষিত।',
        },
      },
    },
  },
  {
    key: 'pageMeta:/profile/:profileId',
    description: 'SEO metadata for dynamic user profile pages.',
    value: {
      titleTemplate: {
        'en-US': "{profileName}'s Profile | Wholesale BD",
        'bn-BD': '{profileName}-এর প্রোফাইল | হোলসেল বিডি',
      },
      descriptionTemplate: {
        'en-US':
          'View the public business profile for {profileName} on Wholesale BD.',
        'bn-BD':
          'হোলসেল বিডি-তে {profileName}-এর পাবলিক ব্যবসায়িক প্রোফাইল দেখুন।',
      },
    },
  },
];
