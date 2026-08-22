import { SITE_NAME } from '@/config/site'

export const enUi = {
  common: {
    appName: SITE_NAME, toggleTheme: 'Toggle theme', language: 'Language',
    search: 'Search', searchPlaceholder: 'Search products, guides, projects…',
    searchStart: 'Type a keyword to start searching', searchNone: 'No matches found',
    searchResultsTitle: 'Search', searchResultsFor: 'Results for "{query}"', searchResultsEmpty: 'No results found. Try a different keyword.',
    typeSolution: 'Solution', typeGuide: 'Guide', typeProject: 'Project', typePage: 'Page',
    loading: 'Loading…', error: 'Something went wrong', back: 'Back', close: 'Close',
    readMore: 'Read more', viewAll: 'View all', learnMore: 'Learn more',
    noResults: 'No results', tryAgain: 'Try again',
    scrollToTop: 'Scroll to top', menu: 'Menu', skipToContent: 'Skip to content',
  },
  nav: {
    home: 'Home', products: 'Products', solutions: 'Solutions',
    about: 'About', contact: 'Contact', faq: 'FAQ',
    factory: 'Factory', quality: 'Quality',
  },
  footer: {
    tagline: 'Your brand tagline.',
    privacy: 'Privacy Policy', terms: 'Terms of Service',
    contact: 'Contact Us', sitemap: 'Sitemap',
  },
  hero: {
    cta: 'Get a Quote', ctaSecondary: 'View Products',
  },
  cta: {
    quote: 'Request a Quote', sample: 'Request Samples', catalog: 'Download Catalog',
  },
  form: {
    name: 'Name', email: 'Email', company: 'Company',
    message: 'Message', submit: 'Send', country: 'Country', phone: 'Phone',
  },
  product: {
    moq: 'MOQ', leadTime: 'Lead Time', sample: 'Sample',
    certification: 'Certification', oemOdm: 'OEM/ODM',
    factory: 'Factory', quality: 'Quality', capacity: 'Capacity',
    material: 'Material', specifications: 'Specifications',
  },
} as const

export type UiDict = typeof enUi
