export interface HerbItem {
  id: number | string;
  nameAr: string;
  nameEn: string;
  scientific: string;
  family?: string;
  system: string;
  target: string;
  active: string;
  dose: string;
  preparation?: string;
  safety: string;
  safetyLevel?: "آمن جداً" | "حذر معتدل" | "عالي الخطورة ويشترط إشراف طبي" | string;
  contraindications?: string;
  interactions?: string;
  historicalNote?: string;
  references?: string; // المراجع والدساتير العالمية المعتمدة
  isCustom?: boolean; // added via AI or user
  addedAt?: string;
  description?: string; // شرح وتوصيف صيدلاني وسريري متكامل للمنتج
  pharmacology?: string; // آلية العمل والتأثير الفسيولوجي داخل الجسم
  benefits?: string[]; // أهم الخصائص والفوائد العلاجية
}

export type ViewTab = "catalog" | "add-ai" | "comparison" | "checker" | "advisor" | "backup";

export interface DrugCheckResult {
  riskLevel: string;
  riskColor?: string;
  mechanism: string;
  clinicalAdvice: string;
  spacingHours?: string;
  summary: string;
  references?: string; // المراجع السريرية المعتمدة
}

export interface RemedyProtocol {
  title: string;
  recommendedHerbs: {
    herbName: string;
    role: string;
    doseAndUsage: string;
  }[];
  preparationGuide: string;
  precautions: string;
  lifestyleTip?: string;
  references?: string; // المصادر الصيدلانية المعتمدة
}
