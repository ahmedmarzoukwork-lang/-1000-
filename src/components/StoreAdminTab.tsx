import React, { useState, useMemo } from "react";
import { HerbItem, StoreConfig } from "../types";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Coins,
  Package,
  Layers,
  Phone,
  Eye,
  RefreshCw,
  X,
  Play,
  Pause,
  SlidersHorizontal,
  FileSpreadsheet,
  Percent,
  TrendingUp,
  Calculator,
  Zap,
  Check,
  Image as ImageIcon,
} from "lucide-react";

interface StoreAdminTabProps {
  herbs: HerbItem[];
  storeConfig: StoreConfig;
  onUpdateStoreConfig: (newConfig: StoreConfig) => void;
  onUpdateHerb: (updatedHerb: HerbItem) => void;
  onBatchUpdateHerbs?: (updatedHerbs: HerbItem[]) => void;
  onDeleteHerb: (herbId: string | number) => void;
  onAddHerb: (newHerb: HerbItem) => void;
  onOpenHerbDetails: (herb: HerbItem) => void;
  onNavigateToBackup: () => void;
}

export const StoreAdminTab: React.FC<StoreAdminTabProps> = ({
  herbs,
  storeConfig,
  onUpdateStoreConfig,
  onUpdateHerb,
  onBatchUpdateHerbs,
  onDeleteHerb,
  onAddHerb,
  onOpenHerbDetails,
  onNavigateToBackup,
}) => {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSystem, setSelectedSystem] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "inStock" | "outOfStock">("all");
  const [aiFilter, setAiFilter] = useState<"all" | "needsAi" | "hasAi">("all");

  // Inline Quick Price Editing State: { [herbId]: priceValue }
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
  const [savedPriceNotice, setSavedPriceNotice] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [herbToDelete, setHerbToDelete] = useState<HerbItem | null>(null);
  const [herbToEdit, setHerbToEdit] = useState<HerbItem | null>(null);

  // Single Herb AI Generating state: herbId being generated
  const [generatingHerbId, setGeneratingHerbId] = useState<string | number | null>(null);

  // Bulk AI Review Runner State
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<HerbItem[]>([]);
  const [bulkCurrentIndex, setBulkCurrentIndex] = useState(0);
  const [bulkStatusText, setBulkStatusText] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);

  // New Herb Form State
  const [newHerbName, setNewHerbName] = useState("");
  const [newHerbScientific, setNewHerbScientific] = useState("");
  const [newHerbSystem, setNewHerbSystem] = useState("الهضم والكبد");
  const [newHerbPrice, setNewHerbPrice] = useState<number>(45);
  const [newHerbInStock, setNewHerbInStock] = useState(true);
  const [newHerbDescription, setNewHerbDescription] = useState("");
  const [newHerbImageUrl, setNewHerbImageUrl] = useState<string>("");
  const [isGeneratingNewHerbAi, setIsGeneratingNewHerbAi] = useState(false);
  const [isGeneratingNewHerbImage, setIsGeneratingNewHerbImage] = useState(false);
  const [newHerbError, setNewHerbError] = useState<string | null>(null);

  // Edit Herb Image Generating State
  const [isGeneratingEditImage, setIsGeneratingEditImage] = useState(false);
  const [generatingImageHerbId, setGeneratingImageHerbId] = useState<string | number | null>(null);

  // Config Form State
  const [tempConfig, setTempConfig] = useState<StoreConfig>({ ...storeConfig });

  // Markup Percentage & Bulk Price Updating State
  const [markupPercentage, setMarkupPercentage] = useState<number>(() => storeConfig.markupPercentage ?? 25);
  const [showBulkMarkupModal, setShowBulkMarkupModal] = useState<boolean>(false);
  const [roundToNearestRiyal, setRoundToNearestRiyal] = useState<boolean>(true);
  const [updatePackagesProportionally, setUpdatePackagesProportionally] = useState<boolean>(true);
  const [markupScope, setMarkupScope] = useState<"all" | "importedOnly">("all");
  const [isApplyingBulkMarkup, setIsApplyingBulkMarkup] = useState<boolean>(false);
  const [markupSavedNotice, setMarkupSavedNotice] = useState<string | null>(null);

  // Save default markup percentage to store config
  const handleSaveMarkupPercentage = (newPercentage: number) => {
    setMarkupPercentage(newPercentage);
    const updatedConfig = { ...storeConfig, markupPercentage: newPercentage };
    onUpdateStoreConfig(updatedConfig);
    setMarkupSavedNotice(`تم حفظ هامش الربح (${newPercentage}%) كإعداد افتراضي للمتجر!`);
    setTimeout(() => setMarkupSavedNotice(null), 3500);
  };

  // Preview sample herbs for bulk markup modal
  const previewSampleHerbs = useMemo(() => {
    if (herbs.length === 0) return [];
    const samples = [
      herbs[0],
      herbs[Math.floor(herbs.length / 3)],
      herbs[Math.floor((herbs.length * 2) / 3)],
      herbs[herbs.length - 1],
    ].filter(Boolean);
    return Array.from(new Set(samples));
  }, [herbs]);

  // Execute One-Click Bulk Markup on all herbs
  const handleExecuteBulkMarkup = () => {
    setIsApplyingBulkMarkup(true);
    try {
      const targetHerbs =
        markupScope === "importedOnly"
          ? herbs.filter(
              (h) =>
                h.isCustom ||
                String(h.id).startsWith("sheet_") ||
                String(h.id).startsWith("sheet-")
            )
          : herbs;

      const targetIds = new Set(targetHerbs.map((h) => String(h.id)));

      const updatedHerbs = herbs.map((herb) => {
        if (!targetIds.has(String(herb.id))) return herb;

        const base = herb.price && herb.price > 0 ? herb.price : 45;
        const rawNewPrice = base * (1 + markupPercentage / 100);
        const finalBasePrice = roundToNearestRiyal
          ? Math.max(1, Math.round(rawNewPrice))
          : Math.max(1, Number(rawNewPrice.toFixed(2)));

        const updatedPackages = updatePackagesProportionally
          ? [
              { label: "عبوة 100 جم (عشب عضوي نقي)", price: finalBasePrice },
              {
                label: "عبوة 250 جم (توفيرية ممتازة)",
                price: Math.round(finalBasePrice * 2.2),
              },
              {
                label: "عبوة 500 جم (نصف كيلو فاخر)",
                price: Math.round(finalBasePrice * 4.1),
              },
              {
                label: "خلاصة مركزة (قطارة صيدلانية 50 مل)",
                price: Math.round(finalBasePrice * 1.6),
              },
            ]
          : herb.packageOptions;

        return {
          ...herb,
          price: finalBasePrice,
          packageOptions: updatedPackages,
        };
      });

      if (onBatchUpdateHerbs) {
        onBatchUpdateHerbs(updatedHerbs);
      } else {
        updatedHerbs.forEach((h) => onUpdateHerb(h));
      }

      setShowBulkMarkupModal(false);
      setSavedPriceNotice(
        `🎉 تم بنجاح تحديث أسعار ${targetHerbs.length} عشبة وفق هامش ربح +${markupPercentage}%!`
      );
      setTimeout(() => setSavedPriceNotice(null), 4000);
    } finally {
      setIsApplyingBulkMarkup(false);
    }
  };

  // System Categories
  const systemOptions = [
    "الكل",
    "الهضم والكبد",
    "المناعة",
    "التنفس والقلب",
    "الأعصاب والتكيف",
    "الهرمونات والصحة العامة",
    "المفاصل والكلى",
    "مغذية ووقائية",
    "الجلد والتجميل",
  ];

  // Helper: Detect if herb has tailored AI identity card
  const hasCustomAiCard = (h: HerbItem) => {
    // If it has tailored pharmacology, benefits, or custom description not containing fallback defaults
    const hasDesc = !!h.description && h.description.length > 50 && !h.description.includes("مركبات فلافونويدية وزيوت طيارة فعالة");
    const hasActive = !!h.active && h.active.length > 3 && !h.active.includes("مركبات فلافونويدية وزيوت طيارة فعالة");
    const hasPrice = typeof h.price === "number" && h.price > 0;
    return hasDesc && hasActive && hasPrice;
  };

  // Filtered Herbs
  const filteredHerbs = useMemo(() => {
    return herbs.filter((herb) => {
      const matchSearch =
        !searchQuery ||
        herb.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (herb.scientific && herb.scientific.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (herb.nameEn && herb.nameEn.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSystem = selectedSystem === "all" || herb.system === selectedSystem;

      const isInStock = herb.inStock !== false;
      const matchStock =
        stockFilter === "all" ||
        (stockFilter === "inStock" && isInStock) ||
        (stockFilter === "outOfStock" && !isInStock);

      const hasAi = hasCustomAiCard(herb);
      const matchAi =
        aiFilter === "all" ||
        (aiFilter === "needsAi" && !hasAi) ||
        (aiFilter === "hasAi" && hasAi);

      return matchSearch && matchSystem && matchStock && matchAi;
    });
  }, [herbs, searchQuery, selectedSystem, stockFilter, aiFilter]);

  // Statistics KPIs
  const totalHerbsCount = herbs.length;
  const inStockCount = herbs.filter((h) => h.inStock !== false).length;
  const withAiCount = herbs.filter(hasCustomAiCard).length;
  const needsAiCount = totalHerbsCount - withAiCount;
  const avgPrice = useMemo(() => {
    if (herbs.length === 0) return 0;
    const total = herbs.reduce((acc, h) => acc + (h.price || 45), 0);
    return Math.round(total / herbs.length);
  }, [herbs]);

  // Handle Quick Inline Price Save
  const handleSavePrice = (herb: HerbItem) => {
    const newPriceVal = editingPrices[herb.id] !== undefined ? editingPrices[herb.id] : (herb.price || 45);
    if (newPriceVal <= 0) return;

    const basePrice = Math.round(newPriceVal);
    const updatedPackages = [
      { label: "عبوة 100 جم (عشب عضوي نقي)", price: basePrice },
      { label: "عبوة 250 جم (توفيرية ممتازة)", price: Math.round(basePrice * 2.2) },
      { label: "عبوة 500 جم (نصف كيلو فاخر)", price: Math.round(basePrice * 4.1) },
      { label: "خلاصة مركزة (قطارة صيدلانية 50 مل)", price: Math.round(basePrice * 1.5) },
    ];

    const updated = {
      ...herb,
      price: basePrice,
      packageOptions: updatedPackages,
    };

    onUpdateHerb(updated);
    setSavedPriceNotice(`تم حفظ سعر "${herb.nameAr}" بنجاح (${basePrice} ${storeConfig.currency})`);
    setTimeout(() => setSavedPriceNotice(null), 3000);
  };

  // Handle Stock Toggle
  const handleToggleStock = (herb: HerbItem) => {
    const currentStock = herb.inStock !== false;
    const updated = {
      ...herb,
      inStock: !currentStock,
    };
    onUpdateHerb(updated);
  };

  // Single Herb AI Monograph Review Call
  const handleEnrichSingleHerb = async (herb: HerbItem) => {
    try {
      setGeneratingHerbId(herb.id);
      const res = await fetch("/api/gemini/review-enrich-herb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          herbName: herb.nameAr,
          existingData: {
            scientific: herb.scientific,
            system: herb.system,
            target: herb.target,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.card) {
        throw new Error(data.error || "فشل توليد البطاقة بالذكاء الاصطناعي");
      }

      const card = data.card;
      const updatedHerb: HerbItem = {
        ...herb,
        nameAr: card.nameAr || herb.nameAr,
        nameEn: card.nameEn || herb.nameEn || "",
        scientific: card.scientific || herb.scientific || "",
        family: card.family || herb.family || "",
        system: card.system || herb.system || "المناعة",
        target: card.target || herb.target || "",
        active: card.active || herb.active || "",
        dose: card.dose || herb.dose || "",
        preparation: card.preparation || herb.preparation || "",
        safety: card.safety || herb.safety || "",
        safetyLevel: card.safetyLevel || herb.safetyLevel || "آمن جداً",
        contraindications: card.contraindications || herb.contraindications || "",
        interactions: card.interactions || herb.interactions || "",
        historicalNote: card.historicalNote || herb.historicalNote || "",
        arabicHeritageCitation: card.arabicHeritageCitation || herb.arabicHeritageCitation || "",
        references: card.references || herb.references || "",
        description: card.description || herb.description || "",
        pharmacology: card.pharmacology || herb.pharmacology || "",
        benefits: card.benefits || herb.benefits || [],
        price: card.price || herb.price || 45,
        packageOptions: card.packageOptions || herb.packageOptions,
        inStock: herb.inStock !== false,
      };

      onUpdateHerb(updatedHerb);
      setSavedPriceNotice(`✨ تم توليد بطاقة تعريف وسعر مخصص للصنف "${herb.nameAr}" بنجاح!`);
      setTimeout(() => setSavedPriceNotice(null), 3500);
    } catch (err: any) {
      alert(`حدث خطأ أثناء المراجعة بالذكاء الاصطناعي: ${err.message || err}`);
    } finally {
      setGeneratingHerbId(null);
    }
  };

  // Generate realistic botanical Imagen image for a single herb
  const handleGenerateSingleHerbImage = async (herb: HerbItem) => {
    try {
      setGeneratingImageHerbId(herb.id);
      const res = await fetch("/api/gemini/generate-herb-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          herbName: herb.nameAr,
          scientific: herb.scientific,
          system: herb.system,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || "فشل توليد صورة واقعية للعشبة");
      }

      const updated = {
        ...herb,
        imageUrl: data.imageUrl,
      };
      onUpdateHerb(updated);
      setSavedPriceNotice(`🎨 تم توليد صورة واقعية بتقنية Imagen للعشبة "${herb.nameAr}" بنجاح!`);
      setTimeout(() => setSavedPriceNotice(null), 3500);
    } catch (err: any) {
      alert(`حدث خطأ أثناء توليد الصورة: ${err.message || err}`);
    } finally {
      setGeneratingImageHerbId(null);
    }
  };

  // Generate realistic image for Add Herb modal
  const handleGenerateNewHerbImage = async () => {
    if (!newHerbName.trim()) {
      setNewHerbError("يرجى إدخال اسم العشبة بالعربية أولاً لتوليد صورتها");
      return;
    }
    setIsGeneratingNewHerbImage(true);
    setNewHerbError(null);
    try {
      const res = await fetch("/api/gemini/generate-herb-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          herbName: newHerbName,
          scientific: newHerbScientific,
          system: newHerbSystem,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.imageUrl) {
        setNewHerbImageUrl(data.imageUrl);
      } else {
        throw new Error(data.error || "تعذر توليد الصورة");
      }
    } catch (err: any) {
      alert(`خطأ توليد الصورة: ${err.message || err}`);
    } finally {
      setIsGeneratingNewHerbImage(false);
    }
  };

  // Generate realistic image for Edit Herb modal
  const handleGenerateEditHerbImage = async () => {
    if (!herbToEdit) return;
    setIsGeneratingEditImage(true);
    try {
      const res = await fetch("/api/gemini/generate-herb-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          herbName: herbToEdit.nameAr,
          scientific: herbToEdit.scientific,
          system: herbToEdit.system,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.imageUrl) {
        setHerbToEdit({
          ...herbToEdit,
          imageUrl: data.imageUrl,
        });
        setSavedPriceNotice("🎨 تم توليد صورة واقعية جديدة للعشبة بنجاح!");
        setTimeout(() => setSavedPriceNotice(null), 3000);
      } else {
        throw new Error(data.error || "تعذر توليد الصورة");
      }
    } catch (err: any) {
      alert(`خطأ توليد الصورة: ${err.message || err}`);
    } finally {
      setIsGeneratingEditImage(false);
    }
  };

  // Launch Bulk AI Review Runner
  const handleStartBulkReview = (onlyNeedsAi: boolean) => {
    const queue = onlyNeedsAi ? herbs.filter((h) => !hasCustomAiCard(h)) : [...herbs];
    if (queue.length === 0) {
      alert("كافة الأصناف لديها بالفعل بطاقات تعريفية مخصصة وأسعار مسجلة!");
      return;
    }
    setBulkQueue(queue);
    setBulkCurrentIndex(0);
    setIsBulkRunning(true);
    setShowBulkModal(true);
    processNextBulkItem(queue, 0);
  };

  const processNextBulkItem = async (queue: HerbItem[], index: number) => {
    if (index >= queue.length) {
      setIsBulkRunning(false);
      setBulkStatusText("🎉 اكتملت مراجعة وتوليد البطاقات لكافة الأصناف بنجاح!");
      return;
    }

    const item = queue[index];
    setBulkCurrentIndex(index + 1);
    setBulkStatusText(`جاري مراجعة النبتة (${index + 1}/${queue.length}): "${item.nameAr}" واستخراج بطاقتها وسعرها...`);

    try {
      const res = await fetch("/api/gemini/review-enrich-herb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          herbName: item.nameAr,
          existingData: {
            scientific: item.scientific,
            system: item.system,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.card) {
        const card = data.card;
        const updatedHerb: HerbItem = {
          ...item,
          nameAr: card.nameAr || item.nameAr,
          nameEn: card.nameEn || item.nameEn || "",
          scientific: card.scientific || item.scientific || "",
          family: card.family || item.family || "",
          system: card.system || item.system || "المناعة",
          target: card.target || item.target || "",
          active: card.active || item.active || "",
          dose: card.dose || item.dose || "",
          preparation: card.preparation || item.preparation || "",
          safety: card.safety || item.safety || "",
          safetyLevel: card.safetyLevel || item.safetyLevel || "آمن جداً",
          contraindications: card.contraindications || item.contraindications || "",
          interactions: card.interactions || item.interactions || "",
          historicalNote: card.historicalNote || item.historicalNote || "",
          arabicHeritageCitation: card.arabicHeritageCitation || item.arabicHeritageCitation || "",
          references: card.references || item.references || "",
          description: card.description || item.description || "",
          pharmacology: card.pharmacology || item.pharmacology || "",
          benefits: card.benefits || item.benefits || [],
          price: card.price || 45,
          packageOptions: card.packageOptions,
          inStock: item.inStock !== false,
        };
        onUpdateHerb(updatedHerb);
      }
    } catch (e) {
      console.error("Bulk item review error:", e);
    }

    // Small delay between calls to preserve server resilience
    setTimeout(() => {
      processNextBulkItem(queue, index + 1);
    }, 600);
  };

  // AI Autofill for Add New Herb Modal
  const handleAutoFillNewHerbAi = async () => {
    if (!newHerbName.trim()) {
      setNewHerbError("يرجى كتابة اسم العشبة بالعربية أولاً لتوليد بياناتها");
      return;
    }
    setNewHerbError(null);
    setIsGeneratingNewHerbAi(true);

    try {
      const res = await fetch("/api/gemini/review-enrich-herb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          herbName: newHerbName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.card) {
        throw new Error(data.error || "تعذر توليد البيانات بالذكاء الاصطناعي");
      }

      const card = data.card;
      setNewHerbName(card.nameAr || newHerbName);
      setNewHerbScientific(card.scientific || "");
      if (card.system) setNewHerbSystem(card.system);
      if (card.suggestedPrice) setNewHerbPrice(Math.round(card.suggestedPrice));
      if (card.description) setNewHerbDescription(card.description);
    } catch (err: any) {
      setNewHerbError(`خطأ: ${err.message || err}`);
    } finally {
      setIsGeneratingNewHerbAi(false);
    }
  };

  // Submit Add Herb Form
  const handleCreateNewHerb = () => {
    if (!newHerbName.trim()) {
      setNewHerbError("اسم العشبة بالعربية مطلوب");
      return;
    }

    const price = Math.max(10, Math.round(newHerbPrice || 45));
    const newHerbItem: HerbItem = {
      id: `custom_${Date.now()}`,
      nameAr: newHerbName.trim(),
      nameEn: "",
      scientific: newHerbScientific.trim() || newHerbName.trim(),
      system: newHerbSystem,
      target: "دعم الصحة العامة والتوازن الطبيعي",
      active: "مركبات نباتية نشطة ومستخلصات عشبية نقية",
      dose: "ملعقة صغيرة في 200 مل ماء مغلي مرة إلى مرتين يومياً",
      preparation: "منقوع دافئ",
      safety: "آمن بالجرعات الموصى بها",
      safetyLevel: "آمن جداً",
      isCustom: true,
      addedAt: new Date().toISOString(),
      price: price,
      inStock: newHerbInStock,
      imageUrl: newHerbImageUrl.trim() || undefined,
      description: newHerbDescription.trim() || `عشبة ${newHerbName.trim()} عضوية نقية وموثقة لعلاج ودعم ${newHerbSystem}.`,
      benefits: [
        `دعم وتنشيط وظائف ${newHerbSystem}`,
        "مستحضر عضوي 100% خالٍ من الإضافات الكيميائية",
        "محضرة ومغلفة وفق أعلى معايير الصيدلة العشبية",
      ],
      packageOptions: [
        { label: "عبوة 100 جم (عشب عضوي نقي)", price: price },
        { label: "عبوة 250 جم (توفيرية ممتازة)", price: Math.round(price * 2.2) },
        { label: "عبوة 500 جم (نصف كيلو فاخر)", price: Math.round(price * 4.1) },
        { label: "خلاصة مركزة (قطارة صيدلانية 50 مل)", price: Math.round(price * 1.5) },
      ],
    };

    onAddHerb(newHerbItem);
    setShowAddModal(false);
    // Reset Form
    setNewHerbName("");
    setNewHerbScientific("");
    setNewHerbPrice(45);
    setNewHerbDescription("");
    setNewHerbImageUrl("");
    setNewHerbError(null);
  };

  // Submit Edit Herb Modal
  const handleSaveEditedHerb = () => {
    if (!herbToEdit) return;
    onUpdateHerb(herbToEdit);
    setHerbToEdit(null);
    setSavedPriceNotice(`تم حفظ بيانات "${herbToEdit.nameAr}" بنجاح!`);
    setTimeout(() => setSavedPriceNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {savedPriceNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0C1B14] text-[#E2D6B5] border-2 border-[#C59B27] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{savedPriceNotice}</span>
        </div>
      )}

      {/* Main Header with Royal Aesthetics */}
      <div className="bg-gradient-to-r from-[#0C1B14] via-[#132B20] to-[#1A382B] rounded-3xl p-6 sm:p-8 text-[#FAF4E6] border-2 border-[#C59B27]/40 shadow-xl relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-[#C59B27]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#C59B27]/20 border border-[#C59B27]/40 px-3.5 py-1 rounded-full text-xs font-bold text-[#F5DC7D]">
              <Coins className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>لوحة الإدارة والتحكم في المتجر والأسعار</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-['Amiri'] text-[#FAF4E6] tracking-tight">
              إدارة أسعار المنتجات والمخزون وبطاقات الذكاء الاصطناعي
            </h1>
            <p className="text-sm text-[#D5CEBA] max-w-2xl leading-relaxed">
              تحكم كامل ومباشر لصاحب المتجر: حدد سعر كل منتج على حدة، تحكم في التوفر والحذف، ومكن الذكاء الاصطناعي من فحص كافة الأصناف وتوليد بطاقة تعريف وسعر مخصص لكل صنف فريد بدقة علمية وتراثية.
            </p>
          </div>

          {/* Quick Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleStartBulkReview(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#C59B27] to-[#DFBA47] text-[#132B20] font-extrabold px-4 py-2.5 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition text-xs sm:text-sm"
              title="مراجعة الأصناف التي تنقصها بطاقة مخصصة أو تم استيرادها مؤخراً"
            >
              <Sparkles className="w-4 h-4 text-[#132B20]" />
              <span>مراجعة الأصناف بالذكاء الاصطناعي 🤖</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#1A382B] hover:bg-[#244A3A] text-[#FAF4E6] border border-[#C59B27]/50 font-bold px-4 py-2.5 rounded-2xl transition text-xs sm:text-sm active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#C59B27]" />
              <span>إضافة منتج جديد</span>
            </button>

            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-2 bg-[#1A382B] hover:bg-[#244A3A] text-[#D5CEBA] border border-[#C59B27]/30 font-medium px-3.5 py-2.5 rounded-2xl transition text-xs sm:text-sm"
              title="إعدادات رقم الواتساب والشحن"
            >
              <Phone className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>إعدادات الواتساب</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-[#C59B27]/20 text-center sm:text-right">
          <div className="bg-[#0C1B14]/60 p-3 rounded-2xl border border-[#C59B27]/20">
            <div className="text-[11px] text-[#A59D8A]">إجمالي المنتجات</div>
            <div className="text-xl sm:text-2xl font-black text-[#FAF4E6] mt-0.5">{totalHerbsCount} صنف</div>
          </div>

          <div className="bg-[#0C1B14]/60 p-3 rounded-2xl border border-[#C59B27]/20">
            <div className="text-[11px] text-[#A59D8A]">متوسط الأسعار</div>
            <div className="text-xl sm:text-2xl font-black text-[#F5DC7D] mt-0.5">
              {avgPrice} {storeConfig.currency}
            </div>
          </div>

          <div className="bg-[#0C1B14]/60 p-3 rounded-2xl border border-[#C59B27]/20">
            <div className="text-[11px] text-[#A59D8A]">متوفر في المخزون</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">{inStockCount} صنف</div>
          </div>

          <div className="bg-[#0C1B14]/60 p-3 rounded-2xl border border-[#C59B27]/20">
            <div className="text-[11px] text-[#A59D8A]">بطاقات الذكاء الاصطناعي</div>
            <div className="text-xl sm:text-2xl font-black text-[#E2D6B5] mt-0.5">
              {withAiCount} <span className="text-xs text-amber-300">({needsAiCount} بحاجة لمراجعة)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner for Google Sheets Imported Herbs needing AI Review */}
      {needsAiCount > 0 && (
        <div className="bg-[#FFF9EA] border-2 border-[#E7C671] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#61450C] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F4D98C]/40 border border-[#E7C671] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#8E6308]" />
            </div>
            <div>
              <p className="font-extrabold text-[#473206]">
                تنبيه: يوجد {needsAiCount} صنف مستورد بحاجة إلى مراجعة وتوليد بطاقته التعريفية وسعره المخصص
              </p>
              <p className="text-[11px] text-[#785E21] mt-0.5">
                انقر على زر المراجعة الذكية ليقوم نموذج الذكاء الاصطناعي بتحليل أسماء الأصناف وتوليد تفاصيلها السريرية والعلمية وتحديد سعر عادل لكل صنف.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleStartBulkReview(true)}
              className="bg-[#C59B27] hover:bg-[#B38A1F] text-[#132B20] font-black px-4 py-2 rounded-xl transition shadow-sm active:scale-95 text-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>مراجعة وتوليد الآن ({needsAiCount})</span>
            </button>
            <button
              onClick={onNavigateToBackup}
              className="bg-white hover:bg-[#FAF4E6] text-[#785E21] border border-[#E7C671] font-bold px-3 py-2 rounded-xl transition text-xs flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheets</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION: Automated Markup Percentage & One-Click Bulk Pricing */}
      <div className="bg-gradient-to-br from-[#FFFFFF] via-[#FFFDF8] to-[#FFF9EA] p-5 sm:p-6 rounded-3xl border-2 border-[#D9C496] shadow-md relative overflow-hidden">
        {/* Subtle background ornamentation */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#C59B27]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          {/* Right/Info: Title, explanation, and badge */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#132B20] text-[#F5DC7D] font-extrabold text-xs shadow-sm">
                <Percent className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>هامش الربح التلقائي والتسعير الذكي</span>
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFE7D5] text-[#61450C] border border-[#D9C496]">
                يطبق تلقائياً عند استيراد بيانات Google Sheets
              </span>
              {markupSavedNotice && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 animate-in fade-in">
                  <Check className="w-3 h-3 text-emerald-600" />
                  {markupSavedNotice}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-[#132B20]">
              ضبط هامش الربح وتحديث أسعار كافة المنتجات بنقرة زر
            </h2>
            <p className="text-xs sm:text-sm text-[#5C4D26] max-w-2xl leading-relaxed">
              حدد نسبة هامش الربح الافتراضية (Markup %) ليتم اعتمادها آلياً عند استيراد أي أصناف جديدة من جداول Google Sheets، أو طبق هذه النسبة الآن على جميع أصناف المتجر الموجودة دفعة واحدة مع إعادة احتساب الباقات بدقة.
            </p>
          </div>

          {/* Quick Markup Presets & One-Click Trigger Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Percentage selector & input */}
            <div className="bg-[#FAF7EE] p-2 rounded-2xl border border-[#D9C496] flex items-center gap-2">
              <span className="text-xs font-black text-[#473B1C] pr-1 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-[#C59B27]" />
                الهامش:
              </span>

              {/* Quick Presets */}
              <div className="flex items-center gap-1">
                {[15, 20, 25, 30, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSaveMarkupPercentage(preset)}
                    className={`px-2 py-1 rounded-lg text-xs font-black transition ${
                      markupPercentage === preset
                        ? "bg-[#C59B27] text-[#132B20] shadow-sm scale-105"
                        : "bg-white hover:bg-[#EFE7D5] text-[#55472A] border border-[#D9C496]/50"
                    }`}
                  >
                    +{preset}%
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="relative w-16">
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={markupPercentage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMarkupPercentage(val);
                  }}
                  onBlur={() => handleSaveMarkupPercentage(markupPercentage)}
                  className="w-full text-center px-1 py-1 rounded-lg border border-[#D9C496] bg-white text-xs font-black text-[#132B20] focus:ring-1 focus:ring-[#C59B27]"
                  title="أدخل نسبة مخصصة واضغط خارج الحقل للحفظ"
                />
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#888] pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* The Prominent One-Click Bulk Update Button */}
            <button
              type="button"
              onClick={() => setShowBulkMarkupModal(true)}
              className="bg-gradient-to-r from-[#132B20] via-[#1A382B] to-[#132B20] hover:from-[#1A382B] hover:to-[#244A3A] text-[#F5DC7D] hover:text-white border-2 border-[#C59B27] px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group active:scale-95"
            >
              <Zap className="w-4 h-4 text-[#C59B27] group-hover:scale-110 transition" />
              <span>تحديث جميع الأسعار (+{markupPercentage}%) بنقرة زر ⚡</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#D9C496]/50 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#785E21]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن العشبة بالاسم العربي أو اللاتيني أو الإنجليزي لتعديل سعرها..."
              className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-[#D9C496] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59B27] text-xs sm:text-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#222]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* System Category Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#D9C496] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59B27] text-xs font-bold text-[#1D2520]"
            >
              <option value="all">كافة الفئات الطبية ({herbs.length})</option>
              {systemOptions.slice(1).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="w-full md:w-44">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#D9C496] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59B27] text-xs font-bold text-[#1D2520]"
            >
              <option value="all">كافة حالات التوفر</option>
              <option value="inStock">متوفر للطلب فقط</option>
              <option value="outOfStock">غير متوفر / نفد</option>
            </select>
          </div>

          {/* AI Filter */}
          <div className="w-full md:w-48">
            <select
              value={aiFilter}
              onChange={(e) => setAiFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#D9C496] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59B27] text-xs font-bold text-[#1D2520]"
            >
              <option value="all">حالة بطاقة الذكاء الاصطناعي</option>
              <option value="needsAi">بحاجة لمراجعة وتوليد ({needsAiCount})</option>
              <option value="hasAi">بطاقة مخصصة ومكتملة ({withAiCount})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#785E21] px-1 font-bold">
          <span>عرض {filteredHerbs.length} من أصل {herbs.length} صنف</span>
          {filteredHerbs.length !== herbs.length && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSystem("all");
                setStockFilter("all");
                setAiFilter("all");
              }}
              className="text-[#C59B27] hover:underline"
            >
              إلغاء التصفية
            </button>
          )}
        </div>
      </div>

      {/* Main Products List Table */}
      <div className="bg-white rounded-3xl border border-[#D9C496]/60 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-[#FAF4E6] text-[#3A3018] font-bold border-b border-[#D9C496]">
              <tr>
                <th className="py-3.5 px-4 font-black">الصنف والعشبة</th>
                <th className="py-3.5 px-4 font-black">الفئة الطبية</th>
                <th className="py-3.5 px-4 font-black">حالة البطاقة</th>
                <th className="py-3.5 px-4 font-black">سعر عبوة 100 جم</th>
                <th className="py-3.5 px-4 font-black">التوفر في المتجر</th>
                <th className="py-3.5 px-4 text-center font-black">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE7D5]">
              {filteredHerbs.map((herb) => {
                const currentPrice =
                  editingPrices[herb.id] !== undefined
                    ? editingPrices[herb.id]
                    : herb.price || 45;
                const isInStock = herb.inStock !== false;
                const hasAi = hasCustomAiCard(herb);
                const isGenerating = generatingHerbId === herb.id;

                return (
                  <tr
                    key={herb.id}
                    className={`hover:bg-[#FCF9F2] transition ${
                      !isInStock ? "opacity-75 bg-[#FBF9F5]" : ""
                    }`}
                  >
                    {/* Herb Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#FAF0D7] border border-[#E0D0AB] flex items-center justify-center font-bold text-[#785E21] shrink-0 text-sm shadow-xs relative">
                          {herb.imageUrl ? (
                            <img
                              src={herb.imageUrl}
                              alt={herb.nameAr}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{herb.nameAr.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#1A261F] flex items-center gap-2">
                            <span>{herb.nameAr}</span>
                            {herb.isCustom && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-md font-bold">
                                مضاف
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#7A7365] italic font-serif">
                            {herb.scientific || "لم يُحدد الاسم اللاتيني"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block bg-[#F4EDE0] text-[#55472A] border border-[#D9C496] px-2 py-1 rounded-lg text-xs font-bold">
                        {herb.system || "عام"}
                      </span>
                    </td>

                    {/* AI Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {hasAi ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>بطاقة مخصصة</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>بحاجة لمراجعة</span>
                        </span>
                      )}
                    </td>

                    {/* Price Controller */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="relative w-24">
                          <input
                            type="number"
                            min="5"
                            max="9999"
                            value={currentPrice}
                            onChange={(e) =>
                              setEditingPrices((prev) => ({
                                ...prev,
                                [herb.id]: Number(e.target.value),
                              }))
                            }
                            className="w-full text-center font-black py-1.5 px-2 rounded-xl border border-[#C59B27] bg-[#FFFBF0] text-[#1D2520] focus:ring-2 focus:ring-[#C59B27] text-sm"
                          />
                        </div>
                        <span className="text-xs font-bold text-[#785E21]">
                          {storeConfig.currency}
                        </span>

                        {editingPrices[herb.id] !== undefined &&
                          editingPrices[herb.id] !== herb.price && (
                            <button
                              onClick={() => handleSavePrice(herb)}
                              className="bg-[#C59B27] hover:bg-[#B38A1F] text-[#132B20] text-xs font-black px-2.5 py-1.5 rounded-xl transition shadow-sm active:scale-95 flex items-center gap-1"
                              title="حفظ السعر الجديد"
                            >
                              <span>حفظ</span>
                            </button>
                          )}
                      </div>
                      <div className="text-[10px] text-[#8C826C] mt-0.5">
                        250 جم: {Math.round(currentPrice * 2.2)} {storeConfig.currency}
                      </div>
                    </td>

                    {/* Stock Status Toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStock(herb)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                          isInStock
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isInStock ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <span>{isInStock ? "متوفر للطلب" : "غير متوفر"}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* AI Review Button for this single herb */}
                        <button
                          onClick={() => handleEnrichSingleHerb(herb)}
                          disabled={isGenerating}
                          title="مراجعة وتوليد بطاقة وسعر هذا الصنف بالذكاء الاصطناعي"
                          className="bg-[#FAF0D7] hover:bg-[#F2E1B6] text-[#785E21] border border-[#D9C496] p-2 rounded-xl transition active:scale-95 disabled:opacity-50"
                        >
                          {isGenerating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C59B27]" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                          )}
                        </button>

                        {/* Quick Imagen Photo Generation Button */}
                        <button
                          onClick={() => handleGenerateSingleHerbImage(herb)}
                          disabled={generatingImageHerbId === herb.id}
                          title={
                            herb.imageUrl
                              ? "إعادة توليد صورة واقعية جديدة بتقنية Imagen"
                              : "توليد صورة واقعية للعشبة بتقنية Imagen"
                          }
                          className={`p-2 rounded-xl transition active:scale-95 disabled:opacity-50 border ${
                            herb.imageUrl
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-[#FAF0D7] hover:bg-[#F2E1B6] text-[#785E21] border-[#D9C496]"
                          }`}
                        >
                          {generatingImageHerbId === herb.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C59B27]" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-[#C59B27]" />
                          )}
                        </button>

                        {/* View Card Modal */}
                        <button
                          onClick={() => onOpenHerbDetails(herb)}
                          title="معاينة بطاقة الصنف الكاملة"
                          className="bg-[#FAF7F0] hover:bg-[#F0EAE0] text-[#55472A] border border-[#D9C496] p-2 rounded-xl transition active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Full Edit Modal */}
                        <button
                          onClick={() => setHerbToEdit({ ...herb })}
                          title="تعديل تفصيلي للصنف"
                          className="bg-[#FAF7F0] hover:bg-[#F0EAE0] text-[#55472A] border border-[#D9C496] p-2 rounded-xl transition active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setHerbToDelete(herb)}
                          title="حذف هذا المنتج من المتجر"
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-2 rounded-xl transition active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredHerbs.length === 0 && (
          <div className="text-center py-16 px-4 space-y-3">
            <Package className="w-12 h-12 text-[#B3A894] mx-auto opacity-60" />
            <h3 className="text-base font-extrabold text-[#3A3018]">لا توجد أصناف مطابقة للبحث أو الفلتر</h3>
            <p className="text-xs text-[#786E58]">جرب تغيير كلمات البحث أو إعادة ضبط الفلاتر بالأعلى.</p>
          </div>
        )}
      </div>

      {/* MODAL: Bulk AI Review Runner */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF4E6] rounded-3xl border-2 border-[#C59B27] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#D9C496] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C59B27] to-[#DFBA47] flex items-center justify-center text-[#132B20]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#132B20]">المراجع الذكي للأصناف العشبية</h3>
                  <p className="text-xs text-[#785E21]">توليد بطاقات تعريف خاصة وتسعير عادل لكل صنف</p>
                </div>
              </div>

              {!isBulkRunning && (
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-[#785E21] hover:text-[#132B20] p-1.5 rounded-xl hover:bg-[#EAE0CA]"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#132B20]">
                <span>حالة الإنجاز</span>
                <span>
                  {bulkCurrentIndex} من أصل {bulkQueue.length} صنف
                </span>
              </div>
              <div className="w-full bg-[#E5D7B7] rounded-full h-3 overflow-hidden border border-[#D9C496]">
                <div
                  className="bg-gradient-to-r from-[#C59B27] to-emerald-600 h-full transition-all duration-300"
                  style={{
                    width: `${
                      bulkQueue.length > 0 ? (bulkCurrentIndex / bulkQueue.length) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Status Message */}
            <div className="bg-white p-4 rounded-2xl border border-[#D9C496] text-xs sm:text-sm text-[#1D2520] font-medium min-h-[60px] flex items-center gap-3">
              {isBulkRunning && <RefreshCw className="w-5 h-5 animate-spin text-[#C59B27] shrink-0" />}
              <span>{bulkStatusText || "جاري البدء..."}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {!isBulkRunning ? (
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="bg-[#C59B27] hover:bg-[#B38A1F] text-[#132B20] font-black px-6 py-2.5 rounded-xl transition shadow-md text-xs sm:text-sm"
                >
                  إغلاق ومتابعة المتجر
                </button>
              ) : (
                <p className="text-[11px] text-[#785E21] font-bold">
                  يرجى الانتظار حتى يكمل الذكاء الاصطناعي فحص الأصناف وتوليد بطاقاتها...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF4E6] rounded-3xl border-2 border-[#C59B27] max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D9C496] pb-3">
              <h3 className="text-lg font-black text-[#132B20] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C59B27]" />
                <span>إضافة منتج/عشبة جديدة للمتجر</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#785E21] hover:text-[#132B20] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newHerbError && (
              <div className="bg-rose-50 text-rose-800 border border-rose-300 p-3 rounded-xl text-xs font-bold">
                {newHerbError}
              </div>
            )}

            <div className="space-y-3 text-xs sm:text-sm font-bold">
              {/* Herb Name */}
              <div>
                <label className="block text-[#473B1C] mb-1">اسم العشبة أو المنتج بالعربية *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHerbName}
                    onChange={(e) => setNewHerbName(e.target.value)}
                    placeholder="مثال: لبان الذكر العماني الحوجري"
                    className="flex-1 px-3 py-2 rounded-xl border border-[#D9C496] bg-white focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                  />
                  <button
                    type="button"
                    onClick={handleAutoFillNewHerbAi}
                    disabled={isGeneratingNewHerbAi || !newHerbName.trim()}
                    className="bg-[#C59B27] hover:bg-[#B38A1F] text-[#132B20] px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
                    title="توليد البيانات تلقائياً بالذكاء الاصطناعي"
                  >
                    {isGeneratingNewHerbAi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>توليد بالذكاء الاصطناعي</span>
                  </button>
                </div>
              </div>

              {/* Scientific Name */}
              <div>
                <label className="block text-[#473B1C] mb-1">الاسم اللاتيني / العلمي</label>
                <input
                  type="text"
                  value={newHerbScientific}
                  onChange={(e) => setNewHerbScientific(e.target.value)}
                  placeholder="مثال: Boswellia sacra"
                  className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                />
              </div>

              {/* System Category & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#473B1C] mb-1">الفئة الطبية</label>
                  <select
                    value={newHerbSystem}
                    onChange={(e) => setNewHerbSystem(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    {systemOptions.slice(1).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#473B1C] mb-1">
                    السعر الأساسي ({storeConfig.currency}) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={newHerbPrice}
                    onChange={(e) => setNewHerbPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white focus:outline-none focus:ring-2 focus:ring-[#C59B27] font-black"
                  />
                </div>
              </div>

              {/* In Stock Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="newHerbInStock"
                  checked={newHerbInStock}
                  onChange={(e) => setNewHerbInStock(e.target.checked)}
                  className="w-4 h-4 text-[#C59B27] rounded focus:ring-[#C59B27]"
                />
                <label htmlFor="newHerbInStock" className="text-[#3A3018] cursor-pointer font-bold">
                  متوفر للطلب المباشر في المتجر
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[#473B1C] mb-1">وصف صيدلاني وسريري للمنتج</label>
                <textarea
                  rows={3}
                  value={newHerbDescription}
                  onChange={(e) => setNewHerbDescription(e.target.value)}
                  placeholder="شرح مميزات الصنف وأثره العلاجي والجرعة الموصى بها..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white focus:outline-none focus:ring-2 focus:ring-[#C59B27] text-xs"
                />
              </div>

              {/* Herb Realistic Image (Imagen) */}
              <div>
                <label className="block text-[#473B1C] mb-1">
                  صورة واقعية للمنتج (تقنية Imagen الذكية)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#FAF7EE] p-3 rounded-2xl border border-[#D9C496]">
                  {/* Image Preview Box */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-[#D9C496] bg-white flex items-center justify-center shrink-0">
                    {newHerbImageUrl ? (
                      <img
                        src={newHerbImageUrl}
                        alt="معاينة"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-1 text-[#8C7A53]">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-[#C59B27]" />
                        <span className="text-[10px] block">لا توجد صورة</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <button
                      type="button"
                      onClick={handleGenerateNewHerbImage}
                      disabled={isGeneratingNewHerbImage || !newHerbName.trim()}
                      className="w-full bg-[#132B20] hover:bg-[#1C3E2F] text-[#F5DC7D] px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {isGeneratingNewHerbImage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C59B27]" />
                          <span>جاري توليد الصورة الواقعية بواسطة Imagen...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                          <span>توليد صورة واقعية للعشبة (Imagen)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newHerbImageUrl}
                        onChange={(e) => setNewHerbImageUrl(e.target.value)}
                        placeholder="أو ألصق رابط صورة العشبة هنا..."
                        className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-[#D9C496] bg-white"
                      />
                      {newHerbImageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewHerbImageUrl("")}
                          className="text-xs text-rose-600 font-bold hover:underline shrink-0"
                        >
                          إزالة
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9C496]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="bg-[#EFE7D5] hover:bg-[#E5D7B7] text-[#55472A] px-4 py-2 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateNewHerb}
                className="bg-[#C59B27] hover:bg-[#B38A1F] text-[#132B20] px-5 py-2 rounded-xl font-black text-xs shadow-md"
              >
                إضافة المنتج للمتجر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Full Edit Herb */}
      {herbToEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF4E6] rounded-3xl border-2 border-[#C59B27] max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D9C496] pb-3">
              <h3 className="text-lg font-black text-[#132B20] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#C59B27]" />
                <span>تعديل الصنف: {herbToEdit.nameAr}</span>
              </h3>
              <button
                onClick={() => setHerbToEdit(null)}
                className="text-[#785E21] hover:text-[#132B20] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-bold">
              <div>
                <label className="block text-[#473B1C] mb-1">الاسم بالعربية</label>
                <input
                  type="text"
                  value={herbToEdit.nameAr}
                  onChange={(e) => setHerbToEdit({ ...herbToEdit, nameAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white"
                />
              </div>

              <div>
                <label className="block text-[#473B1C] mb-1">الاسم العلمي (Latin)</label>
                <input
                  type="text"
                  value={herbToEdit.scientific || ""}
                  onChange={(e) => setHerbToEdit({ ...herbToEdit, scientific: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#473B1C] mb-1">الفئة الطبية</label>
                  <select
                    value={herbToEdit.system}
                    onChange={(e) => setHerbToEdit({ ...herbToEdit, system: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white"
                  >
                    {systemOptions.slice(1).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#473B1C] mb-1">
                    سعر عبوة 100 جم ({storeConfig.currency})
                  </label>
                  <input
                    type="number"
                    value={herbToEdit.price || 45}
                    onChange={(e) =>
                      setHerbToEdit({
                        ...herbToEdit,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white font-black"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="editHerbInStock"
                  checked={herbToEdit.inStock !== false}
                  onChange={(e) => setHerbToEdit({ ...herbToEdit, inStock: e.target.checked })}
                  className="w-4 h-4 text-[#C59B27] rounded"
                />
                <label htmlFor="editHerbInStock" className="text-[#3A3018] cursor-pointer">
                  متوفر للطلب في المتجر
                </label>
              </div>

              <div>
                <label className="block text-[#473B1C] mb-1">الوصف الصيدلاني والتسويقي للمنتج</label>
                <textarea
                  rows={3}
                  value={herbToEdit.description || ""}
                  onChange={(e) => setHerbToEdit({ ...herbToEdit, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[#473B1C] mb-1">الجرعة وطريقة الاستخدام</label>
                <input
                  type="text"
                  value={herbToEdit.dose || ""}
                  onChange={(e) => setHerbToEdit({ ...herbToEdit, dose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white text-xs"
                />
              </div>

              {/* Realistic Imagen Image */}
              <div>
                <label className="block text-[#473B1C] mb-1">
                  صورة المنتج الواقعية (تقنية Imagen)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#FAF7EE] p-3 rounded-2xl border border-[#D9C496]">
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-[#D9C496] bg-white flex items-center justify-center shrink-0">
                    {herbToEdit.imageUrl ? (
                      <img
                        src={herbToEdit.imageUrl}
                        alt="معاينة"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-1 text-[#8C7A53]">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-[#C59B27]" />
                        <span className="text-[10px] block">لا توجد صورة</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <button
                      type="button"
                      onClick={handleGenerateEditHerbImage}
                      disabled={isGeneratingEditImage}
                      className="w-full bg-[#132B20] hover:bg-[#1C3E2F] text-[#F5DC7D] px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {isGeneratingEditImage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C59B27]" />
                          <span>جاري توليد صورة واقعية بواسطة Imagen...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                          <span>
                            {herbToEdit.imageUrl
                              ? "إعادة توليد صورة واقعية جديدة (Imagen)"
                              : "توليد صورة واقعية للعشبة (Imagen)"}
                          </span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={herbToEdit.imageUrl || ""}
                        onChange={(e) =>
                          setHerbToEdit({ ...herbToEdit, imageUrl: e.target.value })
                        }
                        placeholder="أو ألصق رابط صورة العشبة هنا..."
                        className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-[#D9C496] bg-white"
                      />
                      {herbToEdit.imageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setHerbToEdit({ ...herbToEdit, imageUrl: undefined })
                          }
                          className="text-xs text-rose-600 font-bold hover:underline shrink-0"
                        >
                          إزالة
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9C496]">
              <button
                type="button"
                onClick={() => setHerbToEdit(null)}
                className="bg-[#EFE7D5] text-[#55472A] px-4 py-2 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveEditedHerb}
                className="bg-[#C59B27] text-[#132B20] px-5 py-2 rounded-xl font-black text-xs shadow-md"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {herbToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF4E6] rounded-3xl border-2 border-rose-400 max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-black">حذف منتج من المتجر</h3>
            </div>

            <p className="text-xs sm:text-sm text-[#473B1C] leading-relaxed">
              هل أنت متأكد من رغبتك في حذف العشبة{" "}
              <span className="font-extrabold text-rose-700">"{herbToDelete.nameAr}"</span> نهائياً من المتجر وقاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setHerbToDelete(null)}
                className="bg-[#EFE7D5] hover:bg-[#E5D7B7] text-[#55472A] px-4 py-2 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onDeleteHerb(herbToDelete.id);
                  setHerbToDelete(null);
                  setSavedPriceNotice(`تم حذف "${herbToDelete.nameAr}" من المتجر.`);
                  setTimeout(() => setSavedPriceNotice(null), 3000);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl font-black text-xs shadow-md"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Store WhatsApp & Shipping Config */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF4E6] rounded-3xl border-2 border-[#C59B27] max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#D9C496] pb-3">
              <h3 className="text-base font-black text-[#132B20] flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#C59B27]" />
                <span>إعدادات الواتساب والشحن للمتجر</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[#785E21] hover:text-[#132B20] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-bold">
              <div>
                <label className="block text-[#473B1C] mb-1">
                  رقم جوال الواتساب لاستقبال الطلبات (مع الرمز الدولي دون +)
                </label>
                <input
                  type="text"
                  value={tempConfig.whatsappNumber}
                  onChange={(e) =>
                    setTempConfig({ ...tempConfig, whatsappNumber: e.target.value })
                  }
                  placeholder="مثال: 966501234567"
                  className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-[#473B1C] mb-1">اسم المتجر أو العطارة</label>
                <input
                  type="text"
                  value={tempConfig.storeName}
                  onChange={(e) => setTempConfig({ ...tempConfig, storeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#473B1C] mb-1">رمز العملة</label>
                  <input
                    type="text"
                    value={tempConfig.currency}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white text-center"
                  />
                </div>

                <div>
                  <label className="block text-[#473B1C] mb-1">رسوم الشحن والتوصيل</label>
                  <input
                    type="number"
                    value={tempConfig.shippingFee}
                    onChange={(e) =>
                      setTempConfig({
                        ...tempConfig,
                        shippingFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white text-center font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#473B1C] mb-1">
                  حد الشحن المجاني (قيمة الطلب المؤهلة للشحن المجاني)
                </label>
                <input
                  type="number"
                  value={tempConfig.freeShippingThreshold}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      freeShippingThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white font-black"
                />
              </div>

              <div>
                <label className="block text-[#473B1C] mb-1">
                  هامش الربح التلقائي الافتراضي (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={tempConfig.markupPercentage ?? 25}
                    onChange={(e) =>
                      setTempConfig({
                        ...tempConfig,
                        markupPercentage: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D9C496] bg-white text-center font-black"
                  />
                  <span className="font-extrabold text-[#785E21]">%</span>
                </div>
                <p className="text-[11px] text-[#785E21] mt-1 font-normal">
                  يتم اعتماده وتطبيقه تلقائياً عند استيراد أي أصناف جديدة من Google Sheets.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9C496]">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="bg-[#EFE7D5] text-[#55472A] px-4 py-2 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateStoreConfig(tempConfig);
                  if (typeof tempConfig.markupPercentage === "number") {
                    setMarkupPercentage(tempConfig.markupPercentage);
                  }
                  setShowConfigModal(false);
                  setSavedPriceNotice("تم تحديث إعدادات المتجر وهامش الربح بنجاح!");
                  setTimeout(() => setSavedPriceNotice(null), 3000);
                }}
                className="bg-[#C59B27] text-[#132B20] px-5 py-2 rounded-xl font-black text-xs shadow-md"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: One-Click Bulk Markup & Price Update */}
      {showBulkMarkupModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF4E6] rounded-3xl border-2 border-[#C59B27] max-w-xl w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#D9C496] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#132B20] text-[#F5DC7D] border border-[#C59B27] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-[#C59B27]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#132B20]">
                    تطبيق هامش الربح على جميع المنتجات بنقرة زر
                  </h3>
                  <p className="text-[11px] text-[#785E21]">
                    تحديث شامل وفوري لأسعار كافة الأعشاب وباقاتها المتنوعة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkMarkupModal(false)}
                className="text-[#785E21] hover:text-[#132B20] p-1.5 rounded-xl hover:bg-[#EFE7D5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Settings & Margin Tuning */}
            <div className="bg-[#FFFDF8] border border-[#D9C496] rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs sm:text-sm font-extrabold text-[#132B20] flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-[#C59B27]" />
                  <span>نسبة هامش الربح المراد تطبيقها:</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[15, 20, 25, 30, 50].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMarkupPercentage(p)}
                      className={`px-2 py-1 rounded-lg text-xs font-black transition ${
                        markupPercentage === p
                          ? "bg-[#C59B27] text-[#132B20] shadow-sm font-black"
                          : "bg-[#FAF7EE] text-[#55472A] border border-[#D9C496]/60"
                      }`}
                    >
                      +{p}%
                    </button>
                  ))}
                  <div className="relative w-16">
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={markupPercentage}
                      onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                      className="w-full text-center px-1 py-1 rounded-lg border border-[#D9C496] bg-white text-xs font-black text-[#132B20]"
                    />
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#888] pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Scope */}
              <div className="pt-2 border-t border-[#D9C496]/50">
                <span className="text-xs font-bold text-[#473B1C] block mb-2">
                  نطاق التطبيق:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      markupScope === "all"
                        ? "bg-[#FAF2DF] border-[#C59B27] text-[#132B20]"
                        : "bg-white border-[#D9C496] text-[#55472A]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={markupScope === "all"}
                      onChange={() => setMarkupScope("all")}
                      className="text-[#C59B27] focus:ring-[#C59B27]"
                    />
                    <span>كافة الأعشاب في المتجر ({herbs.length} صنف)</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      markupScope === "importedOnly"
                        ? "bg-[#FAF2DF] border-[#C59B27] text-[#132B20]"
                        : "bg-white border-[#D9C496] text-[#55472A]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={markupScope === "importedOnly"}
                      onChange={() => setMarkupScope("importedOnly")}
                      className="text-[#C59B27] focus:ring-[#C59B27]"
                    />
                    <span>
                      المستوردة فقط (
                      {
                        herbs.filter(
                          (h) =>
                            h.isCustom ||
                            String(h.id).startsWith("sheet_") ||
                            String(h.id).startsWith("sheet-")
                        ).length
                      }{" "}
                      صنف)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Smart Pricing Options */}
            <div className="space-y-2 text-xs font-bold text-[#473B1C]">
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-xl border border-[#D9C496]">
                <input
                  type="checkbox"
                  checked={roundToNearestRiyal}
                  onChange={(e) => setRoundToNearestRiyal(e.target.checked)}
                  className="rounded text-[#C59B27] focus:ring-[#C59B27] w-4 h-4"
                />
                <span>
                  تقريب الأسعار الناتجة إلى أقرب ريال صحيح (مستحسن للبيع السلس وتجنب الكسور)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-xl border border-[#D9C496]">
                <input
                  type="checkbox"
                  checked={updatePackagesProportionally}
                  onChange={(e) => setUpdatePackagesProportionally(e.target.checked)}
                  className="rounded text-[#C59B27] focus:ring-[#C59B27] w-4 h-4"
                />
                <span>
                  إعادة احتساب باقات الأوزان الـ 4 لكل عشب (100جم، 250جم، 500جم، 50مل) بتناسب كامل مع السعر الجديد
                </span>
              </label>
            </div>

            {/* Live Pricing Preview Sample */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#132B20]">
                <span>معاينة حية لتغير الأسعار (عينات من المنتجات):</span>
                <span className="text-[11px] text-[#785E21]">
                  هامش: +{markupPercentage}%
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-[#D9C496] overflow-hidden">
                <div className="grid grid-cols-4 bg-[#F5ECE0] p-2 text-[11px] font-black text-[#55472A] border-b border-[#D9C496]">
                  <div>اسم العشبة</div>
                  <div className="text-center">السعر الحالي</div>
                  <div className="text-center">السعر بعد الهامش</div>
                  <div className="text-left pl-2">الزيادة</div>
                </div>
                <div className="divide-y divide-[#EFE7D5] text-xs font-bold">
                  {previewSampleHerbs.map((item) => {
                    const curPrice = item.price && item.price > 0 ? item.price : 45;
                    const rawNew = curPrice * (1 + markupPercentage / 100);
                    const newPrice = roundToNearestRiyal
                      ? Math.round(rawNew)
                      : Number(rawNew.toFixed(2));
                    const diff = newPrice - curPrice;
                    return (
                      <div key={item.id} className="grid grid-cols-4 p-2.5 items-center">
                        <div className="font-bold text-[#132B20] truncate">
                          {item.nameAr}
                        </div>
                        <div className="text-center text-[#785E21]">
                          {curPrice} {storeConfig.currency}
                        </div>
                        <div className="text-center font-black text-emerald-700">
                          {newPrice} {storeConfig.currency}
                        </div>
                        <div className="text-left pl-2 font-black text-[#C59B27]">
                          +{diff} {storeConfig.currency}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#D9C496]">
              <button
                type="button"
                onClick={() => setShowBulkMarkupModal(false)}
                className="bg-[#EFE7D5] hover:bg-[#E5D7B7] text-[#55472A] px-4 py-2 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isApplyingBulkMarkup}
                onClick={handleExecuteBulkMarkup}
                className="bg-gradient-to-r from-[#132B20] to-[#1A382B] hover:from-[#1A382B] hover:to-[#244A3A] text-[#F5DC7D] hover:text-white border-2 border-[#C59B27] px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 active:scale-95 transition"
              >
                <Zap className="w-4 h-4 text-[#C59B27]" />
                <span>
                  {isApplyingBulkMarkup
                    ? "جاري التحديث..."
                    : `تأكيد وتطبيق الهامش على كافة الأعشاب الآن 🚀`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
