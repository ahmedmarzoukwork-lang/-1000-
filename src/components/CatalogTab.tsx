import React, { useState, useMemo } from "react";
import { HerbItem } from "../types";
import { HerbCard } from "./HerbCard";
import {
  Search,
  Filter,
  Sparkles,
  Heart,
  Printer,
  Image as ImageIcon,
  CheckCircle,
  X,
  BookOpen,
  Bell,
} from "lucide-react";
import { exportElementAsPng } from "../utils/exportUtils";
import { BrandLogo } from "./BrandLogo";
import { ScientificSourcesFooter } from "./ScientificSourcesFooter";

interface CatalogTabProps {
  herbs: HerbItem[];
  favorites: (string | number)[];
  onToggleFavorite: (id: string | number) => void;
  onOpenDetails: (herb: HerbItem) => void;
  onNavigateAddAi: () => void;
  onAddToCompare: (herb: HerbItem) => void;
  customLogoUrl: string | null;
  onOpenReminder?: (herbId?: string | number) => void;
  remindersHerbIds?: (string | number)[];
  activeRemindersCount?: number;
}

const SYSTEM_CATEGORIES = [
  "جميع الأجهزة",
  "المناعة",
  "الهضم والكبد",
  "الأعصاب والتكيف",
  "التنفس والقلب",
  "الهرمونات والصحة العامة",
  "المفاصل والكلى",
  "مغذية ووقائية",
];

