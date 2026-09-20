import React, { useState, useEffect, useMemo } from "react";
import { HerbItem } from "../types";
import {
  Sparkles,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  Save,
  RotateCw,
  BookMarked,
  RefreshCw,
  FileText,
  Activity,
  Layers,
} from "lucide-react";
import { ScientificSourcesFooter } from "./ScientificSourcesFooter";
import { enrichHerbWithDetailedExplanation } from "../utils/herbEnricher";

interface AddHerbAiViewProps {
  onAddHerb: (herb: HerbItem) => void;
  existingCount: number;
  existingHerbs?: HerbItem[];
}

export const RESERVE_CANDIDATE_HERBS = [
  "كف مريم (فيتكس)",
  "عشبة الدميانة",
  "دم الأخوين (راتنج التنين)",
  "حب الرشاد (الثفاء)",
  "المسكية (حشيشة الرمد)",
  "لسان الثور (الحمحم)",
  "شجرة المر (المرّة)",
  "عشبة الماكا البيروفية",
  "العنبروت (الجوز الأسود)",
  "العرعر الطبي",
  "عشبة العنزة (إبيميديوم)",
  "الراوند الصيني",
  "بلميط منشاري (سو بالميتو)",
  "خاتم الذهب (غولدن سيل)",
  "الكوهوش الأسود (سيميسيفوغا)",
  "الحسك الأرضي (تريبولوس)",
  "الفطر الريشي (جانوديرما)",
  "فطر كورديسيبس العسكري",
  "جذور الأرقطيون",
  "عشبة ذيل الحصان",
  "جذور الروديولا الوردية",
  "الشيلاجيت (موميان)",
  "البرسيم الأحمر (نفل المروج)",
  "الصبار الحقيقي (الألوفيرا)",
  "بذور الشيا المكسيكية",
  "بذور الكتان الذهبي",
  "الخرشوف الشوكي (الأرتيشوك)",
  "زهرة العطاس (الأرنيكا)",
  "شجرة الشاي الأسترالية",
  "اليانسون النجمي الصيني",
  "القرنفل العطري الطبي",
  "الهيل الأخضر (الحبهان)",
  "الثوم المخمر (الثوم الأسود)",
  "حشيشة القزاز (ستيلاريا)",
  "الزوفا الطبية",
  "العكوب الجبلي",
  "الحنظل الطبي",
  "الحرمل (السذاب البري)",
  "السدر البلدي (النبق)",
  "شجرة النيم الهندية",
  "البوتشو الجنوب أفريقي",
  "عشبة اللوبيليا (تبغ الجبل)",
  "جذور المارشميلو (الخطمي الطبي)",
  "عشبة لسان الحمل الكبير",
  "البكورية الطبية (الآذريون)",
  "عشبة الفوقس الحويصلي (طحلب الكلب)",
  "الشزندرة الصينية (شيزاندرا)",
  "لحاء الصفصاف الأبيض",
  "الزعفران الحر النقي",
  "النعناع البري (قطرم)",
  "الأخيليا (ألف ورقة)",
  "السرخس الذكر",
  "الدردار الأحمر الزلق",
  "الهيل الأسود (القافلة)",
  "عشبة سانت باربرا",
  "الخردل الأسود",
  "عشبة المروحة الجبلية",
  "الشاغة المخزنية (السمفيتون)",
  "عشبة فراسيون أبيض",
  "الهدال الأبيض (الدبق)",
  "حشيشة الدينار (الجنجل)",
  "الجنسنج السيبيري (إليوثيرو)",
  "نبات الآس (الحمبلاس)",
  "البطباط الطبي (عصا الراعي)",
];

const cleanName = (text: string) =>
  text.toLowerCase().replace(/[\s\(\)\[\]\-،_]/g, "");

