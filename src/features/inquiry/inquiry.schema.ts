import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/** B2B project inquiries submitted via the /contact form. */
export const inquiry = sqliteTable('inquiry', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company').notNull().default(''),
  website: text('website').notNull().default(''),
  country: text('country').notNull().default(''),
  email: text('email').notNull(),
  whatsapp: text('whatsapp').notNull().default(''),
  businessType: text('business_type').notNull().default('other'), // InquiryBusinessType
  quantity: text('quantity').notNull().default('unsure'),         // InquiryQuantity
  category: text('product_type').notNull().default('unsure'),   // InquiryCategory (DB column kept as product_type)
  model: text('model').notNull().default('unsure'),               // legacy — the RFQ pipeline no longer writes this; kept for historical rows
  timeline: text('timeline').notNull().default('now'),            // InquiryTimeline
  targetMarket: text('target_market').notNull().default(''),      // free-text sales market
  projectStage: text('project_stage').notNull().default(''),      // InquiryProjectStage
  role: text('role').notNull().default(''),                       // InquiryRole
  boardPlatform: text('board_platform').notNull().default(''),    // preferred platform / size
  construction: text('construction').notNull().default(''),       // InquiryConstruction
  customization: text('customization').notNull().default(''),     // comma list, InquiryCustomization
  packaging: text('packaging').notNull().default(''),             // InquiryPackaging
  compliance: text('compliance').notNull().default(''),           // InquiryCompliance
  docs: text('docs').notNull().default(''),                       // comma list, InquiryDocs
  annualVolume: text('annual_volume').notNull().default(''),      // InquiryAnnualVolume
  budget: text('budget').notNull().default(''),                   // target retail/ex-works position
  nda: text('nda').notNull().default('no'),                       // InquiryNda
  consent: text('consent').notNull().default(''),                 // 'yes' when given
  score: integer('score').notNull().default(0),                   // lead score
  tier: text('tier').notNull().default('C'),                      // InquiryTier
  requirements: text('requirements').notNull().default(''),
  logoKey: text('logo_key'),                                       // R2 object key (inquiry-files/... or legacy inquiry-logos/...)
  status: text('status').notNull().default('new'),                 // InquiryStatus
  locale: text('locale').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export type Inquiry = typeof inquiry.$inferSelect
