import { HerbItem } from "../types";
import { INITIAL_HERBS } from "../data/initialHerbs";
import { enrichHerbsList } from "./herbEnricher";

const STORAGE_KEY_HERBS = "1000_herbs_pharmacy_catalog_v1";
const STORAGE_KEY_FAVORITES = "1000_herbs_favorites_v1";
const STORAGE_KEY_CUSTOM_LOGO = "1000_herbs_custom_logo_v1";

export function loadHerbsFromStorage(): HerbItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HERBS);
    if (!raw) {
      // First run: Seed with the 53 clinical herbs
      const enrichedInitial = enrichHerbsList(INITIAL_HERBS);
      localStorage.setItem(STORAGE_KEY_HERBS, JSON.stringify(enrichedInitial));
      return enrichedInitial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all loaded herbs have rich descriptions
      const enriched = enrichHerbsList(parsed);
      return enriched;
    }
    const enrichedInitial = enrichHerbsList(INITIAL_HERBS);
    return enrichedInitial;
  } catch (err) {
    console.error("Failed to load herbs from localStorage:", err);
    return enrichHerbsList(INITIAL_HERBS);
  }
}

export function saveHerbsToStorage(herbs: HerbItem[]): void {
  try {
    const enriched = enrichHerbsList(herbs);
    localStorage.setItem(STORAGE_KEY_HERBS, JSON.stringify(enriched));
  } catch (err) {
    console.error("Failed to save herbs to localStorage:", err);
  }
}

export function resetDatabaseToDefaults(): HerbItem[] {
  const enrichedInitial = enrichHerbsList(INITIAL_HERBS);
  localStorage.setItem(STORAGE_KEY_HERBS, JSON.stringify(enrichedInitial));
  return enrichedInitial;
}

export function loadFavoritesFromStorage(): (string | number)[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavoritesToStorage(favorites: (string | number)[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
  } catch (err) {
    console.error("Failed to save favorites:", err);
  }
}

export function loadCustomLogo(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_CUSTOM_LOGO);
  } catch {
    return null;
  }
}

export function saveCustomLogo(dataUrl: string | null): void {
  try {
    if (dataUrl) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_LOGO, dataUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_LOGO);
    }
  } catch (err) {
    console.error("Failed to save custom logo:", err);
  }
}

export function exportDatabaseAsJsonFile(herbs: HerbItem[]): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(herbs, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `1000-herbs-database-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
