import React from "react";
import {
  Globe,
  Building2,
  FileCheck2,
  Scroll,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Scale,
} from "lucide-react";

export const GLOBAL_SCIENTIFIC_SOURCES = [
  {
    authority: "منظمة الصحة العالمية",
    authorityEn: "World Health Organization (WHO)",
    document: "دراسات WHO النباتية السريرية",
    documentEn: "WHO Monographs on Selected Medicinal Plants (Vols 1–4)",
    icon: Globe,
    tag: "دستور أممي معتمد",
  },
  {
    authority: "الهيئة الأوروبية للأدوية",
    authorityEn: "European Medicines Agency (EMA)",
    document: "لجنة المنتجات العشبية الطبية",
    documentEn: "EMA / HMPC Community Herbal Monographs",
    icon: Building2,
    tag: "معايير الاتحاد الأوروبي",
  },
  {
    authority: "اللجنة الألمانية للأعشاب",
    authorityEn: "German Commission E",
    document: "دستور لجنة E لتقييم سلامة النباتات",
    documentEn: "German Commission E Monographs on Phytotherapy",
    icon: Scale,
    tag: "المرجع الذهبي السريري",
  },
  {
    authority: "دستور الأدوية الأمريكي",
    authorityEn: "United States Pharmacopeia",
    document: "مجموعة المكملات النباتية المعتمدة",
    documentEn: "USP-NF Dietary Supplements Compendium",
    icon: FileCheck2,
    tag: "المعيار الأمريكي الرسمي",
  },
  {
    authority: "التعاونية الأوروبية للعلاج بالنباتات",
    authorityEn: "ESCOP",
    document: "دراسات الفعالية والسلامة السريرية",
    documentEn: "ESCOP Monographs on the Medicinal Uses of Plant Drugs",
    icon: BookOpen,
    tag: "أبحاث سريرية أوروبية",
  },
  {
    authority: "الطب المصري القديم وبردية إيبرس",
    authorityEn: "Ebers & Kahun Papyrus (c. 1550 BCE)",
    document: "أقدم دستور صيدلاني نباتي في تاريخ البشرية",
    documentEn: "Ancient Egyptian Pharmacopoeia & Herbal Formulas",
    icon: Scroll,
    tag: "التراث الصيدلاني الأصيل",
  },
  {
    authority: "المكتبة الوطنية الأمريكية للطب",
    authorityEn: "National Library of Medicine (PubMed / NIH)",
    document: "أبحاث وتجارب المركز الوطني للتكامل الطبي",
    documentEn: "NCNIH & PubMed Peer-Reviewed Clinical Trials",
    icon: ShieldCheck,
    tag: "تجارب سريرية محكمة",
  },
  {
    authority: "مرجع ستوكلي للتداخلات الدوائية",
    authorityEn: "Stockley's Herbal Medicines Interactions",
    document: "المرجع الإكلينيكي المعتمد لسلامة الأدوية",
    documentEn: "Pharmaceutical Press (London) Interaction Database",
    icon: CheckCircle2,
    tag: "أمان التداخلات الدوائية",
  },
];

interface ScientificSourcesFooterProps {
  compact?: boolean;
}

export const ScientificSourcesFooter: React.FC<ScientificSourcesFooterProps> = ({
  compact = false,
}) => {
  return (
    <section className="bg-[#FAF4E6] rounded-3xl border-2 border-[#D9C496] p-5 sm:p-7 shadow-sm mt-8 no-print">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6D8BA]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#132B20] text-[#F5DC7D] flex items-center justify-center font-bold shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#C59B27]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black font-['Cairo'] text-[#132B20]">
              المراجع والدساتير الطبية العالمية المعتمدة
            </h3>
            <p className="text-xs text-[#6F5E37] font-['Amiri']">
              تُستحضر بيانات موسوعة "1000 عشبة" وتوثيقات الذكاء الاصطناعي وفق أرقى المعايير الصيدلانية السريرية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#132B20] text-[#F5DC7D] font-bold text-[11px] shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>توثيق سريري موحد</span>
          </span>
        </div>
      </div>

      {/* Grid of Sources */}
      <div
        className={`grid grid-cols-1 ${
          compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"
        } gap-3 pt-4`}
      >
        {GLOBAL_SCIENTIFIC_SOURCES.map((source, index) => {
          const Icon = source.icon;
          return (
            <div
              key={index}
              className="bg-[#FCF9F2] rounded-2xl p-3.5 border border-[#E8DAC0] hover:border-[#C59B27] transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-[#132B20]/10 text-[#132B20] group-hover:bg-[#132B20] group-hover:text-[#F5DC7D] flex items-center justify-center transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EDE2C8] text-[#55441E]">
                    {source.tag}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-[#132B20] font-['Cairo'] group-hover:text-[#9A7B1C] transition-colors leading-tight">
                  {source.authority}
                </h4>
                <p className="text-[10px] text-[#7A6B48] font-sans italic mt-0.5 line-clamp-1">
                  {source.authorityEn}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#EDE2C8]/70 text-[11px] text-[#332A15]">
                <p className="font-medium leading-tight">{source.document}</p>
                <p className="text-[9px] text-slate-500 font-sans mt-0.5 line-clamp-1">
                  {source.documentEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ethical & Clinical Advisory Disclaimer */}
      <div className="mt-4 pt-3 border-t border-[#E6D8BA] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6F5E37]">
        <p className="leading-relaxed text-center sm:text-right">
          <strong className="text-[#132B20]">إخلاء مسؤولية سريري: </strong>
          المعلومات الواردة لأغراض التثقيف الصيدلاني والتكامل الطبي القائم على الدليل؛ ولا تغني عن استشارة الطبيب المعالج أو الصيدلي السريري للحالات المزمنة أو أثناء الحمل واستخدام الأدوية الحرجة.
        </p>
        <span className="shrink-0 text-[10px] font-mono text-[#8C7A53] font-bold bg-[#EFE6CF] px-2.5 py-1 rounded-lg">
          ISO & WHO Guidelines Compliant
        </span>
      </div>
    </section>
  );
};
