import { HerbItem } from "../types";

/**
 * Generates an in-depth clinical description and pharmacological breakdown
 * for any herb if not already explicitly provided.
 */
export function enrichHerbWithDetailedExplanation(herb: HerbItem): HerbItem {
  // If the herb already has a rich description (> 50 chars), keep it intact
  const hasRichDescription =
    herb.description && herb.description.trim().length > 50;

  if (hasRichDescription && herb.pharmacology && herb.benefits && herb.benefits.length > 0) {
    return herb;
  }

  const name = herb.nameAr;
  const scientific = herb.scientific ? ` (${herb.scientific})` : "";
  const system = herb.system || "الصحة العامة";
  const target = herb.target || "تحسين الوظائف الحيوية ودعم توازن الجسم";
  const active = herb.active || "مركبات فلافونويدية وزيوت طيارة فعالة";
  const prep = herb.preparation || "مستخلص عشبي أو منقوع دافئ";
  const dose = herb.dose || "وفق الإرشادات القياسية المعتمدة";

  // Comprehensive Clinical Product Description
  const generatedDescription =
    herb.description && herb.description.trim().length > 30
      ? herb.description.trim()
      : `يُعد منتج ${name}${scientific} من أبرز النباتات الطبية المعتمدة في دساتير الأعشاب العالمية لدعم ${system}. يتميز هذا المستحضر النباتي باحتوائه على تركيزات علاجية عالية من ${active}، والتي تعمل بتناغم حيوي لتحقيق ${target}. يُقدم هذا المنتج حلاً علاجياً تكاملياً مدعوماً بالأدلة السريرية، حيث يسهم تناوله المنتظم بجرعة (${dose}) وتحضيره عبر (${prep}) في تعزيز الاستجابة الفسيولوجية الطبيعية للأنسجة وتنشيط الدفاعات الحيوية للجسم دون إجهاد المسارات الأيضية.`;

  // Pharmacological Mechanism of Action
  const generatedPharmacology =
    herb.pharmacology && herb.pharmacology.trim().length > 20
      ? herb.pharmacology.trim()
      : `تعتمد آلية التأثير الدوائي لـ ${name} على التفاعل المباشر لمركبات ${active} مع المستقبلات الخلوية ومسارات التأشير الإنزيمية في ${system}، مما يثبط السيتوكينات الالتهابية ويعدل النشاط التأكسدي، مما يؤدي إلى ${target} مع استقرار التوازن الهرموني والأيضي الداخلي.`;

  // Key Clinical Benefits (3-4 structured bullet points)
  let generatedBenefits = herb.benefits;
  if (!generatedBenefits || generatedBenefits.length === 0) {
    generatedBenefits = [
      `الاستهداف العلاجي المباشر: ${target}`,
      `التأثير الفسيولوجي: تنشيط وتعديل مسارات ${system} بفضل وفرة ${active}`,
      `الكفاءة الحيوية: تركيبة صيدلانية طبيعية تعتمد أسلوب (${prep}) لضمان أقصى امتصاص`,
      `التوافق والأمان: تصنيف سريري بدرجة (${herb.safetyLevel || "آمن سريرياً"}) مع توثيق في الدساتير العالمية`,
    ];
  }

  return {
    ...herb,
    description: generatedDescription,
    pharmacology: generatedPharmacology,
    benefits: generatedBenefits,
  };
}

/**
 * Enriches an array of herbs ensuring 100% of items have full detailed descriptions.
 */
export function enrichHerbsList(herbs: HerbItem[]): HerbItem[] {
  return herbs.map(enrichHerbWithDetailedExplanation);
}
