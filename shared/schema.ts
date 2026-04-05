import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";




export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  salt: text("salt").notNull(),
  // Keypair used to protect transfer keys (so there's no global/master secret for transfers).
  // Private key is encrypted at rest with a key derived from the user's password.
  keyPublic: text("key_public"),
  keyPrivateEncrypted: text("key_private_encrypted"),
  keySalt: text("key_salt"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActive: timestamp("last_active"),
});


export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id), // Nullable for migration support
});

export const customCardTypes = pgTable("custom_card_types", {
  id: serial("id").primaryKey(),
  // If userId is null, it's a global default type. If set, it's user-specific.
  userId: integer("user_id").references(() => users.id),
  slug: text("slug").notNull(), // Removed unique constraint to allow per-user duplicates if needed, or composite unique
  label: text("label").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull(),
  type: text("type").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name"),
  title: text("title"),
  documentNumber: text("document_number"),
  documentName: text("document_name"),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const cryptoWallets = pgTable("crypto_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  walletName: text("wallet_name").notNull(),
  seedPhrase: text("seed_phrase").notNull(), // Encrypted string
  wordCount: integer("word_count").notNull(), // 12 or 24
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const transferRequests = pgTable("transfer_requests", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // pending | rejected | completed | failed
  transferKeyWrapped: text("transfer_key_wrapped").notNull(), // base64(RSA-OAEP(transferKey, receiverPublicKey))
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
});

export const peopleRelations = relations(people, ({ many }) => ({
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
  person: one(people, {
    fields: [cards.personId],
    references: [people.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPersonSchema = createInsertSchema(people).omit({ id: true });
export const insertCardSchema = createInsertSchema(cards).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Person = typeof people.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;


export const insertCustomCardTypeSchema = createInsertSchema(customCardTypes).omit({ id: true });
export type CustomCardType = typeof customCardTypes.$inferSelect;
export type InsertCustomCardType = z.infer<typeof insertCustomCardTypeSchema>;

export const insertCryptoWalletSchema = createInsertSchema(cryptoWallets).omit({ id: true, createdAt: true });
export type CryptoWallet = typeof cryptoWallets.$inferSelect;
export type InsertCryptoWallet = z.infer<typeof insertCryptoWalletSchema>;

export type PersonWithCards = Person & { cards: Card[] };
