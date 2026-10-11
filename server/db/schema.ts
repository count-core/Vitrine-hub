import { sql } from 'drizzle-orm'
import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

/* ---------- Better Auth ---------- */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, t => [index('session_user_idx').on(t.userId)])

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, t => [index('account_user_idx').on(t.userId)])

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, t => [index('verification_identifier_idx').on(t.identifier)])

/* ---------- Sammlung ---------- */
export const visibilityEnum = pgEnum('visibility', ['private', 'link', 'public'])
export const itemTypeEnum = pgEnum('item_type', ['stamp', 'block', 'booklet', 'cover', 'coin', 'stamp_set', 'coin_set', 'banknote'])
export const conditionEnum = pgEnum('condition', ['mnh', 'hinged', 'no_gum', 'used', 'unknown'])
export const itemStatusEnum = pgEnum('item_status', ['collection', 'duplicate', 'for_sale', 'sold', 'wanted'])
export const itemVisibilityEnum = pgEnum('item_visibility', ['inherit', 'hidden'])

export const collection = pgTable('collection', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  slug: text('slug').unique(),
  publicTitle: text('public_title').notNull().default(''),
  publicIntro: text('public_intro').notNull().default(''),
  publicName: text('public_name').notNull().default(''),
  showWanted: boolean('show_wanted').notNull().default(true),
  allowInquiries: boolean('allow_inquiries').notNull().default(true),
  // Eigener KI-Anbieter der Sammlung, leer = Server-Standard aus der .env
  aiProvider: text('ai_provider').notNull().default(''),
  aiModel: text('ai_model').notNull().default(''),
  aiApiKeyEnc: text('ai_api_key_enc').notNull().default(''),
  aiBaseUrl: text('ai_base_url').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => [index('collection_owner_idx').on(t.ownerId)])

