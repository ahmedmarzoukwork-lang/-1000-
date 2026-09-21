import React, { useState } from "react";
import { HerbItem } from "../types";
import {
  Scale,
  Printer,
  Image as ImageIcon,
  FlaskConical,
  Clock,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { exportElementAsPng } from "../utils/exportUtils";
import { BrandLogo } from "./BrandLogo";
import { enrichHerbWithDetailedExplanation } from "../utils/herbEnricher";

interface ComparisonTabProps {
  herbs: HerbItem[];
  customLogoUrl: string | null;
}

export const ComparisonTab: React.FC<ComparisonTabProps> = ({
  herbs,
  customLogoUrl,
}) => {
  const [selectedId1, setSelectedId1] = useState<number | string>(herbs[1]?.id || 2); // Echinacea
  const [selectedId2, setSelectedId2] = useState<number | string>(herbs[6]?.id || 7); // Ginger
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const rawHerb1 = herbs.find((h) => String(h.id) === String(selectedId1)) || herbs[0];
  const rawHerb2 = herbs.find((h) => String(h.id) === String(selectedId2)) || herbs[1] || herbs[0];

  const herb1 = enrichHerbWithDetailedExplanation(rawHerb1);
  const herb2 = enrichHerbWithDetailedExplanation(rawHerb2);

  const comparisonTableId = "clinical-comparison-export-sheet";

  const handleExportPng = async () => {
    setIsExporting(true);
    const ok = await exportElementAsPng(
      comparisonTableId,
      `مقارنة_${herb1.nameAr}_مع_${herb2.nameAr}_1000عشبة`
    );
    setIsExporting(false);
    if (ok) {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-[#FCF9F2] p-5 sm:p-7 rounded-3xl border-2 border-[#E6D8BA] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#C59B27] text-[#132B20] flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black font-['Cairo'] text-[#132B20]">
              المقارنة السريرية الرأسية للأعشاب الطبية
            </h2>
          </div>
          <p className="text-xs text-[#526358] max-w-xl leading-relaxed">
            قارن بين عشبتين جنباً إلى جنب لاختيار الأنسب للحالة السريرية استناداً إلى المواد الفعالة والجرعات ومحاذير الأمان. يمكنك طباعة المقارنة أو تصديرها كصورة PNG فورية.
          </p>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-[#F5DC7D] hover:bg-[#FFE899] text-[#132B20] font-bold px-3.5 py-2.5 rounded-xl text-xs transition shadow-sm active:scale-95"
          >
            {exportSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-800" />
                <span>تم حفظ الصورة!</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>{isExporting ? "جارِ التصدير..." : "تصدير صورة PNG"}</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-bold px-3.5 py-2.5 rounded-xl text-xs transition shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / PDF</span>
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
        <div className="bg-[#FAF4E6] p-4 rounded-2xl border-2 border-[#E5D6B6] space-y-1.5">
          <label className="block text-xs font-black text-[#132B20] font-['Cairo']">
            اختر العشبة الأولى (الطرف الأيمن):
          </label>
          <select
            value={selectedId1}
            onChange={(e) => setSelectedId1(e.target.value)}
            className="w-full bg-white border border-[#D1B881] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#132B20] focus:outline-none focus:border-[#C59B27]"
          >
            {herbs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nameAr} ({h.nameEn}) - {h.system}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-[#FAF4E6] p-4 rounded-2xl border-2 border-[#E5D6B6] space-y-1.5">
          <label className="block text-xs font-black text-[#132B20] font-['Cairo']">
            اختر العشبة الثانية (الطرف الأيسر):
          </label>
          <select
            value={selectedId2}
            onChange={(e) => setSelectedId2(e.target.value)}
            className="w-full bg-white border border-[#D1B881] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#132B20] focus:outline-none focus:border-[#C59B27]"
          >
            {herbs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nameAr} ({h.nameEn}) - {h.system}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Printable & Exportable Comparison Sheet */}
      <div
        id={comparisonTableId}
        className="bg-[#FFFDF7] rounded-3xl border-2 border-[#C59B27] overflow-hidden shadow-md p-4 sm:p-6 space-y-4"
      >
        {/* Branded Sheet Header */}
        <div className="flex items-center justify-between border-b-2 border-[#C59B27]/40 pb-3">
          <div>
            <h3 className="font-black text-lg font-['Cairo'] text-[#132B20]">
              بطاقة المقارنة السريرية المعيارية
            </h3>
            <span className="text-[11px] text-[#6D5A32] font-['Amiri']">
              موسوعة 1000 عشبة الذكية • دستور النباتات الطبية
            </span>
          </div>
          <BrandLogo size="sm" showSubtitle={false} customLogoUrl={customLogoUrl} />
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-[#132B20] text-[#FBF7EE]">
                <th className="p-3 font-['Cairo'] font-bold border-b border-[#C59B27]/30 w-1/4">
                  معيار المقارنة
                </th>
                <th className="p-3 font-['Cairo'] font-black border-b border-[#C59B27]/30 w-[37.5%] text-[#F5DC7D]">
                  {herb1.nameAr}
                  <span className="block text-[10px] font-sans font-normal text-[#E2D6B5] opacity-90">
                    {herb1.scientific}
                  </span>
                </th>
                <th className="p-3 font-['Cairo'] font-black border-b border-[#C59B27]/30 w-[37.5%] text-[#F5DC7D]">
                  {herb2.nameAr}
                  <span className="block text-[10px] font-sans font-normal text-[#E2D6B5] opacity-90">
                    {herb2.scientific}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADEC5] text-[#242F28]">
              <tr>
                <td className="p-3 font-bold bg-[#F4EEDB] text-[#132B20]">الجهاز الحيوي</td>
                <td className="p-3">
                  <span className="bg-[#132B20] text-[#F5DC7D] px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                    {herb1.system}
                  </span>
                </td>
                <td className="p-3">
                  <span className="bg-[#132B20] text-[#F5DC7D] px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                    {herb2.system}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-[#F4EEDB] text-[#132B20]">شرح وتوصيف المنتج</td>
                <td className="p-3 leading-relaxed text-[11px] text-[#3A3018]">{herb1.description}</td>
                <td className="p-3 leading-relaxed text-[11px] text-[#3A3018]">{herb2.description}</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-[#F4EEDB] text-[#132B20]">آلية العمل الدوائية</td>
                <td className="p-3 leading-relaxed text-[11px] text-[#2E3B33]">{herb1.pharmacology || "—"}</td>
                <td className="p-3 leading-relaxed text-[11px] text-[#2E3B33]">{herb2.pharmacology || "—"}</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-[#F4EEDB] text-[#132B20]">التأثير العلاجي</td>
                <td className="p-3 leading-relaxed">{herb1.target}</td>
                <td className="p-3 leading-relaxed">{herb2.target}</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-[#F4EEDB] text-[#132B20]">المادة الفعالة</td>
                <td className="p-3 font-semibold text-[#8C6914]">{herb1.active}</td>
                <td className="p-3 font-semibold text-[#8C6914]">{herb2.active}</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-[#F4EEDB] text-[#132B20]">الجرعة القياسية</td>
                <td className="p-3 leading-relaxed">{herb1.dose}</td>
                <td className="p-3 leading-relaxed">{herb2.dose}</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-[#F4EEDB] text-[#132B20]">درجة الأمان</td>
                <td className="p-3 font-bold">{herb1.safetyLevel || "آمن جداً"}</td>
                <td className="p-3 font-bold">{herb2.safetyLevel || "آمن جداً"}</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-[#F4EEDB] text-[#132B20]">المحاذير والموانع</td>
                <td className="p-3 text-rose-900 bg-rose-50/40 leading-relaxed text-[11px]">
                  {herb1.safety}
                </td>
                <td className="p-3 text-rose-900 bg-rose-50/40 leading-relaxed text-[11px]">
                  {herb2.safety}
                </td>
              </tr>
              {herb1.arabicHeritageCitation || herb2.arabicHeritageCitation ? (
                <tr className="bg-[#FFFBF0]/60">
                  <td className="p-3 font-bold bg-[#F4EEDB] text-[#132B20]">
                    التراث الطبي العربي (الطب النبوي وابن سينا)
                  </td>
                  <td className="p-3 text-[#543E10] font-['Amiri'] text-xs leading-relaxed">
                    {herb1.arabicHeritageCitation || "—"}
                  </td>
                  <td className="p-3 text-[#543E10] font-['Amiri'] text-xs leading-relaxed">
                    {herb2.arabicHeritageCitation || "—"}
                  </td>
                </tr>
              ) : null}
              {herb1.historicalNote || herb2.historicalNote ? (
                <tr>
                  <td className="p-3 font-bold bg-[#F4EEDB] text-[#132B20]">التراث الفرعوني</td>
                  <td className="p-3 text-[#7B5F19] italic font-['Amiri']">
                    {herb1.historicalNote || "—"}
                  </td>
                  <td className="p-3 text-[#7B5F19] italic font-['Amiri']">
                    {herb2.historicalNote || "—"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Sheet Footer */}
        <div className="pt-2 border-t border-[#E8DCBF] flex justify-between items-center text-[10px] text-[#7A6B48]">
          <span>صيدلية 1000 عشبة • تم التوليد بنجاح</span>
          <span>طبع محلياً من السجل الموثق</span>
        </div>
      </div>
    </div>
  );
};
