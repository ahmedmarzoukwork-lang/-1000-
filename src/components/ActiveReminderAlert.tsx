import React from "react";
import { DailyReminder } from "../types";
import { Bell, Check, Clock, X, Volume2, Sparkles } from "lucide-react";

interface ActiveReminderAlertProps {
  reminder: DailyReminder;
  onDismiss: () => void;
  onMarkTaken: (reminderId: string) => void;
  onSnooze: (reminderId: string) => void;
  onOpenHerbDetails?: (herbId: string | number) => void;
}

export const ActiveReminderAlert: React.FC<ActiveReminderAlertProps> = ({
  reminder,
  onDismiss,
  onMarkTaken,
  onSnooze,
  onOpenHerbDetails,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="bg-[#FFFDF7] border-2 border-[#C59B27] rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden font-['Cairo'] text-[#1D2520] animate-in zoom-in-95 duration-200"
      >
        {/* Decorative Top Pattern */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#132B20] via-[#C59B27] to-[#132B20]" />

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 left-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition"
          title="إغلاق التنبيه"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with animated bell */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF0D7] border-2 border-[#C59B27] flex items-center justify-center text-[#9E7B1D] shadow-md animate-bounce">
            <Bell className="w-6 h-6 text-[#9E7B1D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#132B20] text-[#F5DC7D]">
                منبه الأعشاب اليومي
              </span>
              <span className="text-xs text-[#8C7A53] flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {reminder.time}
              </span>
            </div>
            <h3 className="text-xl font-black text-[#132B20] mt-0.5">
              حان موعد تناول {reminder.herbNameAr}
            </h3>
            {reminder.herbScientific && (
              <p className="text-[11px] text-[#7A6B4E] italic font-serif">
                {reminder.herbScientific}
              </p>
            )}
          </div>
        </div>

        {/* Dosage & Timing Note Box */}
        <div className="bg-[#FAF4E6] p-4 rounded-2xl border border-[#DECDB0] space-y-2.5 mb-4 text-xs">
          {reminder.dose && (
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#132B20] min-w-[55px]">الجرعة:</span>
              <span className="text-[#4F3F19] font-medium leading-relaxed">
                {reminder.dose}
              </span>
            </div>
          )}

          {reminder.timingNote && (
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#132B20] min-w-[55px]">التوقيت:</span>
              <span className="text-[#4F3F19] font-medium">
                {reminder.timingNote}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-[#DECDB0]/60 flex items-center justify-between text-[11px] text-[#785E21] font-['Amiri']">
            <span>🌿 بالشفاء والعافية بإذن الله تعالى</span>
            {onOpenHerbDetails && (
              <button
                onClick={() => onOpenHerbDetails(reminder.herbId)}
                className="text-[#132B20] underline font-bold hover:text-[#C59B27] transition"
              >
                عرض بطاقة العشبة كاملة
              </button>
            )}
          </div>
        </div>

        {/* Sunnah / Classical Etiquette Tip */}
        <div className="bg-[#F4EEDB] px-3.5 py-2 rounded-xl text-[11px] text-[#634E1A] font-['Amiri'] mb-5 border border-[#DECDB0]/50 text-center">
          «سَمِّ اللَّهَ، واشرب جالساً، وتناول الجرعة بهدوء دون إفراط»
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => onMarkTaken(reminder.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#132B20] hover:bg-[#1C3E2F] text-[#FBF7EE] font-black py-3 px-4 rounded-2xl transition shadow-md active:scale-95 text-xs"
          >
            <Check className="w-4 h-4 text-[#F5DC7D]" />
            <span>تم تناول الجرعة الآن ✓</span>
          </button>

          <button
            onClick={() => onSnooze(reminder.id)}
            className="flex items-center justify-center gap-1.5 bg-[#FAF0D7] hover:bg-[#F2E3BC] border border-[#C59B27]/50 text-[#785E21] font-bold py-3 px-4 rounded-2xl transition text-xs active:scale-95"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>غفوة 10 دقائق</span>
          </button>
        </div>
      </div>
    </div>
  );
};
