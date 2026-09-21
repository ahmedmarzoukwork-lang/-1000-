import React, { useState } from "react";
import { HerbItem, DrugCheckResult } from "../types";
import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Printer,
  Image as ImageIcon,
  RotateCw,
  BookCheck,
} from "lucide-react";
import { exportElementAsPng } from "../utils/exportUtils";
import { BrandLogo } from "./BrandLogo";
import { ScientificSourcesFooter } from "./ScientificSourcesFooter";

interface DrugCheckerTabProps {
  herbs: HerbItem[];
  customLogoUrl: string | null;
}

export const DrugCheckerTab: React.FC<DrugCheckerTabProps> = ({
  herbs,
  customLogoUrl,
}) => {
  const [selectedHerbId, setSelectedHerbId] = useState<number | string>(herbs[0]?.id || 1);
  const [customHerbName, setCustomHerbName] = useState("");
  const [useCustomHerb, setUseCustomHerb] = useState(false);
  const [medications, setMedications] = useState("");
  const [condition, setCondition] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DrugCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeHerb = herbs.find((h) => String(h.id) === String(selectedHerbId)) || herbs[0];
  const targetHerbName = useCustomHerb ? customHerbName : activeHerb?.nameAr;

  const resultContainerId = "drug-interaction-result-card";

  const handleCheck = async () => {
    if (!targetHerbName.trim()) {
      setError("يرجى تحديد العشبة المراد فحصها.");
      return;
    }
    if (!medications.trim()) {
      setError("يرجى كتابة أسماء الأدوية المراد فحص التزامن معها.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/gemini/check-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          herbName: targetHerbName,
          medications,
          condition,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "تعذر إتمام الفحص الصيدلاني.");
      }

      setResult(data.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء إجراء الفحص.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPng = async () => {
    await exportElementAsPng(resultContainerId, `تقرير_تداخل_${targetHerbName}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-[#132B20] text-[#FBF7EE] rounded-3xl p-6 sm:p-8 border-2 border-[#C59B27] shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-xl shadow-md">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-['Cairo'] text-[#FBF7EE]">
              فاحص التداخلات الدوائية والعشبية بالذكاء الاصطناعي
            </h2>
            <p className="text-xs sm:text-sm text-[#F5DC7D] font-['Amiri']">
              نظام التثبت السريري من أمان تزامن الأعشاب مع الأدوية البشرية
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-[#E2D6B5] leading-relaxed mt-2">
          يتحقق المحرك من سلامة تآزر أو تعارض المستخلصات النباتية مع الأدوية الطبية (مثل مميعات الدم، خافضات السكر، أدوية الضغط، والمهدئات) لضمان الاستخدام الآمن.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[#FCF9F2] p-6 rounded-3xl border-2 border-[#E6D8BA] shadow-sm space-y-4">
        {/* Herb Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-[#132B20] font-['Cairo']">
              العشبة المراد فحصها:
            </label>
            <button
              onClick={() => setUseCustomHerb(!useCustomHerb)}
              className="text-[11px] text-[#A07A15] hover:underline font-semibold"
            >
              {useCustomHerb ? "اختيار من القائمة" : "كتابة عشبة أخرى يدوياً"}
            </button>
          </div>

          {useCustomHerb ? (
            <input
              type="text"
              value={customHerbName}
              onChange={(e) => setCustomHerbName(e.target.value)}
              placeholder="اكتب اسم العشبة..."
              className="w-full bg-white border border-[#D1B881] rounded-xl px-4 py-2.5 text-xs text-[#132B20] focus:outline-none focus:border-[#C59B27]"
            />
          ) : (
            <select
              value={selectedHerbId}
              onChange={(e) => setSelectedHerbId(e.target.value)}
              className="w-full bg-white border border-[#D1B881] rounded-xl px-4 py-2.5 text-xs font-bold text-[#132B20] focus:outline-none focus:border-[#C59B27]"
            >
              {herbs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nameAr} ({h.scientific})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Medications Input */}
        <div>
          <label className="block text-xs font-bold text-[#132B20] mb-1.5 font-['Cairo']">
            أسماء الأدوية الحالية للمريض:
          </label>
          <input
            type="text"
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            placeholder="مثال: وارفارين، أسبرين، ميتفورمين، أوميبرازول، أملوديبين..."
            className="w-full bg-white border border-[#D1B881] rounded-xl px-4 py-2.5 text-xs text-[#132B20] focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        {/* Condition / Medical Background */}
        <div>
          <label className="block text-xs font-bold text-[#132B20] mb-1.5 font-['Cairo']">
            الحالة الصحية أو الأمراض المزمنة (اختياري):
          </label>
          <input
            type="text"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="مثال: ارتفاع ضغط الدم، سكري نوع 2، قرحة معدة، حمل..."
            className="w-full bg-white border border-[#D1B881] rounded-xl px-4 py-2.5 text-xs text-[#132B20] focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <strong className="font-bold">تنبيه: </strong>
                <span>{error}</span>
              </div>
            </div>
            <button
              onClick={handleCheck}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold transition text-xs shrink-0 self-end sm:self-auto shadow-sm active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة الآن</span>
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="w-full bg-[#132B20] hover:bg-[#1A3B2B] text-[#FBF7EE] font-bold py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#C59B27]" />
              <span>جارِ فحص المسارات الحيوية وأنزيمات الكبد...</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-[#F5DC7D]" />
              <span>فحص أمان التزامن السريري الآن</span>
            </>
          )}
        </button>
      </div>

      {/* Result Monograph Card */}
      {result && (
        <div
          id={resultContainerId}
          className="bg-[#FFFDF7] rounded-3xl border-2 border-[#C59B27] p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#C59B27]/30 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#8C7A53] block">
                تقرير الفحص الصيدلاني التفاعلي
              </span>
              <h3 className="font-black text-lg text-[#132B20] font-['Cairo']">
                فحص: {targetHerbName} مع ({medications})
              </h3>
            </div>
            <BrandLogo size="sm" showSubtitle={false} customLogoUrl={customLogoUrl} />
          </div>

          {/* Risk Level Badge */}
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 ${
              result.riskLevel.includes("خطر") || result.riskLevel.includes("تعارض")
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : result.riskLevel.includes("معتدل") || result.riskLevel.includes("مراقبة")
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
          >
            {result.riskLevel.includes("خطر") ? (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            )}
            <div>
              <span className="text-xs font-bold block">مستوى الخطورة السريرية:</span>
              <strong className="text-sm font-black font-['Cairo']">
                {result.riskLevel}
              </strong>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 text-xs">
            <div className="bg-[#FAF4E6] p-3.5 rounded-2xl border border-[#E5D6B6]">
              <strong className="block text-[#132B20] font-bold mb-1">
                🔬 الآلية الحيوية للتداخل (Mechanism):
              </strong>
              <p className="text-[#3D321A] leading-relaxed">{result.mechanism}</p>
            </div>

            <div className="bg-[#FAF4E6] p-3.5 rounded-2xl border border-[#E5D6B6]">
              <strong className="block text-[#132B20] font-bold mb-1">
                🩺 التوجيه السريري للمريض (Clinical Advice):
              </strong>
              <p className="text-[#3D321A] leading-relaxed">{result.clinicalAdvice}</p>
            </div>

            {result.spacingHours && (
              <div className="bg-[#FAF4E6] p-3 rounded-2xl border border-[#E5D6B6] flex items-center gap-2 text-xs font-bold text-[#132B20]">
                <Clock className="w-4 h-4 text-[#C59B27]" />
                <span>الفاصل الزمني الموصى به: {result.spacingHours}</span>
              </div>
            )}

            {/* Classical Arabic Heritage Note (ابن سينا والطب النبوي) */}
            {result.traditionalNote && (
              <div className="bg-[#FAF5E8] p-3.5 rounded-2xl border-2 border-[#C59B27]/50 text-xs">
                <strong className="block text-[#73520A] font-bold mb-1 flex items-center gap-1.5 font-['Cairo']">
                  <span>📜</span>
                  <span>توجيهات ابن سينا والطب النبوي لإصلاح الغائلة ومزاج البدن:</span>
                </strong>
                <p className="text-[#4A3810] font-['Amiri'] text-sm leading-relaxed bg-[#FFFBF2] p-2.5 rounded-xl border border-[#E8DCBF]">
                  {result.traditionalNote}
                </p>
              </div>
            )}

            {/* Authoritative Global Citations */}
            <div className="bg-[#FAF4E6] p-3.5 rounded-2xl border border-[#D9C496] text-xs">
              <strong className="block text-[#132B20] font-bold mb-1 flex items-center gap-1.5">
                <BookCheck className="w-4 h-4 text-[#C59B27]" />
                <span>المراجع السريرية المعتمدة (Stockley's, EMA, PubMed):</span>
              </strong>
              <p className="text-[#4F4125] leading-relaxed">
                {result.references ||
                  "مرجع ستوكلي للتداخلات الدوائية والعشبية (Stockley's Herbal Medicines Interactions)، دراسات الهيئة الأوروبية للأدوية (EMA/HMPC)، والمكتبة الوطنية الأمريكية للطب (PubMed/NCBI)."}
              </p>
            </div>
          </div>

          {/* Export Controls for Report */}
          <div className="pt-3 border-t border-[#E8DCBF] flex items-center justify-between no-export">
            <span className="text-[10px] text-slate-500">
              * هذا التقرير استرشادي مبني على دساتير الأدوية؛ راجع طبيبك أو صيدلانيك دائماً.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPng}
                className="flex items-center gap-1 text-xs bg-[#FAF4E6] hover:bg-[#F2E5C5] text-[#132B20] font-bold px-3 py-1.5 rounded-xl border border-[#C59B27]/40 transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>حفظ كصورة PNG</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 text-xs bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Certified Sources Footer */}
      <ScientificSourcesFooter compact={true} />
    </div>
  );
};