export const AddHerbAiView: React.FC<AddHerbAiViewProps> = ({
  onAddHerb,
  existingCount,
  existingHerbs = [],
}) => {
  const [plantQuery, setPlantQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedHerb, setGeneratedHerb] = useState<HerbItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [seedOffset, setSeedOffset] = useState(0);

  // Filter pool of candidate herbs excluding existing herbs
  const availableCandidates = useMemo(() => {
    const existingNames = new Set(
      existingHerbs.flatMap((h) => [
        cleanName(h.nameAr),
        cleanName(h.nameEn),
        cleanName(h.scientific),
      ])
    );

    return RESERVE_CANDIDATE_HERBS.filter((candidate) => {
      const cClean = cleanName(candidate);
      return !Array.from(existingNames).some(
        (ex) => ex.includes(cClean) || cClean.includes(ex)
      );
    });
  }, [existingHerbs]);

  // Current batch of 12 suggestions
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (availableCandidates.length > 0) {
      const sliceSize = 12;
      const start = (seedOffset * sliceSize) % availableCandidates.length;
      const initial = availableCandidates.slice(start, start + sliceSize);
      // If end of array, wrap around
      if (initial.length < sliceSize) {
        initial.push(...availableCandidates.slice(0, sliceSize - initial.length));
      }
      setActiveSuggestions(initial);
    }
  }, [availableCandidates, seedOffset]);

  const handleRefreshSuggestions = () => {
    setSeedOffset((prev) => prev + 1);
  };

  const handleGenerate = async (queryToUse?: string) => {
    const query = (queryToUse || plantQuery).trim();
    if (!query) {
      setErrorMessage("يرجى كتابة اسم العشبة أو النبتة الطبية المراد إضافتها.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setGeneratedHerb(null);

    try {
      const response = await fetch("/api/gemini/add-herb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantQuery: query }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "تعذر استخراج بيانات النبتة من خادم الذكاء الاصطناعي.");
      }

      const baseHerbData: HerbItem = {
        id: Date.now(),
        nameAr: data.herb.nameAr || query,
        nameEn: data.herb.nameEn || "",
        scientific: data.herb.scientific || "",
        family: data.herb.family || "",
        system: data.herb.system || "أعشاب عامة",
        target: data.herb.target || "",
        active: data.herb.active || "",
        dose: data.herb.dose || "",
        preparation: data.herb.preparation || "",
        safety: data.herb.safety || "",
        safetyLevel: data.herb.safetyLevel || "آمن جداً",
        contraindications: data.herb.contraindications || "",
        interactions: data.herb.interactions || "",
        historicalNote: data.herb.historicalNote || "",
        description: data.herb.description || "",
        pharmacology: data.herb.pharmacology || "",
        benefits: Array.isArray(data.herb.benefits) ? data.herb.benefits : [],
        references:
          data.herb.references ||
          "دراسات منظمة الصحة العالمية (WHO Monographs)، دستور اللجنة الألمانية (German Commission E)، الهيئة الأوروبية للأدوية (EMA/HMPC)، وبردية إيبرس الطبية.",
        isCustom: true,
        addedAt: new Date().toLocaleDateString("ar-EG"),
      };

      const herbData = enrichHerbWithDetailedExplanation(baseHerbData);
      setGeneratedHerb(herbData);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "حدث خطأ أثناء التواصل مع نموذج الذكاء الاصطناعي. يرجى التحقق من الاتصال."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToCatalog = () => {
    if (!generatedHerb) return;
    const addedName = generatedHerb.nameAr;
    onAddHerb(generatedHerb);

    // Remove the added herb from active suggestions and replace with an unadded candidate
    setActiveSuggestions((prev) => {
      const filtered = prev.filter((item) => {
        const itemClean = cleanName(item);
        const addedClean = cleanName(addedName);
        return !itemClean.includes(addedClean) && !addedClean.includes(itemClean);
      });

      // Find an unused herb from available candidates that is not in filtered
      const replacement = availableCandidates.find(
        (cand) =>
          !filtered.includes(cand) &&
          !cleanName(cand).includes(cleanName(addedName))
      );

      if (replacement && filtered.length < 12) {
        return [...filtered, replacement];
      }
      return filtered;
    });

    setSuccessMessage(
      `تمت إضافة عشبة (${addedName}) بنجاح إلى قاعدة بيانات جهازك المحلية! تم استبعادها من قائمة المقترحات وتحديث القائمة. أصبحت صيدليتك تضم ${existingCount + 1} عشبة.`
    );
    setGeneratedHerb(null);
    setPlantQuery("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Banner */}
      <div className="bg-[#132B20] text-[#FBF7EE] rounded-3xl p-6 sm:p-8 border-2 border-[#C59B27] shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 opacity-10 pointer-events-none text-9xl">
          🌿
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#C59B27] text-[#132B20] flex items-center justify-center font-black text-xl shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-['Cairo'] text-[#FBF7EE]">
              إضافة وتوثيق النباتات بالذكاء الاصطناعي
            </h2>
            <p className="text-xs sm:text-sm text-[#F5DC7D] font-['Amiri']">
              موسوعة "1000 عشبة" الذكية • موثقة من أهم الدساتير الطبية العالمية وتراث بردية إيبرس
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#E2D6B5] leading-relaxed max-w-2xl mt-3">
          اكتب اسم أي نبتة أو عشبة أو بهار أو مستخلص نباتي؛ ليقوم نموذج الذكاء الاصطناعي باستحضار كافة المعلومات السريرية، المواد الفعالة، الجرعات، التداخلات، والتراث التاريخي من دساتير منظمة الصحة العالمية (WHO) والهيئة الأوروبية (EMA) واللجنة الألمانية E.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-[#FCF9F2] p-5 sm:p-7 rounded-3xl border-2 border-[#E6D8BA] shadow-sm space-y-4">
        <label className="block text-xs sm:text-sm font-bold text-[#132B20] font-['Cairo']">
          اسم العشبة أو النبتة الطبية المراد توثيقها:
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={plantQuery}
            onChange={(e) => setPlantQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) handleGenerate();
            }}
            placeholder="مثال: كف مريم، دم الأخوين، عشبة الدميانة، حب الرشاد، زهرة العطاس..."
            className="flex-1 bg-white border-2 border-[#D8C7A0] focus:border-[#C59B27] rounded-2xl px-4 py-3 text-sm text-[#132B20] focus:outline-none placeholder:text-slate-400 font-medium"
          />

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !plantQuery.trim()}
            className="bg-[#132B20] hover:bg-[#1A3B2B] disabled:opacity-50 text-[#FBF7EE] font-bold px-6 py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap text-xs sm:text-sm cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C59B27]" />
                <span>جارِ التوثيق والتحليل الصيدلاني...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#F5DC7D]" />
                <span>توليد وتوثيق النبتة</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Suggested Seeds (auto-updates when herbs are added) */}
        <div className="space-y-2 pt-2 border-t border-[#EDE1C8]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#6D5A32] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>مقترحات سريعة لنباتات غير مضافة (تُحذف تلقائياً فور إضافتها):</span>
            </span>
            <button
              onClick={handleRefreshSuggestions}
              type="button"
              className="text-[11px] text-[#7A6430] hover:text-[#132B20] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF4E6] hover:bg-[#F2E5C5] transition border border-[#DECBA1] cursor-pointer"
              title="عرض مقترحات بديلة من بنك الأعشاب"
            >
              <RefreshCw className="w-3 h-3" />
              <span>تحديث المقترحات</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {activeSuggestions.length > 0 ? (
              activeSuggestions.map((herbName) => (
                <button
                  key={herbName}
                  onClick={() => {
                    setPlantQuery(herbName);
                    handleGenerate(herbName);
                  }}
                  disabled={isLoading}
                  className="text-[11px] bg-[#FAF4E6] hover:bg-[#F2E5C5] text-[#3D321A] border border-[#DFCBA0] px-3 py-1.5 rounded-xl transition font-medium active:scale-95 cursor-pointer shadow-2xs hover:border-[#C59B27]"
                >
                  + {herbName}
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">
                تهانينا! لقد قمت بإضافة جميع الأعشاب المقترحة في هذا البنك.
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <strong className="font-bold">تنبيه: </strong>
                <span>{errorMessage}</span>
              </div>
            </div>
            <button
              onClick={() => handleGenerate()}
              disabled={isLoading || !plantQuery.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold transition text-xs shrink-0 self-end sm:self-auto shadow-sm active:scale-95 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة الآن</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-start gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}
      </div>

      {/* Generated Result Preview Card */}
      {generatedHerb && (
        <div className="bg-[#FFFDF7] rounded-3xl border-2 border-[#C59B27] p-6 sm:p-8 shadow-xl space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#C59B27]/30 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-3 py-0.5 rounded-lg bg-[#132B20] text-[#F5DC7D]">
                  {generatedHerb.system}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                  {generatedHerb.safetyLevel}
                </span>
              </div>
              <h3 className="text-2xl font-black font-['Cairo'] text-[#132B20]">
                {generatedHerb.nameAr}
              </h3>
              <div className="text-xs text-[#5D6F64] font-sans flex items-center gap-2 mt-0.5">
                <span className="font-semibold">{generatedHerb.nameEn}</span>
                <span>•</span>
                <span className="italic font-serif text-[#786642]">
                  {generatedHerb.scientific}
                </span>
                {generatedHerb.family && <span>({generatedHerb.family})</span>}
              </div>
            </div>

            <button
              onClick={handleSaveToCatalog}
              className="flex items-center gap-2 bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-black px-6 py-3 rounded-2xl shadow-lg transition active:scale-95 text-xs sm:text-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ في صيدلية جهازي المحلية</span>
            </button>
          </div>

          {/* Comprehensive Product Description */}
          {generatedHerb.description && (
            <div className="bg-[#FAF4E6] p-4 rounded-2xl border-2 border-[#D9C496] text-xs sm:text-sm text-[#2A3B31] leading-relaxed">
              <strong className="flex items-center gap-1.5 text-[#132B20] font-extrabold mb-1.5 text-sm font-['Cairo']">
                <FileText className="w-4 h-4 text-[#C59B27]" />
                <span>الشرح الصيدلاني والتوصيف الشامل للمنتج:</span>
              </strong>
              <p className="leading-relaxed text-[#332B18]">{generatedHerb.description}</p>
            </div>
          )}

          {/* Target & Pharmacological Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="bg-[#F4EEDB] p-4 rounded-2xl border border-[#E2D2AD] text-[#2A3B31] leading-relaxed">
              <strong className="block text-[#132B20] font-bold mb-1">🎯 التأثير والهدف العلاجي:</strong>
              <p>{generatedHerb.target}</p>
            </div>

            {generatedHerb.pharmacology && (
              <div className="bg-[#F4EEDB] p-4 rounded-2xl border border-[#E2D2AD] text-[#2A3B31] leading-relaxed">
                <strong className="block text-[#132B20] font-bold mb-1">⚡ آلية التأثير والعمل في الجسم:</strong>
                <p className="text-xs text-[#3E3219]">{generatedHerb.pharmacology}</p>
              </div>
            )}
          </div>

          {/* Key Benefits if available */}
          {generatedHerb.benefits && generatedHerb.benefits.length > 0 && (
            <div className="bg-[#FBF7EE] p-4 rounded-2xl border border-[#E4D5B4] text-xs">
              <strong className="flex items-center gap-1.5 text-[#132B20] font-bold mb-2">
                <Layers className="w-3.5 h-3.5 text-[#A07A15]" />
                <span>أبرز الخصائص والميزات السريرية:</span>
              </strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {generatedHerb.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 bg-[#FAF4E6] p-2 rounded-xl border border-[#EADBBD]">
                    <span className="text-[#C59B27] font-bold">✓</span>
                    <span className="text-[#2F3B33]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E5D6B6]">
              <span className="font-bold text-[#132B20] block mb-1">🔬 المادة الفعالة:</span>
              <p className="text-[#3D321A]">{generatedHerb.active}</p>
            </div>

            <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E5D6B6]">
              <span className="font-bold text-[#132B20] block mb-1">☕ الجرعة والاستعمال:</span>
              <p className="text-[#3D321A]">{generatedHerb.dose}</p>
            </div>
          </div>

          {generatedHerb.preparation && (
            <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E5D6B6] text-xs">
              <span className="font-bold text-[#132B20] block mb-1">🏺 التحضير الصيدلاني:</span>
              <p className="text-[#3D321A]">{generatedHerb.preparation}</p>
            </div>
          )}

          <div className="bg-[#FFF5F5] p-4 rounded-2xl border border-[#FED7D7] text-xs text-[#742A2A] space-y-2">
            <div>
              <span className="font-bold text-[#9B2C2C] block mb-0.5">⚠️ السلامة والمحاذير:</span>
              <p>{generatedHerb.safety}</p>
            </div>
            {generatedHerb.contraindications && (
              <p>
                <strong>⛔ موانع الاستعمال: </strong>
                {generatedHerb.contraindications}
              </p>
            )}
            {generatedHerb.interactions && (
              <p>
                <strong>⚡ التداخلات: </strong>
                {generatedHerb.interactions}
              </p>
            )}
          </div>

          {generatedHerb.historicalNote && (
            <div className="bg-[#FFF9EA] p-4 rounded-2xl border border-[#F0DDB1] text-xs text-[#654E18] font-['Amiri'] text-sm">
              <span className="font-bold block mb-1">📜 لمحة تاريخية / تراث الفراعنة:</span>
              <p>{generatedHerb.historicalNote}</p>
            </div>
          )}

          {/* Authoritative Global Citations */}
          <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#D9C496] text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#132B20] mb-1">
              <BookMarked className="w-4 h-4 text-[#C59B27]" />
              <span>المراجع والدساتير العالمية المعتمدة:</span>
            </div>
            <p className="text-[#4E4125] leading-relaxed">
              {generatedHerb.references ||
                "دراسات منظمة الصحة العالمية (WHO Monographs)، دستور اللجنة الألمانية (German Commission E)، الهيئة الأوروبية للأدوية (EMA/HMPC)، ودستور الأدوية الأمريكي (USP)."}
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveToCatalog}
              className="flex items-center gap-2 bg-[#132B20] hover:bg-[#1C3E2F] text-[#FBF7EE] font-black px-6 py-3 rounded-2xl shadow-lg transition active:scale-95 text-xs sm:text-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#C59B27]" />
              <span>إدراج في الفهرس وحفظ التغييرات محلياً</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Sources & Pharmacopoeias Footnote */}
      <ScientificSourcesFooter />
    </div>
  );
};
