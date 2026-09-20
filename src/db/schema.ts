import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Define the 'users' table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email"),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define the 'herbs' table
export const herbs = pgTable("herbs", {
  id: serial("id").primaryKey(),
  customId: text("custom_id").notNull(),
  userUid: text("user_uid").references(() => users.uid),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  scientific: text("scientific").notNull(),
  family: text("family"),
  system: text("system"),
  target: text("target"),
  active: text("active"),
  dose: text("dose"),
  preparation: text("preparation"),
  safety: text("safety"),
  safetyLevel: text("safety_level"),
  contraindications: text("contraindications"),
  interactions: text("interactions"),
  historicalNote: text("historical_note"),
  references: text("references"),
  isCustom: boolean("is_custom").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define the 'favorites' table
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userUid: text("user_uid").references(() => users.uid),
  herbId: text("herb_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
