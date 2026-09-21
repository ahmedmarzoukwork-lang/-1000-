import React, { useState, useMemo, useEffect } from "react";
import { HerbItem, DailyReminder } from "../types";
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  Check,
  Volume2,
  Calendar,
  AlertCircle,
  X,
  Sparkles,
  Heart,
  ChevronLeft,
  Settings,
} from "lucide-react";
import {
  playHerbalChime,
  requestNotificationPermission,
} from "../utils/reminderAudio";

interface DailyReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  herbs: HerbItem[];
  favorites: (string | number)[];
  reminders: DailyReminder[];
  onSaveReminder: (reminder: DailyReminder) => void;
  onDeleteReminder: (reminderId: string) => void;
  onToggleReminderActive: (reminderId: string) => void;
  onTestTriggerReminder: (reminder: DailyReminder) => void;
  initialHerbId?: string | number | null;
  onOpenHerbDetails?: (herb: HerbItem) => void;
  onNavigateToCatalog?: () => void;
}

const TIME_PRESETS = [
  { label: "🌅 على الريق صباحاً", time: "07:30", note: "على معدة فارغة قبل الإفطار" },
  { label: "☀️ بعد الغداء", time: "14:00", note: "بعد وجبة الغداء بساعة" },
  { label: "☕ عصراً / بين الوجبات", time: "17:30", note: "كوب منقوع دافئ عصراً" },
  { label: "🌙 قبل النوم", time: "22:00", note: "قبل النوم لتهدئة الأعصاب والنوم الهانئ" },
];

const WEEK_DAYS = [
  { dayIndex: 6, label: "السبت" },
  { dayIndex: 0, label: "الأحد" },
  { dayIndex: 1, label: "الإثنين" },
  { dayIndex: 2, label: "الثلاثاء" },
  { dayIndex: 3, label: "الأربعاء" },
  { dayIndex: 4, label: "الخميس" },
  { dayIndex: 5, label: "الجمعة" },
];

