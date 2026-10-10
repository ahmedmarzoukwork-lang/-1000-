import React, { useState } from "react";
import { CartItem, StoreConfig, StoreCustomerInfo } from "../types";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  Truck,
  CheckCircle2,
  Phone,
  User,
  MapPin,
  FileText,
  Settings,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import {
  buildWhatsAppCartMessage,
  createWhatsAppUrl,
  saveStoreConfig,
} from "../utils/storeUtils";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  storeConfig: StoreConfig;
  onUpdateStoreConfig: (newConfig: StoreConfig) => void;
  onNavigateToCatalog: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  storeConfig,
  onUpdateStoreConfig,
  onNavigateToCatalog,
}) => {
  const [customer, setCustomer] = useState<StoreCustomerInfo>({
    fullName: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
  });

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState(storeConfig.whatsappNumber);
  const [showOrderSuccessToast, setShowOrderSuccessToast] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isFreeShipping = subtotal >= storeConfig.freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : (cart.length > 0 ? storeConfig.shippingFee : 0);
  const total = subtotal + shippingFee;
  const amountForFreeShipping = Math.max(0, storeConfig.freeShippingThreshold - subtotal);

  const handleSavePhone = () => {
    const updated = { ...storeConfig, whatsappNumber: tempPhone.trim() };
    onUpdateStoreConfig(updated);
    saveStoreConfig(updated);
    setIsEditingPhone(false);
  };

  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;

    if (!customer.fullName.trim() || !customer.phone.trim()) {
      alert("يرجى كتابة الاسم ورقم الجوال لتجهيز الفاتورة وشحن الطلبية");
      return;
    }

    const orderCode = `HRB-${Math.floor(1000 + Math.random() * 9000)}`;
    const msg = buildWhatsAppCartMessage(cart, customer, storeConfig, orderCode);
    const waUrl = createWhatsAppUrl(storeConfig.whatsappNumber, msg);

    // Open WhatsApp in new tab/app
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setShowOrderSuccessToast(true);
    setTimeout(() => setShowOrderSuccessToast(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-right font-['Cairo']">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FBF7EE] shadow-2xl flex flex-col justify-between border-r-2 border-[#C59B27] relative animate-in slide-in-from-left duration-300">
          {/* Header */}
          <div className="bg-[#132B20] text-[#FBF7EE] p-4 sm:p-5 border-b-2 border-[#C59B27] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#C59B27] text-[#132B20] rounded-xl shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#FBF7EE] leading-tight">
                  سلة مشتريات الأعشاب
                </h3>
                <span className="text-[11px] text-[#E2D6B5]">
                  {cart.length} أصناف • مربوطة بطلب الواتساب الفوري
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingPhone(!isEditingPhone)}
                title="تعديل رقم واتساب المتجر"
                className="p-2 text-stone-300 hover:text-[#F5DC7D] transition rounded-lg hover:bg-[#1A382B]"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-stone-300 hover:text-white transition rounded-lg hover:bg-[#1A382B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Settings: Change Merchant WhatsApp number */}
          {isEditingPhone && (
            <div className="bg-[#FAF4E6] p-3.5 border-b border-[#E6D8BA] text-xs">
              <span className="font-bold text-[#132B20] block mb-1">
                ⚙️ رقم واتساب المتجر لاستقبال الطلبات:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  placeholder="مثال: 966501234567"
                  className="flex-1 bg-white border border-[#C59B27] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-center"
                />
                <button
                  onClick={handleSavePhone}
                  className="bg-[#132B20] text-[#F5DC7D] px-3 py-1.5 rounded-xl font-bold hover:bg-[#1C3E2F]"
                >
                  حفظ
                </button>
              </div>
              <span className="text-[10px] text-stone-500 mt-1 block">
                اكتب الرقم مع مفتاح الدولة (مثل 966 بالسعودية أو 20 بمصر) بدون علامة +.
              </span>
            </div>
          )}

          {/* Free Shipping Banner */}
          {cart.length > 0 && (
            <div className="bg-[#F0E6CD] px-4 py-2 border-b border-[#E0D0AE] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#132B20] font-bold">
                <Truck className="w-4 h-4 text-[#C59B27]" />
                {isFreeShipping ? (
                  <span className="text-emerald-800">مبارك! مؤهل للشحن المجاني 🎉</span>
                ) : (
                  <span>
                    أضف بقيمة <strong className="text-[#C59B27] font-mono">{amountForFreeShipping} {storeConfig.currency}</strong> للشحن المجاني
                  </span>
                )}
              </div>
              <span className="text-[10px] text-stone-500 font-bold">
                حد الشحن: {storeConfig.freeShippingThreshold} {storeConfig.currency}
              </span>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-[#EFE6D2] rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
                  <ShoppingBag className="w-8 h-8 text-[#C59B27]" />
                </div>
                <h4 className="font-bold text-base text-[#132B20] mb-1">
                  سلة الأعشاب فارغة حالياً
                </h4>
                <p className="text-xs text-stone-500 mb-4 max-w-xs mx-auto">
                  تصفح الفهرس الشامل أو المتجر واختر الأعشاب المناسبة لصحتك لإضافتها وطلبها عبر واتساب.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToCatalog();
                  }}
                  className="bg-[#132B20] text-[#F5DC7D] px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-[#1C3E2F] transition shadow-md"
                >
                  تصفح موسوعة الأعشاب الآن
                </button>
              </div>
            ) : (
              <>
                {/* List of Cart Items */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#8C7A53]">
                    <span>المنتجات المختارة ({cart.length})</span>
                    <button
                      onClick={onClearCart}
                      className="text-rose-700 hover:text-rose-900 transition flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>تفريغ السلة</span>
                    </button>
                  </div>

                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#FCF9F2] p-3.5 rounded-2xl border border-[#E6D8BA] shadow-xs flex items-center justify-between gap-3 hover:border-[#C59B27] transition"
                    >
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-sm text-[#132B20] truncate">
                          {item.nameAr}
                        </h5>
                        <p className="text-[11px] text-[#7A6B48] truncate">
                          {item.packageSize}
                        </p>
                        <span className="text-xs font-mono font-bold text-[#C59B27] mt-0.5 block">
                          {item.price} {storeConfig.currency}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-[#F4EEDB] border border-[#DFCFA8] rounded-xl px-1.5 py-1">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 text-[#132B20] hover:text-rose-600 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold font-mono text-xs text-[#132B20]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 text-[#132B20] hover:text-[#C59B27] transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 transition"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Checkout Form */}
                <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#E6D8BA] space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#132B20]">
                    <User className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>بيانات الشحن والتواصل:</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <input
                        type="text"
                        value={customer.fullName}
                        onChange={(e) =>
                          setCustomer({ ...customer, fullName: e.target.value })
                        }
                        placeholder="الاسم الثلاثي أو المستعار *"
                        className="w-full bg-white border border-[#DFCFA8] rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#C59B27]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        value={customer.phone}
                        onChange={(e) =>
                          setCustomer({ ...customer, phone: e.target.value })
                        }
                        placeholder="رقم الجوال للواتساب *"
                        className="bg-white border border-[#DFCFA8] rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#C59B27]"
                      />
                      <input
                        type="text"
                        value={customer.city}
                        onChange={(e) =>
                          setCustomer({ ...customer, city: e.target.value })
                        }
                        placeholder="المدينة / المنطقة"
                        className="bg-white border border-[#DFCFA8] rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#C59B27]"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={customer.address}
                        onChange={(e) =>
                          setCustomer({ ...customer, address: e.target.value })
                        }
                        placeholder="العنوان التفصيلي للتوصيل أو الحي"
                        className="w-full bg-white border border-[#DFCFA8] rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#C59B27]"
                      />
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={customer.notes}
                        onChange={(e) =>
                          setCustomer({ ...customer, notes: e.target.value })
                        }
                        placeholder="أي استفسار علاجي أو توصيات خاصة تريد إرفاقها للصيدلي العشبي..."
                        className="w-full bg-white border border-[#DFCFA8] rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#C59B27] resize-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="bg-[#FAF4E6] p-4 sm:p-5 border-t-2 border-[#E6D8BA] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#7A6B48]">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono font-bold">
                    {subtotal} {storeConfig.currency}
                  </span>
                </div>
                <div className="flex justify-between text-[#7A6B48]">
                  <span>الشحن والتوصيل:</span>
                  <span className="font-mono font-bold">
                    {isFreeShipping ? "مجاني 🎉" : `${shippingFee} ${storeConfig.currency}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-[#132B20] pt-1.5 border-t border-[#DFCFA8]">
                  <span>المجموع النهائي:</span>
                  <span className="font-mono text-[#C59B27]">
                    {total} {storeConfig.currency}
                  </span>
                </div>
              </div>

              {/* Main WhatsApp Checkout Button */}
              <button
                onClick={handleCheckoutWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white font-black py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transition active:scale-98 cursor-pointer text-sm"
              >
                <MessageCircle className="w-5 h-5 fill-white text-transparent" />
                <span>إتمام الطلب وإرسال الفاتورة عبر واتساب 🌿</span>
              </button>

              <p className="text-[10px] text-center text-[#8C7A53]">
                يتم فتح تطبيق واتساب مباشرة مع مسودة مفصلة للطلبية لتأكيدها مع الصيدلي
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
