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
  arabicHeritageCitation?: string; // توثيق واقتباس من كتب التراث العربي والإسلامي (الطب النبوي، القانون لابن سينا، تذكرة داود)
  references?: string; // المراجع والدساتير العالمية والعربية المعتمدة
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
  traditionalNote?: string; // محاذير وتوصيات أطباء التراث العربي القدامى (ابن سينا وابن القيم)
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
  arabicHeritageAdvice?: string; // هدي الطب النبوي وتوجيهات ابن سينا في القانون للحالة
  references?: string; // المصادر الصيدلانية والتراثية المعتمدة
}

export interface DailyReminder {
  id: string;
  herbId: number | string;
  herbNameAr: string;
  herbScientific?: string;
  time: string; // HH:MM in 24h format (e.g., "08:30")
  dose?: string; // e.g. "ملعقة صغيرة مغلاة في 200 مل ماء"
  timingNote?: string; // e.g. "على الريق صباحاً", "بعد وجبة الغداء", "قبل النوم"
  isActive: boolean;
  daysOfWeek?: number[]; // [0,1,2,3,4,5,6] (0 = Sunday), empty/undefined = daily
  soundEnabled?: boolean;
  browserNotifyEnabled?: boolean;
  createdAt: string;
  lastTakenDate?: string; // ISO date string when user clicked "تم التناول"
}

