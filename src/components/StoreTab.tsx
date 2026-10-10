import React, { useState, useMemo } from "react";
import { HerbItem, CartItem, StoreConfig } from "../types";
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Plus,
  Eye,
  ArrowUpDown,
  Tag,
  Star,
  Award,
} from "lucide-react";
import {
  getHerbPricing,
  createWhatsAppUrl,
  buildWhatsAppDirectHerbMessage,
} from "../utils/storeUtils";

interface StoreTabProps {
  herbs: HerbItem[];
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onOpenHerbDetails: (herb: HerbItem) => void;
  onOpenCart: () => void;
  storeConfig: StoreConfig;
}

export const StoreTab: React.FC<StoreTabProps> = ({
  herbs,
  cart,
  onAddToCart,
  onOpenHerbDetails,
  onOpenCart,
  storeConfig,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSystem, setSelectedSystem] = useState("الكل");
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high">("popular");
  const [selectedPackages, setSelectedPackages] = useState<Record<string, number>>({});
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const systems = useMemo(() => {
    const list = Array.from(new Set(herbs.map((h) => h.system).filter(Boolean)));
    return ["الكل", ...list];
  }, [herbs]);

  // Process & filter products
  const products = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = herbs.filter((h) => {
      const matchesSearch =
        !q ||
        h.nameAr.toLowerCase().includes(q) ||
        h.nameEn.toLowerCase().includes(q) ||
        h.scientific.toLowerCase().includes(q) ||
        h.target.toLowerCase().includes(q);

      const matchesSystem = selectedSystem === "الكل" || h.system === selectedSystem;
      return matchesSearch && matchesSystem;
    });

    if (sortBy === "price-low") {
      list = [...list].sort((a, b) => getHerbPricing(a).basePrice - getHerbPricing(b).basePrice);
    } else if (sortBy === "price-high") {
      list = [...list].sort((a, b) => getHerbPricing(b).basePrice - getHerbPricing(a).basePrice);
    }

    return list;
  }, [herbs, searchQuery, selectedSystem, sortBy]);

  const handleSelectPackageIndex = (herbId: string | number, idx: number) => {
    setSelectedPackages((prev) => ({
      ...prev,
      [String(herbId)]: idx,
    }));
  };

  const handleAddToCart = (herb: HerbItem) => {
    const pricing = getHerbPricing(herb);
    const chosenIndex = selectedPackages[String(herb.id)] || 0;
    const pkg = pricing.packages[chosenIndex] || pricing.packages[0];

    const cartItem: CartItem = {
      id: `${herb.id}_${pkg.weight}`,
      herbId: herb.id,
      nameAr: herb.nameAr,
      nameEn: herb.nameEn,
      scientific: herb.scientific,
      packageSize: pkg.label,
      price: pkg.price,
      quantity: 1,
      system: herb.system,
    };

    onAddToCart(cartItem);
    setAddedToast(`تمت إضافة ${herb.nameAr} (${pkg.weight}) إلى السلة بنجاح 🛒`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const handleDirectWhatsAppOrder = (herb: HerbItem) => {
    const pricing = getHerbPricing(herb);
    const chosenIndex = selectedPackages[String(herb.id)] || 0;
    const pkg = pricing.packages[chosenIndex] || pricing.packages[0];

    const msg = buildWhatsAppDirectHerbMessage(herb, pkg.label, pkg.price, 1, storeConfig);
    const url = createWhatsAppUrl(storeConfig.whatsappNumber, msg);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleGeneralConsultationWhatsApp = () => {
    const msg = `السلام عليكم ورحمة الله، أود الحصول على استشارة صيدلانية عشبية من متجر 1000 عشبة الطبية حول أفضل الأعشاب المناسبة لحالتي.`;
    const url = createWhatsAppUrl(storeConfig.whatsappNumber, msg);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 text-right">
      {/* Toast Feedback */}
      {addedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#132B20] text-[#FBF7EE] border-2 border-[#C59B27] px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <span className="w-2 h-2 rounded-full bg-[#F5DC7D] animate-ping" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* Hero Store Banner */}
      <div className="bg-gradient-to-r from-[#132B20] via-[#1A382B] to-[#132B20] text-[#FBF7EE] rounded-3xl p-6 sm:p-8 border-2 border-[#C59B27] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C59B27]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C59B27]/20 border border-[#C59B27]/50 text-[#F5DC7D] text-xs font-bold">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>عطارة وصيدلية 1000 عشبة الطبية • الشحن السريع</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-['Cairo'] text-[#FBF7EE]">
              متجر الأعشاب العضوية والخلاصات الصيدلانية
            </h2>
            <p className="text-xs sm:text-sm text-[#E2D6B5] leading-relaxed">
              اطلب نباتاتك الطبية المجففة عضوياً أو خلاصاتها النقية بضغطة زر واحدة مربوطة مباشرة بمحادثة الواتساب مع خيارات أوزان متعددة وضمان الجودة والفحص السريري.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-[#F5DC7D]">
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>أعشاب عضوية منتقاة 100%</span>
              </span>
              <span className="flex items-center gap-1 font-bold">
                <Truck className="w-3.5 h-3.5 text-amber-300" />
                <span>شحن مجاني فوق 150 ر.س</span>
              </span>
              <span className="flex items-center gap-1 font-bold">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>طلب واستشارة فورية بالواتساب</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto">
            <button
              onClick={onOpenCart}
              className="flex items-center justify-center gap-2 bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-black px-5 py-3 rounded-2xl shadow-lg transition active:scale-95 text-xs cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>عرض سلة المشتريات ({totalCartCount})</span>
            </button>

            <button
              onClick={handleGeneralConsultationWhatsApp}
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white font-black px-5 py-2.5 rounded-2xl shadow-md transition active:scale-95 text-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-transparent" />
              <span>استشارة صيدلانية بالواتساب</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E6D8BA] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8C7A53] absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن العشبة للشراء (بالعربي أو اللاتيني أو الغرض)..."
            className="w-full bg-white border border-[#DFCFA8] rounded-xl pr-9 pl-3 py-2 text-xs text-[#132B20] placeholder-[#8C7A53] focus:outline-hidden focus:border-[#C59B27]"
          />
        </div>

        {/* System Category Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8C7A53]" />
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="bg-white border border-[#DFCFA8] rounded-xl px-3 py-2 text-xs text-[#132B20] font-bold focus:outline-hidden focus:border-[#C59B27]"
          >
            {systems.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-[#8C7A53]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-[#DFCFA8] rounded-xl px-3 py-2 text-xs text-[#132B20] font-bold focus:outline-hidden focus:border-[#C59B27]"
          >
            <option value="popular">الأكثر طلباً وتوثيقاً</option>
            <option value="price-low">السعر: من الأقل للأعلى</option>
            <option value="price-high">السعر: من الأعلى للأقل</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((herb) => {
          const pricing = getHerbPricing(herb);
          const chosenIndex = selectedPackages[String(herb.id)] || 0;
          const currentPkg = pricing.packages[chosenIndex] || pricing.packages[0];

          return (
            <div
              key={herb.id}
              className="bg-[#FCF9F2] rounded-3xl border-2 border-[#E6D8BA] hover:border-[#C59B27] p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Product Realistic Image */}
                <div
                  onClick={() => onOpenHerbDetails(herb)}
                  className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 border border-[#E6D8BA] bg-[#EFE7D5] group-hover:border-[#C59B27] transition shadow-xs cursor-pointer"
                >
                  {herb.imageUrl ? (
                    <img
                      src={herb.imageUrl}
                      alt={herb.nameAr}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF5E8] to-[#EFE7D5] text-[#8C7A53] p-4 text-center">
                      <Sparkles className="w-7 h-7 text-[#C59B27] mb-1 opacity-70" />
                      <span className="text-xs font-bold font-['Cairo'] text-[#55472A]">
                        {herb.nameAr}
                      </span>
                      <span className="text-[10px] text-[#8C7A53] italic truncate max-w-[90%]">
                        {herb.scientific || herb.nameEn}
                      </span>
                    </div>
                  )}

                  {/* Header Badges Overlay */}
                  <div className="absolute top-2 right-2">
                    <span className="font-bold px-2 py-0.5 rounded-lg bg-[#132B20]/90 backdrop-blur-xs text-[#F5DC7D] text-[10px] shadow-sm">
                      {herb.system}
                    </span>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="font-mono font-bold text-[#F5DC7D] bg-[#132B20]/80 px-2 py-0.5 rounded-md text-[10px]">
                      #{String(herb.id).padStart(3, "0")}
                    </span>
                  </div>
                  {herb.inStock === false && (
                    <div className="absolute bottom-2 right-2">
                      <span className="font-bold px-2 py-0.5 rounded-md bg-rose-600/95 text-white text-[10px] shadow-sm">
                        نفد من المخزون
                      </span>
                    </div>
                  )}
                  {herb.imageUrl && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-[#132B20]/85 text-[#F5DC7D] px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 backdrop-blur-xs">
                        <Sparkles className="w-2.5 h-2.5 text-[#C59B27]" />
                        <span>Imagen</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Herb Name */}
                <h4
                  onClick={() => onOpenHerbDetails(herb)}
                  className="font-black text-base text-[#132B20] group-hover:text-[#9A7B1C] transition-colors cursor-pointer"
                >
                  {herb.nameAr}
                </h4>
                <div className="text-[11px] text-[#7A6B48] italic font-sans flex items-center gap-1 mt-0.5 truncate">
                  <span>{herb.nameEn}</span>
                  <span>•</span>
                  <span>{herb.scientific}</span>
                </div>

                <p className="text-xs text-[#4F4022] mt-2 line-clamp-2 leading-relaxed">
                  {herb.target}
                </p>

                {/* Package Options Radio Chips */}
                <div className="mt-3 pt-3 border-t border-[#EAE0CA] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#8C7A53] block">
                    اختر حجم العبوة:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {pricing.packages.map((pkg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPackageIndex(herb.id, idx)}
                        className={`p-1.5 rounded-xl border text-center transition font-bold ${
                          chosenIndex === idx
                            ? "bg-[#132B20] text-[#F5DC7D] border-[#132B20] shadow-xs"
                            : "bg-[#F4EEDB] text-[#4F4022] border-[#DFCFA8] hover:border-[#C59B27]"
                        }`}
                      >
                        <span className="block truncate">{pkg.weight}</span>
                        <span className="block text-[9px] font-mono mt-0.5">
                          {pkg.price} {storeConfig.currency}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-3 flex items-baseline justify-between bg-[#F8F2E2] p-2 rounded-xl border border-[#E7D7B5]">
                  <span className="text-xs font-bold text-[#7A6B48]">السعر المحدد:</span>
                  <div className="text-base font-black font-mono text-[#C59B27]">
                    {currentPkg.price}{" "}
                    <span className="text-xs font-sans text-[#132B20]">
                      {storeConfig.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#EAE0CA] space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleAddToCart(herb)}
                    disabled={herb.inStock === false}
                    className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl font-bold text-xs transition shadow-xs ${
                      herb.inStock === false
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300"
                        : "bg-[#132B20] hover:bg-[#1C3E2F] text-[#FBF7EE] active:scale-95 cursor-pointer"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>{herb.inStock === false ? "غير متوفر" : "أضف للسلة"}</span>
                  </button>

                  <button
                    onClick={() => handleDirectWhatsAppOrder(herb)}
                    title="طلب فوري عبر الواتساب"
                    className="flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#20BA5A] text-white py-2 px-2.5 rounded-xl font-bold text-xs transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white text-transparent" />
                    <span>طلب واتساب</span>
                  </button>
                </div>

                <button
                  onClick={() => onOpenHerbDetails(herb)}
                  className="w-full flex items-center justify-center gap-1 text-[11px] text-[#7A6B48] hover:text-[#132B20] font-bold py-1 transition"
                >
                  <Eye className="w-3 h-3" />
                  <span>معاينة البطاقة الصيدلانية والتراثية</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-16 bg-[#FCF9F2] rounded-3xl border border-[#E6D8BA]">
          <p className="text-sm font-bold text-[#8C7A53]">لا توجد أعشاب مطابقة لبحثك في المتجر</p>
        </div>
      )}
    </div>
  );
};
