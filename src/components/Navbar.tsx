import React from "react";
import { ViewTab } from "../types";
import { BrandLogo } from "./BrandLogo";
import { User } from "firebase/auth";
import {
  BookOpen,
  Sparkles,
  Scale,
  ShieldAlert,
  Compass,
  HardDrive,
  Printer,
  Upload,
  RotateCcw,
  Cloud,
  LogOut,
  LogIn,
  Bell,
} from "lucide-react";

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  totalHerbsCount: number;
  customLogoUrl: string | null;
  onUploadLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetLogo: () => void;
  onPrintPage: () => void;
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isSyncing?: boolean;
  onOpenReminders?: () => void;
  activeRemindersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  totalHerbsCount,
  customLogoUrl,
  onUploadLogo,
  onResetLogo,
  onPrintPage,
  currentUser,
  onLogin,
  onLogout,
  isSyncing,
  onOpenReminders,
  activeRemindersCount = 0,
}) => {
  return (
    <header className="relative bg-[#132B20] text-[#FBF7EE] border-b-2 border-[#C59B27] shadow-md no-print">
      {/* Top Banner with Brand Identity */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity area */}
        <div className="flex items-center gap-3">
          <div className="bg-[#0D1D16] p-1.5 rounded-xl border border-[#C59B27]/40 flex items-center justify-center">
            <BrandLogo size="sm" showSubtitle={false} customLogoUrl={customLogoUrl} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-['Cairo'] tracking-wide text-[#FBF7EE]">
                1000 عشبة
              </h1>
              <span className="text-[11px] font-bold font-['Amiri'] px-2 py-0.5 rounded-full bg-[#C59B27]/20 border border-[#C59B27]/50 text-[#F5DC7D]">
                جُمعت لأجلك
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#E2D6B5]/80 font-medium">
              الصيدلية النباتية الذكية • دستور العقاقير والطب التكاملي
            </p>
          </div>
        </div>

        {/* Counter and Utility Actions */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Firebase Cloud Sync / Auth Status */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-[#0E2018] border border-emerald-600/50 px-2.5 py-1.5 rounded-xl shadow-inner">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || "User"}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full border border-emerald-400 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">
                  {(currentUser.displayName || currentUser.email || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="hidden lg:block text-right">
                <span className="text-[10px] text-emerald-300 font-bold block leading-none flex items-center gap-1">
                  <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                  <span>سحابي Firebase</span>
                </span>
                <span className="text-[11px] text-[#FBF7EE] font-medium block truncate max-w-[100px] leading-tight">
                  {currentUser.displayName || currentUser.email?.split("@")[0]}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="text-stone-400 hover:text-rose-400 p-1 rounded-lg transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              title="تسجيل الدخول بحساب Google لمزامنة الأعشاب والمفضلة سحابياً"
              className="flex items-center gap-1.5 bg-[#1A382B] hover:bg-[#234A39] border border-[#C59B27]/40 text-[#F5DC7D] font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition text-[11px] sm:text-xs shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-[#C59B27]" />
              <span className="hidden sm:inline">دخول Google (سحابي)</span>
              <span className="sm:hidden">دخول</span>
            </button>
          )}

          {/* Daily Reminders Button */}
          {onOpenReminders && (
            <button
              onClick={onOpenReminders}
              title="منبه الأعشاب اليومي بناءً على قائمة مفضلاتك"
              className="relative flex items-center gap-1.5 bg-[#1A382B] hover:bg-[#234A39] border border-[#C59B27]/40 text-[#F5DC7D] font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition text-[11px] sm:text-xs shadow-sm cursor-pointer active:scale-95"
            >
              <Bell className="w-3.5 h-3.5 text-[#C59B27]" />
              <span className="hidden sm:inline">منبه الأعشاب</span>
              {activeRemindersCount > 0 && (
                <span className="bg-[#C59B27] text-[#132B20] text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {activeRemindersCount}
                </span>
              )}
            </button>
          )}

          {/* Progress / Catalog Counter */}
          <div className="bg-[#0E2018] border border-[#C59B27]/40 px-3 py-1.5 rounded-xl text-center shadow-inner">
            <span className="text-[#C49B28] block text-[10px] font-bold">الموسوعة الموثقة</span>
            <div className="font-extrabold text-[#FBF7EE] text-xs sm:text-sm font-mono flex items-center justify-center gap-1">
              <span>{totalHerbsCount}</span>
              <span className="text-[#C59B27] text-[10px]">/ 1000 عشبة</span>
            </div>
          </div>

          {/* Quick Print PDF Button */}
          <button
            onClick={onPrintPage}
            title="طباعة الصفحة أو حفظها كملف PDF"
            className="flex items-center gap-1.5 bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-bold px-3 py-2 rounded-xl transition shadow-md hover:shadow-lg active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">طباعة / PDF</span>
          </button>

          {/* Custom Logo Upload / Reset Option */}
          <div className="relative group">
            <label
              title="تخصيص الشعار أو رفع صورة الشعار الخاصة بك"
              className="flex items-center gap-1 bg-[#1A382B] hover:bg-[#234A39] border border-[#C59B27]/30 text-[#E2D6B5] px-2.5 py-2 rounded-xl cursor-pointer transition text-[11px]"
            >
              <Upload className="w-3.5 h-3.5 text-[#C59B27]" />
              <span className="hidden md:inline">رفع الشعار</span>
              <input
                type="file"
                accept="image/*"
                onChange={onUploadLogo}
                className="hidden"
              />
            </label>

            {customLogoUrl && (
              <button
                onClick={onResetLogo}
                title="استعادة الشعار الملكي الأصلي"
                className="absolute -top-1 -right-1 bg-red-800 text-white rounded-full p-0.5 shadow-md hover:bg-red-700"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="bg-[#0C1B14] border-t border-[#C59B27]/20 px-2 sm:px-6 py-1.5 overflow-x-auto custom-scrollbar flex items-center justify-start md:justify-center gap-1 sm:gap-2 text-xs font-bold font-['Cairo']">
        <button
          onClick={() => onSelectTab("catalog")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            currentTab === "catalog"
              ? "bg-[#C59B27] text-[#132B20] shadow-sm font-extrabold"
              : "text-[#E2D6B5] hover:bg-[#1A382B]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>الموسوعة الشاملة ({totalHerbsCount})</span>
        </button>

        <button
          onClick={() => onSelectTab("add-ai")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            currentTab === "add-ai"
              ? "bg-[#C59B27] text-[#132B20] shadow-sm font-extrabold"
              : "text-[#E2D6B5] hover:bg-[#1A382B]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>إضافة عشبة</span>
        </button>

        <button
          onClick={() => onSelectTab("comparison")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            currentTab === "comparison"
              ? "bg-[#C59B27] text-[#132B20] shadow-sm font-extrabold"
              : "text-[#E2D6B5] hover:bg-[#1A382B]"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>المقارنة السريرية</span>
        </button>

        <button
          onClick={() => onSelectTab("checker")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            currentTab === "checker"
              ? "bg-[#C59B27] text-[#132B20] shadow-sm font-extrabold"
              : "text-[#E2D6B5] hover:bg-[#1A382B]"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
          <span>فاحص التداخلات الدوائية</span>
        </button>

        <button
          onClick={() => onSelectTab("advisor")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            currentTab === "advisor"
              ? "bg-[#C59B27] text-[#132B20] shadow-sm font-extrabold"
              : "text-[#E2D6B5] hover:bg-[#1A382B]"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>المستشار النباتي</span>
        </button>

        <button
          onClick={() => onSelectTab("backup")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            currentTab === "backup"
              ? "bg-[#C59B27] text-[#132B20] shadow-sm font-extrabold"
              : "text-[#E2D6B5] hover:bg-[#1A382B]"
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-emerald-300" />
          <span>التخزين وGoogle Sheets</span>
        </button>
      </nav>
    </header>
  );
};
