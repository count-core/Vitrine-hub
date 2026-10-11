import { relations } from 'drizzle-orm'
import { album, capture, collection, collectionMember, inquiry, invite, item, itemImage, priceObservation } from './schema'

export const collectionRelations = relations(collection, ({ many }) => ({ items: many(item), albums: many(album), inquiries: many(inquiry), members: many(collectionMember), invites: many(invite) }))
export const collectionMemberRelations = relations(collectionMember, ({ one }) => ({ collection: one(collection, { fields: [collectionMember.collectionId], references: [collection.id] }) }))
export const inviteRelations = relations(invite, ({ one }) => ({ collection: one(collection, { fields: [invite.collectionId], references: [collection.id] }) }))
export const inquiryRelations = relations(inquiry, ({ one }) => ({ collection: one(collection, { fields: [inquiry.collectionId], references: [collection.id] }), item: one(item, { fields: [inquiry.itemId], references: [item.id] }) }))
export const albumRelations = relations(album, ({ one, many }) => ({ collection: one(collection, { fields: [album.collectionId], references: [collection.id] }), items: many(item) }))
export const itemRelations = relations(item, ({ one, many }) => ({
  collection: one(collection, { fields: [item.collectionId], references: [collection.id] }),
  album: one(album, { fields: [item.albumId], references: [album.id] }),
  capture: one(capture, { fields: [item.captureId], references: [capture.id] }),
  images: many(itemImage),
  prices: many(priceObservation),
}))
export const priceObservationRelations = relations(priceObservation, ({ one }) => ({ item: one(item, { fields: [priceObservation.itemId], references: [item.id] }) }))
export const itemImageRelations = relations(itemImage, ({ one }) => ({ item: one(item, { fields: [itemImage.itemId], references: [item.id] }) }))
