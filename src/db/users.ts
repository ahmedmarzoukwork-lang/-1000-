import { db } from "./index.ts";
import { users, herbs, favorites } from "./schema.ts";
import { eq } from "drizzle-orm";

export async function getOrCreateUser(uid: string, email?: string, displayName?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid));
    if (existing.length > 0) {
      return existing[0];
    }
    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: email || null,
        displayName: displayName || null,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error("Database user sync failed:", error);
    throw new Error("Database user operation failed.", { cause: error });
  }
}

export async function getUserHerbs(userUid: string) {
  try {
    return await db.select().from(herbs).where(eq(herbs.userUid, userUid));
  } catch (error) {
    console.error("Database getUserHerbs failed:", error);
    throw new Error("Database query failed.", { cause: error });
  }
}

export async function saveHerbToSql(herbData: {
  customId: string;
  userUid?: string;
  nameAr: string;
  nameEn?: string;
  scientific: string;
  family?: string;
  system?: string;
  target?: string;
  active?: string;
  dose?: string;
  preparation?: string;
  safety?: string;
  safetyLevel?: string;
  contraindications?: string;
  interactions?: string;
  historicalNote?: string;
  references?: string;
}) {
  try {
    const inserted = await db
      .insert(herbs)
      .values({
        customId: herbData.customId,
        userUid: herbData.userUid || null,
        nameAr: herbData.nameAr,
        nameEn: herbData.nameEn || null,
        scientific: herbData.scientific,
        family: herbData.family || null,
        system: herbData.system || null,
        target: herbData.target || null,
        active: herbData.active || null,
        dose: herbData.dose || null,
        preparation: herbData.preparation || null,
        safety: herbData.safety || null,
        safetyLevel: herbData.safetyLevel || null,
        contraindications: herbData.contraindications || null,
        interactions: herbData.interactions || null,
        historicalNote: herbData.historicalNote || null,
        references: herbData.references || null,
        isCustom: true,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error("Database saveHerbToSql failed:", error);
    throw new Error("Database insert failed.", { cause: error });
  }
}
