import React, { useState, useEffect } from "react";
import { HerbItem, ViewTab } from "./types";
import { Navbar } from "./components/Navbar";
import { CatalogTab } from "./components/CatalogTab";
import { AddHerbAiView } from "./components/AddHerbAiView";
import { ComparisonTab } from "./components/ComparisonTab";
import { DrugCheckerTab } from "./components/DrugCheckerTab";
import { RemedyAdvisorTab } from "./components/RemedyAdvisorTab";
import { LocalBackupTab } from "./components/LocalBackupTab";
import { HerbDetailModal } from "./components/HerbDetailModal";
import { BrandLogo } from "./components/BrandLogo";
import {
  auth,
  loginWithGoogle,
  logoutUser,
  testFirestoreConnection,
} from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  syncUserProfile,
  syncFavoritesToCloud,
  saveCustomHerbToCloud,
  subscribeToCloudHerbs,
  subscribeToUserProfile,
} from "./services/firestoreSync";
import {
  loadHerbsFromStorage,
  saveHerbsToStorage,
  loadFavoritesFromStorage,
  saveFavoritesToStorage,
  loadCustomLogo,
  saveCustomLogo,
  resetDatabaseToDefaults,
} from "./utils/storage";
import { enrichHerbWithDetailedExplanation } from "./utils/herbEnricher";

