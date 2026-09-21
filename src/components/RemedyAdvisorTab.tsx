import React, { useState } from "react";
import { RemedyProtocol } from "../types";
import {
  Compass,
  Sparkles,
  Loader2,
  Printer,
  Image as ImageIcon,
  CheckCircle2,
  Leaf,
  AlertTriangle,
  Lightbulb,
  RotateCw,
  BookOpen,
} from "lucide-react";
import { exportElementAsPng } from "../utils/exportUtils";
import { BrandLogo } from "./BrandLogo";
import { ScientificSourcesFooter } from "./ScientificSourcesFooter";

interface RemedyAdvisorTabProps {
  customLogoUrl: string | null;
}

const COMMON_CONCERNS = [
  "أرق وصعوبة استغراق في النوم وتفكير مستمر",
  "انتفاخ القولون العصبي وعسر هضم بعد الطعام",
  "دعم المناعة والوقاية من نزلات البرد والإنفلونزا",
  "آلام وخشونة مفاصل الركبة والتهابات العظام",
  "تنظيم هرمونات الدورة وتخفيف أعراض تكيس المبايض",
  "خمول وتعب صباحي وتحسين التركيز والذاكرة",
];

export const RemedyAdvisorTab: React.FC<RemedyAdvisorTabProps> = ({
  customLogoUrl,
}) => {
  const [symptoms, setSymptoms] = useState("");
  const [userProfile, setUserProfile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [protocol, setProtocol] = useState<RemedyProtocol | null>(null);
  const [error, setError] = useState<string | null>(null);

  const protocolSheetId = "remedy-protocol-export-card";

  const handleGenerate = async (queryText?: string) => {
    const text = (queryText || symptoms).trim();
    if (!text) {
      setError("يرجى كتابة الأعراض أو الهدف الصحي المطلوب.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProtocol(null);

    try {
      const response = await fetch("/api/gemini/remedy-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: text,
          userProfile,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "تعذر إعداد البروتوكول النباتي.");
      }

      setProtocol(data.protocol);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء التواصل مع نموذج الذكاء الاصطناعي.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPng = async () => {
    await exportElementAsPng(protocolSheetId, "بروتوكول_صيدلية_1000عشبة");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-[#132B20] text-[#FBF7EE] rounded-3xl p-6 sm:p-8 border-2 border-[#C59B27] shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#C59B27] text-[#132B20] flex items-center justify-center font-black text-xl shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-['Cairo'] text-[#FBF7EE]">
              المستشار النباتي الذكي (Smart Phytotherapy Protocol)
            </h2>
            <p className="text-xs sm:text-sm text-[#F5DC7D] font-['Amiri']">
              بروتوكولات علاجية متكاملة مستخلصة من صيدلية 1000 عشبة
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-[#E2D6B5] leading-relaxed mt-2">
          صف حالتك أو العرض الصحي الذي ترغب في تحسينه، وسيقوم الذكاء الاصطناعي بتوليد توليفة عشبية متآزرة مع إرشادات التحضير الصيدلانية وموانع الاستعمال.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-[#FCF9F2] p-6 rounded-3xl border-2 border-[#E6D8BA] shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#132B20] mb-1 font-['Cairo']">
            الأعراض أو الهدف الصحي المطلوب:
          </label>
          <textarea
            rows={3}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="مثال: أعاني من أرق وصعوبة نوم مع توتر متواصل في عضلات الرقبة..."
            className="w-full bg-white border border-[#D1B881] rounded-2xl p-3.5 text-xs sm:text-sm text-[#132B20] focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#132B20] mb-1 font-['Cairo']">
            معلومات إضافية (أمراض مزمنة، أدوية، حمل أو رضاعة):
          </label>
          <input
            type="text"
            value={userProfile}
            onChange={(e) => setUserProfile(e.target.value)}
            placeholder="مثال: ضغط دم طبيعي، لا يوجد حمل، أتناول مكملات فيتامين د فقط..."
            className="w-full bg-white border border-[#D1B881] rounded-xl px-4 py-2.5 text-xs text-[#132B20] focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="pt-1">
          <span className="text-[11px] font-bold text-[#745F31] block mb-1.5">
            نماذج حالات شائعة:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_CONCERNS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSymptoms(c);
                  handleGenerate(c);
                }}
                className="text-[11px] bg-[#FAF4E6] hover:bg-[#F2E5C5] text-[#3D321A] border border-[#DFCBA0] px-2.5 py-1 rounded-xl transition"
              >
                + {c}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
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
              onClick={() => handleGenerate()}
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
          onClick={() => handleGenerate()}
          disabled={isLoading}
          className="w-full bg-[#132B20] hover:bg-[#1A3B2B] text-[#FBF7EE] font-bold py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#C59B27]" />
              <span>جارِ تركيب البروتوكول التكاملي ومراجعة دساتير الأعشاب...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#F5DC7D]" />
              <span>توليد البروتوكول العشبي المخصص</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Protocol Sheet */}
      {protocol && (
        <div
          id={protocolSheetId}
          className="bg-[#FFFDF7] rounded-3xl border-2 border-[#C59B27] p-6 sm:p-8 shadow-xl space-y-5 animate-in fade-in slide-in-from-bottom-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[#C59B27]/40 pb-4">
            <div>
              <span className="text-xs font-bold text-[#C59B27] block font-['Cairo']">
                الوصفة النباتية التوجيهية المخصصة
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#132B20] font-['Cairo']">
                {protocol.title}
              </h3>
            </div>
            <BrandLogo size="sm" showSubtitle={false} customLogoUrl={customLogoUrl} />
          </div>

          {/* Recommended Herbs Formula */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-black text-[#132B20] font-['Cairo'] flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-[#C59B27]" />
              <span>التوليفة النباتية الموصى بها:</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {protocol.recommendedHerbs.map((rh, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E5D6B6] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#132B20] text-sm font-['Cairo']">
                      {rh.herbName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#132B20] text-[#F5DC7D]">
                      مكون #{idx + 1}
                    </span>
                  </div>
                  <p className="text-[#594B2C] text-[11px] leading-relaxed">
                    <strong>الدور: </strong>
                    {rh.role}
                  </p>
                  <div className="pt-1 border-t border-[#E5D6B6] text-[11px] text-[#242F28]">
                    <strong>الجرعة: </strong>
                    {rh.doseAndUsage}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preparation Guide */}
          <div className="bg-[#F4EEDB] p-4 rounded-2xl border border-[#E0CFAB] text-xs">
            <strong className="block text-[#132B20] font-bold mb-1 text-sm font-['Cairo']">
              🏺 طريقة التحضير والاستخدام:
            </strong>
            <p className="text-[#2A3B31] leading-relaxed leading-5">
              {protocol.preparationGuide}
            </p>
          </div>

          {/* Precautions & Warnings */}
          <div className="bg-[#FFF5F5] p-4 rounded-2xl border border-[#FED7D7] text-xs text-[#742A2A]">
            <strong className="block text-[#9B2C2C] font-bold mb-1 text-sm font-['Cairo'] flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              <span>المحاذير والموانع:</span>
            </strong>
            <p className="leading-relaxed">{protocol.precautions}</p>
          </div>

          {/* Lifestyle Tip */}
          {protocol.lifestyleTip && (
            <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E5D6B6] text-xs text-[#524424] flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
              <div>
                <strong>نصيحة نمط الحياة الداعمة: </strong>
                <span>{protocol.lifestyleTip}</span>
              </div>
            </div>
          )}

          {/* Classical Arabic Heritage & Prophetic Medicine Advice */}
          {protocol.arabicHeritageAdvice && (
            <div className="bg-[#FAF5E8] p-4 rounded-2xl border-2 border-[#C59B27]/60 text-xs text-[#3D2E0B]">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-xs text-[#73520A] flex items-center gap-1.5 font-['Cairo']">
                  <span>📜</span>
                  <span>هدي الطب النبوي وتوجيهات ابن سينا في القانون للحالة:</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C59B27] text-[#132B20]">
                  حكمة التراث العربي
                </span>
              </div>
              <p className="font-['Amiri'] text-sm leading-relaxed text-[#4A3810] bg-[#FFFBF2] p-3 rounded-xl border border-[#E8DCBF]">
                {protocol.arabicHeritageAdvice}
              </p>
            </div>
          )}

          {/* Authoritative Global References */}
          <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#D9C496] text-xs text-[#3E3218]">
            <div className="flex items-center gap-1.5 font-bold text-[#132B20] mb-1">
              <BookOpen className="w-4 h-4 text-[#C59B27]" />
              <span>المراجع والدساتير العالمية المعتمدة لهذا البروتوكول:</span>
            </div>
            <p className="text-[#524424] leading-relaxed">
              {protocol.references ||
                "دراسات منظمة الصحة العالمية (WHO Monographs)، دستور اللجنة الألمانية (German Commission E)، الهيئة الأوروبية للأدوية (EMA/HMPC)، وتراث بردية إيبرس الطبية المصرية."}
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E8DCBF] flex items-center justify-between no-export">
            <span className="text-[10px] text-slate-500">
              صيدلية 1000 عشبة الذكية • جُمعت لأجلك
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPng}
                className="flex items-center gap-1 text-xs bg-[#FAF4E6] hover:bg-[#F2E5C5] text-[#132B20] font-bold px-3 py-2 rounded-xl border border-[#C59B27]/40 transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>تصدير الوصفة كـ PNG</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 text-xs bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الوصفة</span>
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