export const DailyReminderModal: React.FC<DailyReminderModalProps> = ({
  isOpen,
  onClose,
  herbs,
  favorites,
  reminders,
  onSaveReminder,
  onDeleteReminder,
  onToggleReminderActive,
  onTestTriggerReminder,
  initialHerbId,
  onOpenHerbDetails,
  onNavigateToCatalog,
}) => {
  // Filter herbs by user's favorites
  const favoriteHerbs = useMemo(() => {
    return herbs.filter((h) => favorites.includes(h.id));
  }, [herbs, favorites]);

  // View state: 'list' or 'add'
  const [viewMode, setViewMode] = useState<"list" | "add">("list");

  // Form State
  const [selectedHerbId, setSelectedHerbId] = useState<string | number>("");
  const [time, setTime] = useState<string>("08:00");
  const [dose, setDose] = useState<string>("");
  const [timingNote, setTimingNote] = useState<string>("صباحاً على الريق");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [browserNotifyEnabled, setBrowserNotifyEnabled] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // all days
  const [notificationStatus, setNotificationStatus] = useState<string>(() => {
    return typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported";
  });

  // When opening with an initialHerbId, pre-select it and switch to add mode if needed
  useEffect(() => {
    if (initialHerbId) {
      setSelectedHerbId(initialHerbId);
      const targetHerb = herbs.find((h) => h.id === initialHerbId);
      if (targetHerb) {
        setDose(targetHerb.dose || "ملعقة صغيرة مغلاة في 200 مل ماء");
        setTimingNote(
          targetHerb.preparation
            ? `${targetHerb.preparation.slice(0, 50)}...`
            : "على الريق صباحاً"
        );
      }
      setViewMode("add");
    } else if (favoriteHerbs.length > 0 && !selectedHerbId) {
      setSelectedHerbId(favoriteHerbs[0].id);
      setDose(favoriteHerbs[0].dose || "");
    }
  }, [initialHerbId, favoriteHerbs, herbs]);

  // When selected herb changes in dropdown, auto-fill default dosage
  const handleSelectHerb = (herbId: string | number) => {
    setSelectedHerbId(herbId);
    const target = herbs.find((h) => String(h.id) === String(herbId));
    if (target) {
      setDose(target.dose || "ملعقة صغيرة في ماء دافئ");
      if (target.preparation && !timingNote) {
        setTimingNote(target.preparation.slice(0, 40));
      }
    }
  };

  // Preset time selector
  const handleApplyPreset = (presetTime: string, presetNote: string) => {
    setTime(presetTime);
    setTimingNote(presetNote);
  };

  // Day toggle
  const handleToggleDay = (dayIndex: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev; // keep at least one day
        return prev.filter((d) => d !== dayIndex);
      } else {
        return [...prev, dayIndex];
      }
    });
  };

  // Browser Notification permission requester
  const handleToggleBrowserNotification = async () => {
    if (!browserNotifyEnabled) {
      const permission = await requestNotificationPermission();
      setNotificationStatus(permission);
      if (permission === "granted") {
        setBrowserNotifyEnabled(true);
      } else {
        setBrowserNotifyEnabled(false);
      }
    } else {
      setBrowserNotifyEnabled(false);
    }
  };

  // Submit Reminder
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetHerb = herbs.find((h) => String(h.id) === String(selectedHerbId));
    if (!targetHerb) return;

    const newReminder: DailyReminder = {
      id: `reminder_${Date.now()}_${targetHerb.id}`,
      herbId: targetHerb.id,
      herbNameAr: targetHerb.nameAr,
      herbScientific: targetHerb.scientific,
      time,
      dose: dose.trim() || targetHerb.dose,
      timingNote: timingNote.trim(),
      isActive: true,
      daysOfWeek: selectedDays.length === 7 ? undefined : selectedDays,
      soundEnabled,
      browserNotifyEnabled,
      createdAt: new Date().toISOString(),
    };

    onSaveReminder(newReminder);
    setViewMode("list");
  };

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="bg-[#FFFDF9] border-2 border-[#C59B27] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden font-['Cairo'] text-[#1D2520] animate-in zoom-in-95 duration-200"
      >
        {/* Top Header Bar */}
        <div className="bg-[#132B20] text-[#FBF7EE] p-5 border-b-2 border-[#C59B27] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C59B27]/20 border border-[#C59B27] flex items-center justify-center text-[#F5DC7D] shadow-inner">
              <Bell className="w-5 h-5 text-[#F5DC7D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[#FBF7EE]">
                  منبه الأعشاب اليومي
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#C59B27] text-[#132B20]">
                  ميزة اختيارية
                </span>
              </div>
              <p className="text-xs text-[#E2D6B5]/80 font-['Amiri']">
                تذكير بمواعيد وجرعات تناول الأعشاب المختارة من قائمة مفضلاتك
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subheader / Tabs toggle */}
        <div className="bg-[#FAF4E6] px-5 py-2.5 border-b border-[#E6D7B8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "list"
                  ? "bg-[#132B20] text-[#FBF7EE] shadow-sm"
                  : "text-[#785E21] hover:bg-[#F2E5C5]"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#F5DC7D]" />
              <span>قائمة التنبيهات ({reminders.length})</span>
            </button>

            <button
              onClick={() => setViewMode("add")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "add"
                  ? "bg-[#132B20] text-[#FBF7EE] shadow-sm"
                  : "text-[#785E21] hover:bg-[#F2E5C5]"
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#F5DC7D]" />
              <span>إضافة تنبيه جديد</span>
            </button>
          </div>

          {/* Quick Sound Chime Test */}
          <button
            onClick={() => playHerbalChime()}
            className="text-xs font-bold text-[#785E21] hover:text-[#132B20] flex items-center gap-1 bg-[#FFF9EA] px-2.5 py-1 rounded-lg border border-[#DECDB0]"
            title="اختبار نغمة التنبيه الصوتية"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#C59B27]" />
            <span className="hidden sm:inline">اختبار الصوت</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* VIEW: ADD NEW REMINDER */}
          {viewMode === "add" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Check if Favorites Empty */}
              {favoriteHerbs.length === 0 ? (
                <div className="bg-[#FFF9EA] border-2 border-[#E8D7B0] p-6 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FAF0D7] border border-[#C59B27] mx-auto flex items-center justify-center text-[#9E7B1D]">
                    <Heart className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#132B20]">
                    قائمة مفضلاتك فارغة حالياً
                  </h3>
                  <p className="text-xs text-[#785E21] font-['Amiri'] max-w-md mx-auto leading-relaxed">
                    يعتمد منبه الأعشاب اليومي على قائمة مفضلاتك لضبط مواعيد الجرعات الخاصة بالأعشاب التي تستخدمها. انتقل إلى الفهرس واضغط على أيقونة القلب ❤️ لأي عشبة ترغب في تناولها، ثم عد إلى هنا لضبط التنبيه.
                  </p>
                  {onNavigateToCatalog && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToCatalog();
                      }}
                      className="bg-[#132B20] text-[#FBF7EE] font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#1C3E2F] transition inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-[#F5DC7D]" />
                      <span>تصفح الفهرس وإضافة أعشاب للمفضلة</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Step 1: Select Herb from Favorites */}
                  <div>
                    <label className="block text-xs font-bold text-[#132B20] mb-1.5">
                      1. اختر العشبة من قائمة مفضلاتك ({favoriteHerbs.length} متوفرة):
                    </label>
                    <select
                      value={selectedHerbId}
                      onChange={(e) => handleSelectHerb(e.target.value)}
                      required
                      className="w-full bg-white border-2 border-[#D8C7A0] focus:border-[#C59B27] rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-[#132B20] focus:outline-none"
                    >
                      {favoriteHerbs.map((herb) => (
                        <option key={herb.id} value={herb.id}>
                          {herb.nameAr} ({herb.scientific}) — الجهاز: {herb.system}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Time Picker & Quick Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#132B20]">
                        2. موعد التنبيه اليومي:
                      </label>
                      <span className="text-[11px] text-[#7A6B4E]">
                        توقيت 24 ساعة
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className="bg-white border-2 border-[#D8C7A0] focus:border-[#C59B27] rounded-xl px-4 py-2 text-base font-mono font-bold text-[#132B20] focus:outline-none shadow-inner"
                      />
                      <span className="text-xs text-[#785E21] font-['Amiri']">
                        سيتم إطلاق التنبيه الصوتي والإشعار يومياً في هذا التوقيت
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {TIME_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPreset(p.time, p.note)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                            time === p.time
                              ? "bg-[#132B20] text-[#FBF7EE] border-[#132B20]"
                              : "bg-[#FFF9EA] text-[#785E21] border-[#DECDB0] hover:bg-[#F4EEDB]"
                          }`}
                        >
                          {p.label} ({p.time})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Dose & Timing Note */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#132B20] mb-1">
                        3. الجرعة المقترحة:
                      </label>
                      <input
                        type="text"
                        value={dose}
                        onChange={(e) => setDose(e.target.value)}
                        placeholder="مثال: ملعقة صغيرة منقوعة في ماء دافئ"
                        className="w-full bg-white border-2 border-[#D8C7A0] focus:border-[#C59B27] rounded-xl px-3 py-2 text-xs font-medium text-[#132B20] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#132B20] mb-1">
                        4. ملاحظة التوقيت / التحضير:
                      </label>
                      <input
                        type="text"
                        value={timingNote}
                        onChange={(e) => setTimingNote(e.target.value)}
                        placeholder="مثال: مع ملعقة عسل نحل، قبل الطعام"
                        className="w-full bg-white border-2 border-[#D8C7A0] focus:border-[#C59B27] rounded-xl px-3 py-2 text-xs font-medium text-[#132B20] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Step 4: Days of Week */}
                  <div>
                    <label className="block text-xs font-bold text-[#132B20] mb-1.5">
                      5. أيام التكرار:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {WEEK_DAYS.map((wd) => {
                        const isSelected = selectedDays.includes(wd.dayIndex);
                        return (
                          <button
                            key={wd.dayIndex}
                            type="button"
                            onClick={() => handleToggleDay(wd.dayIndex)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                              isSelected
                                ? "bg-[#132B20] text-[#FBF7EE] border-[#132B20]"
                                : "bg-white text-stone-600 border-[#D8C7A0] hover:bg-[#F2E5C5]"
                            }`}
                          >
                            {wd.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                        className="text-[11px] text-[#785E21] underline px-2 py-1 font-bold hover:text-[#132B20]"
                      >
                        كل الأيام
                      </button>
                    </div>
                  </div>

                  {/* Options: Sound & Browser Push */}
                  <div className="bg-[#FAF4E6] p-3.5 rounded-2xl border border-[#DECDB0] space-y-2 text-xs">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-bold text-[#132B20] flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span>تشغيل نغمة رنين الأعشاب الهادئة عند التنبيه</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="rounded border-[#D8C7A0] text-[#132B20] focus:ring-[#C59B27] w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#DECDB0]/60">
                      <div>
                        <span className="font-bold text-[#132B20] block">
                          تفعيل إشعارات المتصفح والنظام (Desktop Notifications)
                        </span>
                        <span className="text-[10px] text-[#785E21]">
                          إشعار منبثق حتى لو كان المتصفح يعمل في الخلفية
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={browserNotifyEnabled}
                        onChange={handleToggleBrowserNotification}
                        className="rounded border-[#D8C7A0] text-[#132B20] focus:ring-[#C59B27] w-4 h-4"
                      />
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#132B20] hover:bg-[#1C3E2F] text-[#FBF7EE] font-black py-3 rounded-xl transition text-xs shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 text-[#F5DC7D]" />
                      <span>حفظ وتفعيل التنبيه اليومي</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className="px-4 py-3 rounded-xl border border-[#D8C7A0] text-xs font-bold text-[#785E21] hover:bg-[#FAF0D7] transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* VIEW: LIST OF REMINDERS */}
          {viewMode === "list" && (
            <div className="space-y-3">
              {reminders.length === 0 ? (
                <div className="text-center py-10 px-4 bg-[#FFF9EA] border-2 border-dashed border-[#DECDB0] rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FAF0D7] border border-[#C59B27] mx-auto flex items-center justify-center text-[#9E7B1D]">
                    <Clock className="w-6 h-6 text-[#9E7B1D]" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#132B20]">
                    لا توجد تنبيهات يومية مجدولة حالياً
                  </h3>
                  <p className="text-xs text-[#785E21] font-['Amiri'] max-w-sm mx-auto leading-relaxed">
                    اضبط تنبيهاً يومياً لأي عشبة في قائمة مفضلاتك (مثل الحبة السوداء صباحاً أو البابونج قبل النوم) لتذكيرك بالموعد والجرعة الموصى بها.
                  </p>
                  <button
                    onClick={() => setViewMode("add")}
                    className="bg-[#132B20] text-[#FBF7EE] font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-[#1C3E2F] transition inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-[#F5DC7D]" />
                    <span>إضافة أول تنبيه يومي الآن</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[#785E21] px-1 font-bold">
                    <span>التنبيهات المجدولة ({reminders.length})</span>
                    <span>الحالة</span>
                  </div>

                  {reminders.map((reminder) => {
                    const isTakenToday =
                      reminder.lastTakenDate &&
                      reminder.lastTakenDate.startsWith(todayStr);

                    return (
                      <div
                        key={reminder.id}
                        className={`p-4 rounded-2xl border-2 transition relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          reminder.isActive
                            ? "bg-white border-[#D8C7A0] shadow-sm hover:border-[#C59B27]"
                            : "bg-[#F7F4EC] border-stone-200 opacity-70"
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-[#132B20] bg-[#FAF0D7] px-2.5 py-0.5 rounded-lg border border-[#C59B27]/40 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#9E7B1D]" />
                              {reminder.time}
                            </span>

                            <h4 className="font-black text-sm text-[#132B20]">
                              {reminder.herbNameAr}
                            </h4>

                            {isTakenToday && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>تم التناول اليوم</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-[#634E1A] space-y-0.5 font-medium">
                            {reminder.dose && (
                              <p className="line-clamp-1">
                                <span className="font-bold text-[#132B20]">الجرعة:</span>{" "}
                                {reminder.dose}
                              </p>
                            )}
                            {reminder.timingNote && (
                              <p className="text-[11px] text-[#7A6B4E] line-clamp-1">
                                📌 {reminder.timingNote}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Controls & Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {/* Test Trigger Button */}
                          <button
                            onClick={() => onTestTriggerReminder(reminder)}
                            className="text-[11px] font-bold text-[#785E21] hover:text-[#132B20] bg-[#FFF9EA] hover:bg-[#F2E5C5] border border-[#DECDB0] px-2.5 py-1.5 rounded-xl transition"
                            title="تجربة كيف يظهر التنبيه الصوتي والمرئي"
                          >
                            تجربة
                          </button>

                          {/* Active Toggle Switch */}
                          <button
                            onClick={() => onToggleReminderActive(reminder.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                              reminder.isActive
                                ? "bg-emerald-700 text-white border-emerald-800"
                                : "bg-stone-200 text-stone-600 border-stone-300"
                            }`}
                          >
                            <span>{reminder.isActive ? "مُفعّل" : "مُعطّل"}</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => onDeleteReminder(reminder.id)}
                            className="text-stone-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition"
                            title="حذف هذا التنبيه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#FAF4E6] p-3.5 border-t border-[#DECDB0] text-[11px] text-[#785E21] text-center font-['Amiri'] shrink-0">
          💡 التنبيهات اختيارية تماماً ويمكنك تعديلها أو تعطيلها في أي وقت دون التأثير على قائمة مفضلاتك.
        </div>
      </div>
    </div>
  );
};
