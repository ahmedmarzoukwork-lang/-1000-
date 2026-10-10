import { HerbItem, CartItem, StoreConfig, StoreCustomerInfo } from "../types";

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  whatsappNumber: "966501234567", // رقم الواتساب الافتراضي للمتجر (قابل للتعديل بنقرة زر)
  storeName: "صيدلية ومتجر 1000 عشبة الطبية",
  currency: "ر.س",
  freeShippingThreshold: 150,
  shippingFee: 25,
};

const STORE_CONFIG_STORAGE_KEY = "herbal_1000_store_config";
const CART_STORAGE_KEY = "herbal_1000_cart_items";

// Deterministic base price based on herb ID or string hash
export function getHerbPricing(herb: HerbItem): {
  basePrice: number;
  inStock: boolean;
  packages: { label: string; price: number; weight: string }[];
} {
  const inStock = herb.inStock !== false;

  if (herb.price && herb.packageOptions && herb.packageOptions.length > 0) {
    return {
      basePrice: herb.price,
      inStock,
      packages: herb.packageOptions.map((p) => ({
        label: p.label,
        price: p.price,
        weight: p.label,
      })),
    };
  }

  // If explicit price is set by store owner
  let basePrice = herb.price;
  if (!basePrice || basePrice <= 0) {
    const idNum = typeof herb.id === "number" ? herb.id : herb.id.charCodeAt(0) || 12;
    const priceVariations = [35, 42, 48, 55, 60, 38, 45, 65, 50, 70];
    basePrice = priceVariations[Math.abs(idNum) % priceVariations.length];
  }

  return {
    basePrice,
    inStock,
    packages: [
      {
        label: "عبوة 100 جم (عشب عضوي نقي)",
        weight: "100 جم",
        price: basePrice,
      },
      {
        label: "عبوة 250 جم (توفيرية ممتازة)",
        weight: "250 جم",
        price: Math.round(basePrice * 2.2),
      },
      {
        label: "عبوة 500 جم (نصف كيلو فاخر)",
        weight: "500 جم",
        price: Math.round(basePrice * 4.1),
      },
      {
        label: "خلاصة مركزة (قطارة صيدلانية 50 مل)",
        weight: "قطارة 50 مل",
        price: Math.round(basePrice * 1.6),
      },
    ],
  };
}

export function loadStoreConfig(): StoreConfig {
  try {
    const raw = localStorage.getItem(STORE_CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_STORE_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Failed to load store config:", e);
  }
  return DEFAULT_STORE_CONFIG;
}

export function saveStoreConfig(config: StoreConfig): void {
  try {
    localStorage.setItem(STORE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save store config:", e);
  }
}

export function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load cart from storage:", e);
  }
  return [];
}

export function saveCartToStorage(cart: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Failed to save cart to storage:", e);
  }
}

// Generate formatted WhatsApp message for complete cart order
export function buildWhatsAppCartMessage(
  cart: CartItem[],
  customer: StoreCustomerInfo,
  config: StoreConfig,
  orderCode: string
): string {
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isFreeShipping = subtotal >= config.freeShippingThreshold;
  const shipping = isFreeShipping ? 0 : config.shippingFee;
  const total = subtotal + shipping;

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines: string[] = [
    `🌿 *طلب جديد من متجر 1000 عشبة الطبية* 🌿`,
    `📋 رقم الطلب: \`${orderCode}\``,
    `📅 التاريخ: ${dateStr} - ${timeStr}`,
    `----------------------------------`,
    `👤 *بيانات العميل:*`,
    `• الاسم: ${customer.fullName}`,
    `• رقم الجوال: ${customer.phone}`,
    `• المدينة / الدولة: ${customer.city}`,
    `• العنوان بالتفصيل: ${customer.address}`,
  ];

  if (customer.notes && customer.notes.trim()) {
    lines.push(`• ملاحظات أو استفسار: ${customer.notes.trim()}`);
  }

  lines.push(`----------------------------------`);
  lines.push(`🛍️ *قائمة الأعشاب والمنتجات المطلوبة:*`);

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    lines.push(
      `${index + 1}) *${item.nameAr}* ${item.scientific ? `(${item.scientific})` : ""}\n` +
      `   ▫️ الحجم: ${item.packageSize}\n` +
      `   ▫️ الكمية: ${item.quantity}\n` +
      `   ▫️ السعر: ${item.price} ${config.currency} × ${item.quantity} = *${itemTotal} ${config.currency}*`
    );
  });

  lines.push(`----------------------------------`);
  lines.push(`💰 *ملخص الحساب:*`);
  lines.push(`• المجموع الفرعي: ${subtotal} ${config.currency}`);
  lines.push(
    `• الشحن والتوصيل: ${
      isFreeShipping ? "مجاني (تجاوز 150 ر.س) 🎉" : `${shipping} ${config.currency}`
    }`
  );
  lines.push(`⭐ *الإجمالي النهائي المطلوب: ${total} ${config.currency}*`);
  lines.push(`----------------------------------`);
  lines.push(`✨ *أرجو تأكيد الطلب وتزويدي برقم الحساب وبيانات الشحن الفوري. شكراً لكم!*`);

  return lines.join("\n");
}

// Generate fast single-item WhatsApp message
export function buildWhatsAppDirectHerbMessage(
  herb: HerbItem,
  packageSize: string,
  price: number,
  quantity: number = 1,
  config: StoreConfig
): string {
  const total = price * quantity;
  return (
    `مرحباً، أود طلب عشبة من متجر 1000 عشبة الطبية:\n\n` +
    `🌿 *اسم العشبة:* ${herb.nameAr} (${herb.scientific})\n` +
    `📦 *العبوة المختارة:* ${packageSize}\n` +
    `🔢 *الكمية:* ${quantity}\n` +
    `💰 *السعر:* ${total} ${config.currency}\n` +
    (herb.target ? `🎯 *الغرض الطبي المطلوب:* ${herb.target}\n` : "") +
    `\nيرجى التكرم بتأكيد التوفر وترتيب الشحن لي، شكراً جزيلاً!`
  );
}

// Create actual WhatsApp URL
export function createWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