export default function App() {
  const [herbs, setHerbs] = useState<HerbItem[]>(() => loadHerbsFromStorage());
  const [favorites, setFavorites] = useState<(string | number)[]>(() =>
    loadFavoritesFromStorage()
  );
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() =>
    loadCustomLogo()
  );
  const [currentTab, setCurrentTab] = useState<ViewTab>("catalog");
  const [selectedHerbForModal, setSelectedHerbForModal] =
    useState<HerbItem | null>(null);

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Test Firestore Connection on Boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync user profile to Firestore
        syncUserProfile({
          userId: user.uid,
          email: user.email || undefined,
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
          favorites,
        }).catch((err) => console.error("Cloud Profile sync error:", err));
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Real-time Cloud Custom Herbs and Profile when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to cloud custom herbs
    const unsubscribeHerbs = subscribeToCloudHerbs(currentUser.uid, (cloudHerbs) => {
      if (cloudHerbs.length > 0) {
        setHerbs((prev) => {
          const map = new Map<string, HerbItem>();
          // Existing herbs first
          prev.forEach((h) => map.set(String(h.id), h));
          // Cloud herbs take precedence or get appended
          cloudHerbs.forEach((ch) => map.set(String(ch.id), ch));
          const merged = Array.from(map.values());
          saveHerbsToStorage(merged);
          return merged;
        });
      }
    });

    // Subscribe to cloud profile & favorites
    const unsubscribeProfile = subscribeToUserProfile(currentUser.uid, (profile) => {
      if (profile && Array.isArray(profile.favorites) && profile.favorites.length > 0) {
        setFavorites((prev) => {
          const combined = Array.from(new Set([...prev.map(String), ...profile.favorites!.map(String)]));
          saveFavoritesToStorage(combined);
          return combined;
        });
      }
    });

    return () => {
      unsubscribeHerbs();
      unsubscribeProfile();
    };
  }, [currentUser]);

  // Synchronize herbs with localStorage whenever updated
  useEffect(() => {
    saveHerbsToStorage(herbs);
  }, [herbs]);

  // Synchronize favorites with localStorage
  useEffect(() => {
    saveFavoritesToStorage(favorites);
  }, [favorites]);

  // Google Login handler
  const handleLogin = async () => {
    try {
      const res = await loginWithGoogle();
      if (res?.cancelled) {
        return;
      }
    } catch (err: any) {
      if (
        err?.code !== "auth/popup-closed-by-user" &&
        err?.code !== "auth/cancelled-popup-request"
      ) {
        console.warn("Login could not be completed:", err?.message || err);
      }
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err: any) {
      console.warn("Logout error:", err?.message || err);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = (id: string | number) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      if (currentUser) {
        syncFavoritesToCloud(currentUser.uid, next).catch((err) =>
          console.error("Failed to sync favorite to cloud:", err)
        );
      }
      return next;
    });
  };

  // Add new herb generated via AI
  const handleAddHerb = (newHerb: HerbItem) => {
    const enriched = enrichHerbWithDetailedExplanation(newHerb);
    setHerbs((prev) => [enriched, ...prev]);
    if (currentUser) {
      saveCustomHerbToCloud(currentUser.uid, enriched).catch((err) =>
        console.error("Failed to sync custom herb to cloud:", err)
      );
    }
  };

  // Full manual cloud sync trigger
  const handleSyncAllToCloud = async () => {
    if (!currentUser) {
      const res = await loginWithGoogle();
      if (!res || res.cancelled || !res.user) {
        return;
      }
    }
    setIsSyncing(true);
    try {
      // 1. Sync profile & favorites
      await syncUserProfile({
        userId: currentUser.uid,
        email: currentUser.email || undefined,
        displayName: currentUser.displayName || undefined,
        photoURL: currentUser.photoURL || undefined,
        favorites,
      });

      // 2. Sync all custom herbs
      const customHerbs = herbs.filter((h) => h.isCustom);
      for (const herb of customHerbs) {
        await saveCustomHerbToCloud(currentUser.uid, herb);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Restore herbs from imported JSON backup
  const handleRestoreHerbs = (importedHerbs: HerbItem[]) => {
    setHerbs(importedHerbs);
    saveHerbsToStorage(importedHerbs);
  };

  // Reset database back to default 53 herbs
  const handleResetDefaults = () => {
    const defaults = resetDatabaseToDefaults();
    setHerbs(defaults);
  };

  // Custom Logo upload handler
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomLogoUrl(dataUrl);
      saveCustomLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Reset to original Pharaonic brand emblem
  const handleResetLogo = () => {
    setCustomLogoUrl(null);
    saveCustomLogo(null);
  };

  // Print handler
  const handlePrintPage = () => {
    window.print();
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#FBF7EE] text-[#1D2520] font-['Cairo'] flex flex-col selection:bg-[#C59B27] selection:text-[#132B20]"
    >
      {/* Top Header Navbar with Firebase User Integration */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        totalHerbsCount={herbs.length}
        customLogoUrl={customLogoUrl}
        onUploadLogo={handleUploadLogo}
        onResetLogo={handleResetLogo}
        onPrintPage={handlePrintPage}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {currentTab === "catalog" && (
          <CatalogTab
            herbs={herbs}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onOpenDetails={(herb) => setSelectedHerbForModal(herb)}
            onNavigateAddAi={() => setCurrentTab("add-ai")}
            onAddToCompare={(herb) => {
              setCurrentTab("comparison");
            }}
            customLogoUrl={customLogoUrl}
          />
        )}

        {currentTab === "add-ai" && (
          <AddHerbAiView
            onAddHerb={handleAddHerb}
            existingCount={herbs.length}
            existingHerbs={herbs}
          />
        )}

        {currentTab === "comparison" && (
          <ComparisonTab herbs={herbs} customLogoUrl={customLogoUrl} />
        )}

        {currentTab === "checker" && (
          <DrugCheckerTab herbs={herbs} customLogoUrl={customLogoUrl} />
        )}

        {currentTab === "advisor" && (
          <RemedyAdvisorTab customLogoUrl={customLogoUrl} />
        )}

        {currentTab === "backup" && (
          <LocalBackupTab
            herbs={herbs}
            favoritesCount={favorites.length}
            onRestoreHerbs={handleRestoreHerbs}
            onResetDefaults={handleResetDefaults}
            currentUser={currentUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onSyncToCloud={handleSyncAllToCloud}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Herb Detail Modal */}
      {selectedHerbForModal && (
        <HerbDetailModal
          herb={selectedHerbForModal}
          onClose={() => setSelectedHerbForModal(null)}
          customLogoUrl={customLogoUrl}
        />
      )}

      {/* Footer with Egyptian Botanical Brand Identity */}
      <footer className="bg-[#132B20] text-[#FBF7EE] border-t-2 border-[#C59B27] py-8 px-4 mt-12 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-right">
            <div className="bg-[#0C1B14] p-2 rounded-2xl border border-[#C59B27]/40 shadow-inner">
              <BrandLogo size="sm" showSubtitle={false} customLogoUrl={customLogoUrl} />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-lg font-black font-['Cairo'] text-[#FBF7EE]">
                  1000 عشبة
                </span>
                <span className="text-xs font-bold text-[#F5DC7D] font-['Amiri']">
                  جُمعت لأجلك
                </span>
              </div>
              <p className="text-xs text-[#E2D6B5]/75 font-medium mt-0.5">
                الصيدلية النباتية الذكية الموثقة • مزامنة سحابية هجينة مع Firebase Firestore
              </p>
            </div>
          </div>

          <div className="text-center md:text-left text-xs text-[#E2D6B5]/80 space-y-1">
            <p className="font-['Amiri'] text-sm text-[#F5DC7D]">
              «من نباتات الأرض يستخرج الحكيم شفاؤه»
            </p>
            <p className="text-[11px] text-[#A69772]">
              جميع الحقوق محفوظة © {new Date().getFullYear()} • تطبيق 1000 عشبة
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

