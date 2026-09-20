import React, { useState } from "react";
import { HerbItem } from "../types";
import {
  X,
  Printer,
  Image as ImageIcon,
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Clock,
  Sparkles,
  BookMarked,
  CheckCircle,
  FileText,
  Activity,
  Layers,
  HeartPulse,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { exportElementAsPng } from "../utils/exportUtils";
import { enrichHerbWithDetailedExplanation } from "../utils/herbEnricher";

interface HerbDetailModalProps {
  herb: HerbItem | null;
  onClose: () => void;
  customLogoUrl: string | null;
}

export const HerbDetailModal: React.FC<HerbDetailModalProps> = ({
  herb,
  onClose,
  customLogoUrl,
}) => {
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  if (!herb) return null;

  // Guarantee complete rich explanation and clinical fields
  const enrichedHerb = enrichHerbWithDetailedExplanation(herb);

  const modalContentId = `herb-modal-monograph-${enrichedHerb.id}`;

  const handleExportPng = async () => {
    setIsExportingPng(true);
    const cleanName = enrichedHerb.nameAr.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");
    const ok = await exportElementAsPng(
      modalContentId,
      `بطاقة_${cleanName}_1000عشبة`
    );
    setIsExportingPng(false);
    if (ok) {
      setExportedSuccess(true);
      setTimeout(() => setExportedSuccess(false), 3000);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1D16]/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
      <div className="bg-[#FBF7EE] max-w-3xl w-full rounded-3xl border-2 border-[#C59B27] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Floating Control Bar */}
        <div className="bg-[#132B20] text-[#FBF7EE] px-4 py-3 border-b border-[#C59B27]/40 flex items-center justify-between no-export">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#F5DC7D] font-['Cairo']">
              بطاقة التعريف الدستورية والمونوغراف الشامل • 1000 عشبة
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Export as PNG Button */}
            <button
              onClick={handleExportPng}
              disabled={isExportingPng}
              className="flex items-center gap-1 bg-[#F5DC7D] hover:bg-[#FFE899] text-[#132B20] font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-sm active:scale-95 cursor-pointer"
            >
              {exportedSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-800" />
                  <span>تم الحفظ كصورة!</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isExportingPng ? "جارِ التصدير..." : "تصدير صورة PNG"}</span>
                </>
              )}
            </button>

            {/* Print as PDF Button */}
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1 bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة / حفظ PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#E2D6B5] hover:bg-[#1C3E2F] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Exportable Monograph Body */}
        <div
          id={modalContentId}
          className="p-5 sm:p-8 overflow-y-auto custom-scrollbar space-y-5 bg-[#FBF7EE] text-[#1E2320]"
        >
          {/* Branded Official Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#C59B27]/40 pb-4 gap-4">
            <div className="text-center sm:text-right">
              <div className="inline-flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#132B20] text-[#F5DC7D]">
                  {enrichedHerb.system}
                </span>
                <span className="text-xs font-mono text-[#8C7A53] font-bold">
                  كود الفهرس: #{String(enrichedHerb.id).padStart(3, "0")}
                </span>
                {enrichedHerb.safetyLevel && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FAF0D7] text-[#8C6D1F] border border-[#E2CE9F]">
                    {enrichedHerb.safetyLevel}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-['Cairo'] text-[#132B20]">
                {enrichedHerb.nameAr}
              </h2>
              <div className="text-sm text-[#4E5F55] font-sans flex flex-wrap items-center gap-2 mt-1">
                <span className="font-semibold">{enrichedHerb.nameEn}</span>
                <span>•</span>
                <span className="italic font-serif text-[#786642]">{enrichedHerb.scientific}</span>
                {enrichedHerb.family && (
                  <>
                    <span>•</span>
                    <span className="text-xs text-slate-500">فصيلة: {enrichedHerb.family}</span>
                  </>
                )}
              </div>
            </div>

            {/* Brand Logo in Export Card */}
            <div className="bg-[#FAF4E6] p-2 rounded-2xl border border-[#D9C496]">
              <BrandLogo size="sm" showSubtitle={true} customLogoUrl={customLogoUrl} />
            </div>
          </div>

          {/* Section 1: Detailed Product Clinical Description (شرح وتوصيف شامل وموسع للمنتج) */}
          <div className="bg-[#FAF4E6] p-5 rounded-2xl border-2 border-[#D9C496] shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="font-extrabold text-sm sm:text-base text-[#132B20] flex items-center gap-2 font-['Cairo']">
                <FileText className="w-4 h-4 text-[#C59B27]" />
                <span>الشرح الصيدلاني والتوصيف الشامل للمنتج:</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#132B20] text-[#F5DC7D]">
                شرح توثيقي معتمد
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#382E19] leading-relaxed text-justify">
              {enrichedHerb.description}
            </p>
          </div>

          {/* Section 2: Physiological Mechanism of Action & Pharmacology (آلية العمل الدوائي) */}
          {enrichedHerb.pharmacology && (
            <div className="bg-[#F4EEDB] p-4 rounded-2xl border border-[#E0CFAB]">
              <h4 className="font-extrabold text-xs sm:text-sm text-[#132B20] mb-1.5 flex items-center gap-1.5 font-['Cairo']">
                <HeartPulse className="w-4 h-4 text-[#C59B27]" />
                <span>آلية العمل الدوائية والتأثير الفسيولوجي داخل الجسم:</span>
              </h4>
              <p className="text-xs sm:text-sm text-[#2A3B31] leading-relaxed">
                {enrichedHerb.pharmacology}
              </p>
            </div>
          )}

          {/* Section 3: Key Clinical Benefits & Properties */}
          {enrichedHerb.benefits && enrichedHerb.benefits.length > 0 && (
            <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E5D6B6]">
              <h4 className="font-extrabold text-xs sm:text-sm text-[#132B20] mb-2.5 flex items-center gap-1.5 font-['Cairo']">
                <Layers className="w-4 h-4 text-[#C59B27]" />
                <span>أبرز الخصائص والفوائد العلاجية المعتمدة للمنتج:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {enrichedHerb.benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-[#FCF9F2] p-2.5 rounded-xl border border-[#EADBBD]"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-[#C59B27] shrink-0 mt-0.5" />
                    <span className="text-[#2F3B33] leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Clinical Target & Therapeutic Indication */}
          <div className="bg-[#F4EEDB] p-4 rounded-2xl border border-[#E0CFAB]">
            <h4 className="font-extrabold text-xs sm:text-sm text-[#132B20] mb-1.5 flex items-center gap-1.5 font-['Cairo']">
              <FileCheck2 className="w-4 h-4 text-[#C59B27]" />
              <span>الهدف والتأثير العلاجي المعتمد (Therapeutic Target):</span>
            </h4>
            <p className="text-xs sm:text-sm text-[#2A3B31] leading-relaxed">
              {enrichedHerb.target}
            </p>
          </div>

          {/* Section 5: Active Constituents & Standard Dose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E5D6B6]">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#132B20] mb-1.5">
                <FlaskConical className="w-4 h-4 text-[#C59B27]" />
                <span>المواد الفعالة الرئيسية (Active Constituents):</span>
              </div>
              <p className="text-xs text-[#3E3219] font-medium leading-relaxed">
                {enrichedHerb.active}
              </p>
            </div>

            <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E5D6B6]">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#132B20] mb-1.5">
                <Clock className="w-4 h-4 text-[#C59B27]" />
                <span>الجرعة القياسية الموصى بها (Dosage):</span>
              </div>
              <p className="text-xs text-[#3E3219] font-medium leading-relaxed">
                {enrichedHerb.dose}
              </p>
            </div>
          </div>

          {/* Section 6: Preparation & Galenic Method */}
          {enrichedHerb.preparation && (
            <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E5D6B6]">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#132B20] mb-1">
                <BookMarked className="w-4 h-4 text-[#A07A15]" />
                <span>طريقة التحضير والاستخلاص الصيدلاني (Preparation):</span>
              </div>
              <p className="text-xs text-[#2A3B31] leading-relaxed">
                {enrichedHerb.preparation}
              </p>
            </div>
          )}

          {/* Section 7: Clinical Safety & Warnings */}
          <div className="bg-[#FFF5F5] p-4 rounded-2xl border border-[#FED7D7] text-[#742A2A]">
            <div className="flex items-center gap-1.5 font-extrabold text-xs text-[#9B2C2C] mb-1.5 font-['Cairo']">
              <ShieldCheck className="w-4 h-4 text-[#E53E3E]" />
              <span>السلامة السريرية والمحاذير (Safety & Warnings):</span>
            </div>
            <p className="text-xs leading-relaxed text-[#742A2A]">
              {enrichedHerb.safety}
            </p>

            {enrichedHerb.contraindications && (
              <div className="mt-2 pt-2 border-t border-[#FEB2B2] text-xs">
                <strong className="block text-[#9B2C2C] mb-0.5">
                  ⛔ موانع الاستعمال الصارمة:
                </strong>
                <span>{enrichedHerb.contraindications}</span>
              </div>
            )}

            {enrichedHerb.interactions && (
              <div className="mt-2 pt-2 border-t border-[#FEB2B2] text-xs">
                <strong className="block text-[#9B2C2C] mb-0.5">
                  ⚠️ أهم التداخلات الدوائية:
                </strong>
                <span>{enrichedHerb.interactions}</span>
              </div>
            )}
          </div>

          {/* Section 8: Egyptian & Traditional Heritage */}
          {enrichedHerb.historicalNote && (
            <div className="bg-[#FFF9EA] p-4 rounded-2xl border border-[#F0DDB1] text-[#654E18]">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#7B5F19] mb-1">
                <span>🏺 التراث الصيدلاني وطب الفراعنة:</span>
              </div>
              <p className="text-xs leading-relaxed font-['Amiri'] text-sm">
                {enrichedHerb.historicalNote}
              </p>
            </div>
          )}

          {/* Section 9: Authoritative Global Citations & Pharmacopoeias */}
          <div className="bg-[#FAF4E6] p-4 rounded-2xl border-2 border-[#D9C496] text-[#3A3018]">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-[#132B20] font-['Cairo']">
                <BookMarked className="w-4 h-4 text-[#C59B27]" />
                <span>المراجع والدساتير العالمية المعتمدة (Global Certified References):</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#132B20] text-[#F5DC7D]">
                موثق سريرياً
              </span>
            </div>
            <p className="text-xs text-[#4F4225] leading-relaxed font-medium">
              {enrichedHerb.references ||
                "دراسات منظمة الصحة العالمية (WHO Monographs on Selected Medicinal Plants)، دستور اللجنة الألمانية (German Commission E)، الهيئة الأوروبية للأدوية (EMA/HMPC)، دستور الأدوية الأمريكي (USP-NF)، وبردية إيبرس الطبية المصرية (Ebers Papyrus c. 1550 BCE)."}
            </p>
            <div className="mt-2 pt-2 border-t border-[#E5D7B7] flex flex-wrap gap-2 text-[10px] text-[#7A6B48]">
              <span className="bg-[#EFE5CD] px-2 py-0.5 rounded-md font-semibold">✓ WHO Monographs Vol 1-4</span>
              <span className="bg-[#EFE5CD] px-2 py-0.5 rounded-md font-semibold">✓ German Commission E</span>
              <span className="bg-[#EFE5CD] px-2 py-0.5 rounded-md font-semibold">✓ EMA/HMPC Certified</span>
              <span className="bg-[#EFE5CD] px-2 py-0.5 rounded-md font-semibold">✓ Ebers Papyrus Heritage</span>
            </div>
          </div>

          {/* Monograph Card Official Seal & Footer */}
          <div className="pt-3 border-t-2 border-[#C59B27]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#7A6B48]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-bold text-[#132B20]">صيدلية 1000 عشبة الذكية • جُمعت لأجلك</span>
              <span>•</span>
              <span>كود الوثيقة: #{String(enrichedHerb.id).padStart(4, "0")}</span>
            </div>
            <div className="text-center sm:text-left font-mono text-[10px] text-[#8C7A53]">
              الدستور النباتي والطب التكاملي السريري العالمي • صالحة للطباعة والتداول
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