export const album = pgTable('album', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  collectionId: text('collection_id').notNull().references(() => collection.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(),
  name: text('name').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => [uniqueIndex('album_collection_number_idx').on(t.collectionId, t.number)])

export const capture = pgTable('capture', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  collectionId: text('collection_id').notNull().references(() => collection.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  fileKey: text('file_key').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  provider: text('provider'),
  model: text('model'),
  result: jsonb('result'),
  error: text('error'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => [index('capture_collection_idx').on(t.collectionId)])

export const item = pgTable('item', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  collectionId: text('collection_id').notNull().references(() => collection.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  albumId: text('album_id').references(() => album.id, { onDelete: 'set null' }),
  sheet: integer('sheet'),
  position: integer('position'),
  type: itemTypeEnum('type').notNull().default('stamp'),
  area: text('area').notNull().default(''),
  country: text('country').notNull().default(''),
  year: integer('year'),
  michelNo: text('michel_no').notNull().default(''),
  faceValue: text('face_value').notNull().default(''),
  motif: text('motif').notNull().default(''),
  color: text('color').notNull().default(''),
  series: text('series').notNull().default(''),
  grade: text('grade').notNull().default(''),
  material: text('material').notNull().default(''),
  mint: text('mint').notNull().default(''),
  diameterMm: numeric('diameter_mm', { precision: 6, scale: 2 }),
  weightG: numeric('weight_g', { precision: 8, scale: 3 }),
  condition: conditionEnum('condition').notNull().default('unknown'),
  quantity: integer('quantity').notNull().default(1),
  status: itemStatusEnum('status').notNull().default('collection'),
  publicNote: text('public_note').notNull().default(''),
  visibility: itemVisibilityEnum('visibility').notNull().default('inherit'),
  // privat
  catalogValue: numeric('catalog_value', { precision: 12, scale: 2 }),
  estValue: numeric('est_value', { precision: 12, scale: 2 }),
  privateNote: text('private_note').notNull().default(''),
  wantedMaxPrice: numeric('wanted_max_price', { precision: 12, scale: 2 }),
  // KI
  aiConfidence: numeric('ai_confidence', { precision: 4, scale: 3 }),
  aiSuggestion: jsonb('ai_suggestion'),
  captureId: text('capture_id').references(() => capture.id, { onDelete: 'set null' }),
  box: jsonb('box'),
  reviewedAt: timestamp('reviewed_at'),
  // Suche
  searchText: text('search_text').generatedAlwaysAs(sql`lower(coalesce(michel_no,'') || ' ' || coalesce(motif,'') || ' ' || coalesce(area,'') || ' ' || coalesce(country,'') || ' ' || coalesce(year::text,'') || ' ' || coalesce(face_value,'') || ' ' || coalesce(series,'') || ' ' || coalesce(grade,'') || ' ' || coalesce(mint,'') || ' ' || coalesce(material,'') || ' ' || coalesce(public_note,'') || ' ' || coalesce(private_note,''))`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, t => [
  index('item_collection_idx').on(t.collectionId),
  index('item_album_sheet_idx').on(t.albumId, t.sheet, t.position),
  index('item_search_trgm_idx').using('gin', sql`${t.searchText} gin_trgm_ops`),
])

export const itemImage = pgTable('item_image', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  itemId: text('item_id').notNull().references(() => item.id, { onDelete: 'cascade' }),
  fileKey: text('file_key').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => [index('item_image_item_idx').on(t.itemId)])

export const priceKindEnum = pgEnum('price_kind', ['observed', 'ai_estimate', 'catalog', 'sold'])

export const priceObservation = pgTable('price_observation', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  itemId: text('item_id').notNull().references(() => item.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  kind: priceKindEnum('kind').notNull().default('observed'),
  source: text('source').notNull().default(''),
  price: numeric('price', { precision: 12, scale: 2 }),
  priceMax: numeric('price_max', { precision: 12, scale: 2 }),
  currency: text('currency').notNull().default('EUR'),
  condition: conditionEnum('condition'),
  observedAt: timestamp('observed_at').notNull().defaultNow(),
  url: text('url').notNull().default(''),
  note: text('note').notNull().default(''),
  confidence: numeric('confidence', { precision: 4, scale: 3 }),
  aiRaw: jsonb('ai_raw'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => [index('price_observation_item_idx').on(t.itemId), index('price_observation_owner_idx').on(t.ownerId)])

export const inquiry = pgTable('inquiry', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  collectionId: text('collection_id').notNull().references(() => collection.id, { onDelete: 'cascade' }),
  itemId: text('item_id').references(() => item.id, { onDelete: 'set null' }),
  kind: text('kind').notNull().default('question'),
  name: text('name').notNull().default(''),
  email: text('email').notNull().default(''),
  message: text('message').notNull().default(''),
  offerPrice: numeric('offer_price', { precision: 12, scale: 2 }),
  readAt: timestamp('read_at'),
  ip: text('ip').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => [index('inquiry_collection_idx').on(t.collectionId), index('inquiry_created_idx').on(t.createdAt)])

export const memberRoleEnum = pgEnum('member_role', ['owner', 'editor', 'viewer'])

export const collectionMember = pgTable('collection_member', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  collectionId: text('collection_id').notNull().references(() => collection.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').notNull().default('viewer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => [uniqueIndex('collection_member_unique').on(t.collectionId, t.userId)])

export const invite = pgTable('invite', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  collectionId: text('collection_id').notNull().references(() => collection.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  role: memberRoleEnum('role').notNull().default('viewer'),
  label: text('label').notNull().default(''),
  expiresAt: timestamp('expires_at').notNull(),
  usedBy: text('used_by').references(() => user.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Inquiry = typeof inquiry.$inferSelect
export type PriceObservation = typeof priceObservation.$inferSelect
export type Item = typeof item.$inferSelect
export type NewItem = typeof item.$inferInsert
export type Album = typeof album.$inferSelect
export type ItemImage = typeof itemImage.$inferSelect
export type Capture = typeof capture.$inferSelect
