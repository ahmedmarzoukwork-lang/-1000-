import React, { useState } from "react";
import { HerbItem } from "../types";
import {
  FileText,
  Image as ImageIcon,
  Heart,
  Scale,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  ExternalLink,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
} from "lucide-react";
import { exportElementAsPng } from "../utils/exportUtils";
import { enrichHerbWithDetailedExplanation } from "../utils/herbEnricher";

interface HerbCardProps {
  herb: HerbItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string | number) => void;
  onOpenDetails: (herb: HerbItem) => void;
  onAddToCompare?: (herb: HerbItem) => void;
}

export const HerbCard: React.FC<HerbCardProps> = ({
  herb,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
  onAddToCompare,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const cardElementId = `herb-card-${herb.id}`;

  // Ensure herb has full rich explanation and fields
  const enrichedHerb = enrichHerbWithDetailedExplanation(herb);

  const handleExportPng = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    const cleanName = enrichedHerb.nameAr.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");
    await exportElementAsPng(cardElementId, `عشبة_${cleanName}_1000عشبة`);
    setIsExporting(false);
  };

  // Safety level badge color
  const getSafetyBadge = () => {
    const s = enrichedHerb.safetyLevel || "";
    if (s.includes("عالي الخطورة") || s.includes("إشراف طبي")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-2.5 h-2.5" />
          <span>إشراف طبي</span>
        </span>
      );
    }
    if (s.includes("حذر")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>حذر معتدل</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-2.5 h-2.5" />
        <span>آمن سريرياً</span>
      </span>
    );
  };

  return (
    <div
      id={cardElementId}
      className="bg-[#FCF9F2] rounded-2xl border-2 border-[#E6D8BA] hover:border-[#C59B27] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative overflow-hidden text-right"
    >
      {/* Decorative Egyptian Papyrus Header Border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#132B20] via-[#C59B27] to-[#132B20]" />

      <div>
        {/* Top Badges & Favorite */}
        <div className="flex justify-between items-center mb-2.5 gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold font-['Cairo'] px-2.5 py-0.5 rounded-lg bg-[#132B20] text-[#F5DC7D] shadow-xs">
              {enrichedHerb.system}
            </span>
            {getSafetyBadge()}
            {enrichedHerb.isCustom && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                <span>مضاف بالذكاء الاصطناعي</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-bold text-[#8C7A53]">
              #{String(enrichedHerb.id).padStart(3, "0")}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(enrichedHerb.id);
              }}
              title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              className="p-1 rounded-full text-slate-400 hover:text-rose-600 transition no-export cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? "fill-rose-600 text-rose-600" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Herb Title */}
        <h3 className="font-black text-[#132B20] text-base sm:text-lg font-['Cairo'] group-hover:text-[#9A7B1C] transition-colors leading-tight">
          {enrichedHerb.nameAr}
        </h3>
        <div className="text-[11px] text-[#55695F] italic font-sans flex items-center gap-1.5 mt-0.5">
          <span>{enrichedHerb.nameEn}</span>
          <span>•</span>
          <span className="font-serif text-[#786642]">{enrichedHerb.scientific}</span>
        </div>

        {/* Detailed Product Explanation (شرح تفصيلي للمنتج) */}
        <div className="mt-3 p-3 rounded-xl bg-[#FAF4E6] border border-[#EADBBD] text-xs text-[#2A3B31]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-[#132B20]">
              <BookOpen className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>شرح وتوصيف المنتج:</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-[10px] font-bold text-[#9A7B1C] hover:text-[#132B20] flex items-center gap-0.5 no-export cursor-pointer transition"
            >
              {showFullDescription ? (
                <>
                  <span>طي الشرح</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>المزيد من الشرح</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          </div>

          <p
            className={`text-[11px] text-[#3B3019] leading-relaxed transition-all ${
              showFullDescription ? "" : "line-clamp-3"
            }`}
          >
            {enrichedHerb.description}
          </p>

          {/* If expanded, also show pharmacology and benefits */}
          {showFullDescription && enrichedHerb.pharmacology && (
            <div className="mt-2.5 pt-2 border-t border-[#E5D5B2] text-[10px] space-y-1.5">
              <div>
                <strong className="text-[#132B20] block font-bold mb-0.5">
                  ⚙️ آلية العمل والتأثير في الجسم:
                </strong>
                <p className="text-[#4F4022] leading-relaxed">
                  {enrichedHerb.pharmacology}
                </p>
              </div>

              {enrichedHerb.benefits && enrichedHerb.benefits.length > 0 && (
                <div className="mt-1.5">
                  <strong className="text-[#132B20] block font-bold mb-1">
                    ✨ أهم الخصائص العلاجية:
                  </strong>
                  <ul className="space-y-1">
                    {enrichedHerb.benefits.slice(0, 3).map((b, idx) => (
                      <li key={idx} className="flex items-start gap-1 text-[#3D4C42]">
                        <span className="text-[#C59B27] font-bold">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Therapeutic Target */}
        <div className="mt-2 p-2.5 rounded-xl bg-[#F4EEDB] border border-[#E4D5B4] text-xs text-[#2A3B31] leading-relaxed">
          <strong className="block text-[#132B20] text-[11px] font-extrabold mb-0.5">
            🎯 التأثير العلاجي الرئيسي:
          </strong>
          <p className="line-clamp-2 text-[11px]">{enrichedHerb.target}</p>
        </div>

        {/* Active Constituent & Dose & Prep Chips */}
        <div className="mt-2.5 space-y-1.5 text-[11px]">
          <div className="flex items-start gap-1.5 text-[#3D4C42]">
            <FlaskConical className="w-3.5 h-3.5 text-[#C59B27] shrink-0 mt-0.5" />
            <div className="truncate">
              <span className="font-bold text-[#132B20]">المادة الفعالة: </span>
              <span className="font-medium text-[#443821]">{enrichedHerb.active}</span>
            </div>
          </div>

          {enrichedHerb.dose && (
            <div className="flex items-start gap-1.5 text-[#3D4C42]">
              <Clock className="w-3.5 h-3.5 text-[#C59B27] shrink-0 mt-0.5" />
              <div className="truncate">
                <span className="font-bold text-[#132B20]">الجرعة: </span>
                <span className="font-medium text-[#443821]">{enrichedHerb.dose}</span>
              </div>
            </div>
          )}
        </div>

        {/* Egyptian Heritage Note if exists */}
        {enrichedHerb.historicalNote && (
          <div className="mt-2 text-[10px] font-['Amiri'] text-[#785E21] bg-[#FFF8E7] p-1.5 rounded-lg border border-[#F0DFB3] line-clamp-1 italic">
            🏺 <span className="font-bold">تراث الفراعنة:</span> {enrichedHerb.historicalNote}
          </div>
        )}
      </div>

      {/* Footer Action Bar */}
      <div className="pt-3 mt-3 border-t border-[#E8DCBF] flex items-center justify-between gap-2 text-xs no-export">
        <button
          onClick={() => onOpenDetails(enrichedHerb)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#132B20] hover:bg-[#1C3E2F] text-[#FBF7EE] font-bold py-2 px-3 rounded-xl transition text-[11px] shadow-sm active:scale-95 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-[#F5DC7D]" />
          <span>بطاقة التعريف الكاملة</span>
        </button>

        <button
          onClick={handleExportPng}
          disabled={isExporting}
          title="تصدير كصورة PNG فورية"
          className="flex items-center gap-1 bg-[#F5EEDB] hover:bg-[#EBE0C7] text-[#132B20] border border-[#C59B27]/40 font-semibold py-2 px-2.5 rounded-xl transition text-[11px] active:scale-95 cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5 text-[#A07A15]" />
          <span className="hidden sm:inline">PNG</span>
        </button>

        {onAddToCompare && (
          <button
            onClick={() => onAddToCompare(enrichedHerb)}
            title="مقارنة هذه العشبة مع أخرى"
            className="flex items-center gap-1 bg-[#F5EEDB] hover:bg-[#EBE0C7] text-[#132B20] border border-[#C59B27]/40 font-semibold py-2 px-2.5 rounded-xl transition text-[11px] active:scale-95 cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-[#132B20]" />
          </button>
        )}
      </div>
    </div>
  );
};