export const CatalogTab: React.FC<CatalogTabProps> = ({
  herbs,
  favorites,
  onToggleFavorite,
  onOpenDetails,
  onNavigateAddAi,
  onAddToCompare,
  customLogoUrl,
  onOpenReminder,
  remindersHerbIds,
  activeRemindersCount,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSystem, setSelectedSystem] = useState("جميع الأجهزة");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [safetyFilter, setSafetyFilter] = useState("الكل");
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const filteredHerbs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return herbs.filter((h) => {
      // Search
      const matchesSearch =
        !q ||
        h.nameAr.toLowerCase().includes(q) ||
        h.nameEn.toLowerCase().includes(q) ||
        h.scientific.toLowerCase().includes(q) ||
        h.target.toLowerCase().includes(q) ||
        h.active.toLowerCase().includes(q) ||
        (h.description && h.description.toLowerCase().includes(q)) ||
        (h.pharmacology && h.pharmacology.toLowerCase().includes(q)) ||
        (h.historicalNote && h.historicalNote.toLowerCase().includes(q));

      // System
      const matchesSystem =
        selectedSystem === "جميع الأجهزة" ||
        h.system === selectedSystem ||
        (selectedSystem === "الهضم والكبد" && h.system.includes("الهضم")) ||
        (selectedSystem === "الأعصاب والتكيف" && h.system.includes("الأعصاب")) ||
        (selectedSystem === "الهرمونات والصحة العامة" && h.system.includes("الهرمون")) ||
        (selectedSystem === "المفاصل والكلى" && h.system.includes("المفاصل"));

      // Favorites
      const matchesFav = !onlyFavorites || favorites.includes(h.id);

      // Safety
      const matchesSafety =
        safetyFilter === "الكل" ||
        (safetyFilter === "آمن" && (!h.safetyLevel || h.safetyLevel.includes("آمن"))) ||
        (safetyFilter === "حذر" && h.safetyLevel && h.safetyLevel.includes("حذر")) ||
        (safetyFilter === "إشراف" && h.safetyLevel && h.safetyLevel.includes("إشراف"));

      return matchesSearch && matchesSystem && matchesFav && matchesSafety;
    });
  }, [herbs, searchQuery, selectedSystem, onlyFavorites, safetyFilter, favorites]);

  const handleExportCatalogPng = async () => {
    setIsExportingPng(true);
    const ok = await exportElementAsPng(
      "catalog-printable-view",
      `فهرس_1000عشبة_المطبوع`
    );
    setIsExportingPng(false);
    if (ok) {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Brand Hero Banner with Authentic Visual Identity */}
      <div className="bg-[#132B20] text-[#FBF7EE] rounded-3xl p-6 sm:p-8 border-2 border-[#C59B27] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-right max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 bg-[#C59B27]/20 border border-[#C59B27]/50 px-3 py-1 rounded-full text-xs text-[#F5DC7D] font-bold">
            <span>🌿 الصيدلية النباتية الذكية المعتمدة</span>
            <span>•</span>
            <span>تعمل كلياً دون إنترنت على جهازك</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-['Cairo'] text-[#FBF7EE]">
            موسوعة 1000 عشبة — جُمعت لأجلك
          </h2>

          <p className="text-xs sm:text-sm text-[#E2D6B5] leading-relaxed font-['Amiri'] text-base">
            تجمع هذه المنصة بين أسرار البرديات الطبية المصرية القديمة وخلاصة دساتير العقاقير الحديثة. تصفح الـ 53 نبتة الموثقة سريرياً، أو استخدم الذكاء الاصطناعي لإضافة نباتاتك وأعشابك الخاصة مع حفظ محلي كامل وطباعة فورية بصيغتي PDF و PNG.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <button
              onClick={onNavigateAddAi}
              className="flex items-center gap-2 bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-black px-4 py-2.5 rounded-xl text-xs transition shadow-md active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>إضافة عشبة جديدة بالذكاء الاصطناعي</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-[#1C3E2F] hover:bg-[#25523E] border border-[#C59B27]/40 text-[#FBF7EE] font-bold px-3.5 py-2.5 rounded-xl text-xs transition"
            >
              <Printer className="w-4 h-4 text-[#F5DC7D]" />
              <span>طباعة الفهرس (PDF)</span>
            </button>

            <button
              onClick={handleExportCatalogPng}
              disabled={isExportingPng}
              className="flex items-center gap-1.5 bg-[#1C3E2F] hover:bg-[#25523E] border border-[#C59B27]/40 text-[#FBF7EE] font-bold px-3.5 py-2.5 rounded-xl text-xs transition"
            >
              {exportSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>تم تصدير الصورة!</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-[#F5DC7D]" />
                  <span>{isExportingPng ? "جارِ التصدير..." : "تصدير الفهرس كـ PNG"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Brand Emblem in Hero */}
        <div className="shrink-0 bg-[#FAF4E6] p-3 sm:p-4 rounded-3xl border-2 border-[#C59B27] shadow-xl">
          <BrandLogo size="md" showSubtitle={true} customLogoUrl={customLogoUrl} />
        </div>
      </div>

      {/* Search and Multi-Filtering Control Panel */}
      <div className="bg-[#FCF9F2] p-4 sm:p-5 rounded-3xl border-2 border-[#E6D8BA] shadow-sm space-y-3 no-print">
        {/* Row 1: Search & Toggles */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Live Search Input */}
          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم العشبة، الاسم العلمي، المادة الفعالة، أو العرض الصحي..."
              className="w-full bg-white border-2 border-[#D8C7A0] focus:border-[#C59B27] rounded-2xl px-4 py-2.5 pr-10 text-xs sm:text-sm text-[#132B20] focus:outline-none placeholder:text-slate-400 font-medium"
            />
            <Search className="w-4 h-4 text-[#8C7A53] absolute right-3.5 top-3.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Favorites Toggle */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition border ${
                onlyFavorites
                  ? "bg-rose-600 text-white border-rose-700 shadow-sm"
                  : "bg-white text-slate-700 border-[#D8C7A0] hover:bg-[#F2E5C5]"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-white" : "text-rose-600"}`} />
              <span>المفضلة فقط ({favorites.length})</span>
            </button>

            {/* Daily Reminders for Favorites Shortcut */}
            {onOpenReminder && (
              <button
                onClick={() => onOpenReminder()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition border bg-[#FAF4E6] text-[#785E21] border-[#D8C7A0] hover:bg-[#F2E5C5] active:scale-95"
                title="جدول التنبيهات اليومية لتناول الأعشاب المفضلة"
              >
                <Bell className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>منبه المفضلة {activeRemindersCount ? `(${activeRemindersCount})` : ""}</span>
              </button>
            )}

            {/* Safety Filter */}
            <select
              value={safetyFilter}
              onChange={(e) => setSafetyFilter(e.target.value)}
              className="bg-white border-2 border-[#D8C7A0] rounded-xl px-3 py-2 text-xs font-bold text-[#132B20] focus:outline-none focus:border-[#C59B27]"
            >
              <option value="الكل">جميع درجات الأمان</option>
              <option value="آمن">آمن سريرياً فقط</option>
              <option value="حذر">حذر معتدل</option>
              <option value="إشراف">يشترط إشراف طبي</option>
            </select>
          </div>
        </div>

        {/* Row 2: Body System Category Pills */}
        <div className="pt-2 border-t border-[#E8DCBF] flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs">
          <span className="text-[11px] font-bold text-[#745F31] shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>الجهاز المستهدف:</span>
          </span>

          {SYSTEM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedSystem(cat)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition text-[11px] ${
                selectedSystem === cat
                  ? "bg-[#132B20] text-[#F5DC7D] shadow-sm"
                  : "bg-white text-[#4A3C20] border border-[#D8C7A0] hover:bg-[#F2E5C5]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Counter and Status */}
        <div className="text-[11px] text-[#6D5A32] flex items-center justify-between pt-1">
          <div>
            عرض <strong className="text-[#132B20] font-black">{filteredHerbs.length}</strong> من أصل{" "}
            <strong className="text-[#132B20] font-black">{herbs.length}</strong> عشبة موثقة
          </div>
          {onlyFavorites && (
            <span className="text-rose-700 font-bold">عرض المفضلة فقط</span>
          )}
        </div>
      </div>

      {/* Herbs Grid Container (Target for PNG export of catalog) */}
      <div id="catalog-printable-view" className="space-y-4">
        {/* Export Header in printable view */}
        <div className="hidden print:block border-b-2 border-[#C59B27] pb-3 mb-4 text-center">
          <BrandLogo size="md" showSubtitle={true} customLogoUrl={customLogoUrl} />
          <h2 className="text-xl font-bold font-['Cairo'] text-[#132B20] mt-2">
            فهرس النباتات والأعشاب الطبية المعتمدة
          </h2>
        </div>

        {filteredHerbs.length === 0 ? (
          <div className="bg-[#FCF9F2] rounded-3xl border-2 border-dashed border-[#D8C7A0] p-12 text-center space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="font-bold text-[#132B20] text-base">
              لم نعثر على أعشاب تطابق بحثك الحالي
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              جرب تغيير كلمات البحث أو اختر "جميع الأجهزة"، أو استخدم الذكاء الاصطناعي لإضافة نبتة جديدة لم تكن في الفهرس.
            </p>
            <button
              onClick={onNavigateAddAi}
              className="inline-flex items-center gap-1.5 bg-[#132B20] text-[#FBF7EE] font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm hover:bg-[#1C3E2F]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>إضافة هذه النبتة بالذكاء الاصطناعي الآن</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredHerbs.map((herb) => (
              <HerbCard
                key={herb.id}
                herb={herb}
                isFavorite={favorites.includes(herb.id)}
                onToggleFavorite={onToggleFavorite}
                onOpenDetails={onOpenDetails}
                onAddToCompare={onAddToCompare}
                onOpenReminder={onOpenReminder}
                hasActiveReminder={remindersHerbIds?.includes(herb.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Global Certified Sources Footer */}
      <ScientificSourcesFooter />
    </div>
  );
};
