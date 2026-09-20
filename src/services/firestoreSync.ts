import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  Unsubscribe,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { HerbItem } from "../types";

export interface UserCloudProfile {
  userId: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  favorites?: (string | number)[];
  updatedAt?: string;
}

export async function syncUserProfile(profile: UserCloudProfile): Promise<void> {
  const path = `users/${profile.userId}`;
  try {
    const docRef = doc(db, "users", profile.userId);
    await setDoc(
      docRef,
      {
        userId: profile.userId,
        ...(profile.email && { email: profile.email.slice(0, 200) }),
        ...(profile.displayName && { displayName: profile.displayName.slice(0, 150) }),
        ...(profile.photoURL && { photoURL: profile.photoURL.slice(0, 500) }),
        ...(profile.favorites && {
          favorites: profile.favorites.slice(0, 1000).map(String),
        }),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncFavoritesToCloud(
  userId: string,
  favorites: (string | number)[]
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, "users", userId);
    await setDoc(
      docRef,
      {
        userId,
        favorites: favorites.slice(0, 1000).map(String),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveCustomHerbToCloud(
  userId: string,
  herb: HerbItem
): Promise<void> {
  const herbId = String(herb.id);
  const path = `users/${userId}/custom_herbs/${herbId}`;
  try {
    const docRef = doc(db, "users", userId, "custom_herbs", herbId);
    await setDoc(docRef, {
      id: herbId,
      nameAr: herb.nameAr.slice(0, 150),
      scientific: herb.scientific.slice(0, 150),
      userId,
      ...(herb.nameEn && { nameEn: herb.nameEn.slice(0, 150) }),
      ...(herb.family && { family: herb.family.slice(0, 100) }),
      ...(herb.system && { system: herb.system.slice(0, 100) }),
      ...(herb.target && { target: herb.target.slice(0, 300) }),
      ...(herb.active && { active: herb.active.slice(0, 500) }),
      ...(herb.dose && { dose: herb.dose.slice(0, 300) }),
      ...(herb.preparation && { preparation: herb.preparation.slice(0, 600) }),
      ...(herb.safety && { safety: herb.safety.slice(0, 600) }),
      ...(herb.safetyLevel && { safetyLevel: herb.safetyLevel.slice(0, 100) }),
      ...(herb.contraindications && {
        contraindications: herb.contraindications.slice(0, 600),
      }),
      ...(herb.interactions && {
        interactions: herb.interactions.slice(0, 600),
      }),
      ...(herb.historicalNote && {
        historicalNote: herb.historicalNote.slice(0, 1500),
      }),
      ...(herb.references && { references: herb.references.slice(0, 1500) }),
      ...(herb.description && { description: herb.description.slice(0, 4000) }),
      ...(herb.pharmacology && { pharmacology: herb.pharmacology.slice(0, 4000) }),
      ...(herb.benefits && {
        benefits: herb.benefits.slice(0, 50).map((b) => b.slice(0, 300)),
      }),
      isCustom: true,
      createdAt: herb.addedAt || new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeCustomHerbFromCloud(
  userId: string,
  herbId: string | number
): Promise<void> {
  const path = `users/${userId}/custom_herbs/${herbId}`;
  try {
    const docRef = doc(db, "users", userId, "custom_herbs", String(herbId));
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToCloudHerbs(
  userId: string,
  onHerbsUpdate: (herbs: HerbItem[]) => void
): Unsubscribe {
  const path = `users/${userId}/custom_herbs`;
  const colRef = collection(db, "users", userId, "custom_herbs");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: HerbItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: d.id,
          nameAr: d.nameAr,
          nameEn: d.nameEn || "",
          scientific: d.scientific,
          family: d.family || "",
          system: d.system || "",
          target: d.target || "",
          active: d.active || "",
          dose: d.dose || "",
          preparation: d.preparation || "",
          safety: d.safety || "",
          safetyLevel: d.safetyLevel || "",
          contraindications: d.contraindications || "",
          interactions: d.interactions || "",
          historicalNote: d.historicalNote || "",
          references: d.references || "",
          isCustom: true,
          addedAt: d.createdAt || "",
        });
      });
      onHerbsUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToUserProfile(
  userId: string,
  onProfileUpdate: (profile: UserCloudProfile | null) => void
): Unsubscribe {
  const path = `users/${userId}`;
  const docRef = doc(db, "users", userId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onProfileUpdate(snapshot.data() as UserCloudProfile);
      } else {
        onProfileUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
