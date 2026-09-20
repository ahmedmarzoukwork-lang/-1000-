import React, { useRef, useState, useEffect } from "react";
import { HerbItem } from "../types";
import { User } from "firebase/auth";
import {
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
  Database,
  Cloud,
  LogIn,
  LogOut,
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  PlusCircle,
  Server,
  Layers,
  HelpCircle,
} from "lucide-react";
import { exportDatabaseAsJsonFile } from "../utils/storage";
import {
  createAndExportToSheets,
  importHerbsFromSheets,
  appendHerbsToExistingSheet,
  extractSpreadsheetId,
  GoogleSpreadsheetInfo,
} from "../services/googleSheets";
import { getCachedAccessToken, loginWithGoogle } from "../firebase";

interface LocalBackupTabProps {
  herbs: HerbItem[];
  favoritesCount: number;
  onRestoreHerbs: (importedHerbs: HerbItem[]) => void;
  onResetDefaults: () => void;
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onSyncToCloud: () => Promise<void>;
  isSyncing: boolean;
}

export const LocalBackupTab: React.FC<LocalBackupTabProps> = ({
  herbs,
  favoritesCount,
  onRestoreHerbs,
  onResetDefaults,
  currentUser,
  onLogin,
  onLogout,
  onSyncToCloud,
  isSyncing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Google Sheets state
  const [isSheetsOperating, setIsSheetsOperating] = useState<boolean>(false);
  const [lastExportedSheet, setLastExportedSheet] = useState<GoogleSpreadsheetInfo | null>(null);
  const [targetSpreadsheetInput, setTargetSpreadsheetInput] = useState<string>("");
  const [showExportConfirmModal, setShowExportConfirmModal] = useState<boolean>(false);
  const [showImportConfirmModal, setShowImportConfirmModal] = useState<boolean>(false);

  // Cloud SQL state
  const [cloudSqlStatus, setCloudSqlStatus] = useState<{
    enabled: boolean;
    connected: boolean;
    instance?: string;
    region?: string;
    database?: string;
  }>({
    enabled: true,
    connected: true,
    instance: "ai-studio-4dac90ab",
    region: "europe-west2",
    database: "postgres",
  });
  const [isSyncingSql, setIsSyncingSql] = useState<boolean>(false);

  const customHerbsCount = herbs.filter((h) => h.isCustom).length;

  // Check Cloud SQL status on mount
  useEffect(() => {
    fetch("/api/cloudsql/status")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.enabled === "boolean") {
          setCloudSqlStatus(data);
        }
      })
      .catch(() => {
        // Fallback info
      });
  }, []);

  const handleExportJson = () => {
    exportDatabaseAsJsonFile(herbs);
    setStatusMessage("تم تنزيل ملف قاعدة البيانات الاحتياطية (JSON) بنجاح على جهازك.");
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          throw new Error("تنسيق الملف غير صالح؛ يجب أن يكون مصفوفة من الأعشاب.");
        }
        onRestoreHerbs(parsed);
        setStatusMessage(`تم استيراد ${parsed.length} عشبة بنجاح إلى قاعدة بيانات جهازك!`);
        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage(`فشل استيراد الملف: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTriggerCloudSync = async () => {
    try {
      await onSyncToCloud();
      setStatusMessage("تمت المزامنة السحابية بنجاح مع Firebase Firestore وحفظ كافة بياناتك!");
      setErrorMessage(null);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(`حدث خطأ أثناء المزامنة السحابية: ${err.message || err}`);
    }
  };

  // Ensure Access Token for Google Sheets
  const ensureAccessToken = async (): Promise<string> => {
    let token = getCachedAccessToken();
    if (!token) {
      // Prompt sign in with Google to get scopes
      const authResult = await loginWithGoogle();
      if (authResult?.cancelled) {
        throw new Error("تم إغلاق نافذة تسجيل الدخول بحساب Google من قبل المستخدم.");
      }
      token = authResult?.accessToken || null;
    }
    if (!token) {
      throw new Error(
        "يتعذر الحصول على تصريح وصول Google Sheets. يرجى تسجيل الدخول بحساب Google ومنح الأذونات."
      );
    }
    return token;
  };

  // Handle Export to Google Sheets
  const handleExecuteExportToSheets = async () => {
    setShowExportConfirmModal(false);
    setIsSheetsOperating(true);
    setErrorMessage(null);
    try {
      const token = await ensureAccessToken();
      const result = await createAndExportToSheets(token, herbs);
      setLastExportedSheet(result);
      setStatusMessage(`تم إنشاء وتصدير جدول Google Sheets بنجاح! تم حفظ ${herbs.length} عشبة.`);
    } catch (err: any) {
      setErrorMessage(`خطأ في تصدير Google Sheets: ${err.message || err}`);
    } finally {
      setIsSheetsOperating(false);
    }
  };

  // Handle Import from Google Sheets
  const handleExecuteImportFromSheets = async () => {
    setShowImportConfirmModal(false);
    if (!targetSpreadsheetInput.trim()) {
      setErrorMessage("يرجى إدخال رابط أو معرف جدول Google Sheets.");
      return;
    }
    setIsSheetsOperating(true);
    setErrorMessage(null);
    try {
      const token = await ensureAccessToken();
      const sheetId = extractSpreadsheetId(targetSpreadsheetInput);
      const imported = await importHerbsFromSheets(token, sheetId);
      if (imported.length === 0) {
        setErrorMessage("لم يتم العثور على أي صفوف أو بيانات أعشاب في الجدول المحدد.");
      } else {
        // Merge with existing herbs
        const map = new Map<string, HerbItem>();
        herbs.forEach((h) => map.set(String(h.id), h));
        imported.forEach((h) => map.set(String(h.id), h));
        const merged = Array.from(map.values());
        onRestoreHerbs(merged);
        setStatusMessage(`تم استيراد ${imported.length} عشبة بنجاح من Google Sheets ودمجها في الموسوعة.`);
      }
    } catch (err: any) {
      setErrorMessage(`خطأ في استيراد بيانات Google Sheets: ${err.message || err}`);
    } finally {
      setIsSheetsOperating(false);
    }
  };

  // Handle Append to Existing Sheet
  const handleAppendToExistingSheet = async () => {
    if (!targetSpreadsheetInput.trim()) {
      setErrorMessage("يرجى إدخال رابط أو معرف جدول Google Sheets للإلحاق به.");
      return;
    }
    setIsSheetsOperating(true);
    setErrorMessage(null);
    try {
      const token = await ensureAccessToken();
      const sheetId = extractSpreadsheetId(targetSpreadsheetInput);
      const count = await appendHerbsToExistingSheet(token, sheetId, herbs);
      setStatusMessage(`تم بنجاح إلحاق وإضافة ${count} عشبة إلى جدول Google Sheets المحدد!`);
    } catch (err: any) {
      setErrorMessage(`خطأ أثناء إلحاق الأعشاب بالجدول: ${err.message || err}`);
    } finally {
      setIsSheetsOperating(false);
    }
  };

  // Sync to Cloud SQL PostgreSQL
  const handleSyncToCloudSql = async () => {
    if (!currentUser) {
      onLogin();
      return;
    }
    setIsSyncingSql(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/cloudsql/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          herbs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل المزامنة مع Cloud SQL");
      }
      setStatusMessage(
        `تمت المزامنة بنجاح مع قاعدة بيانات Cloud SQL PostgreSQL (Instance: ai-studio-4dac90ab)`
      );
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(`خطأ مزامنة Cloud SQL: ${err.message || err}`);
    } finally {
      setIsSyncingSql(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#132B20] text-[#FBF7EE] rounded-3xl p-6 sm:p-8 border-2 border-[#C59B27] shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#C59B27] text-[#132B20] flex items-center justify-center font-black text-xl shadow-md">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-['Cairo'] text-[#FBF7EE]">
              إدارة التخزين والتكامل السحابي الشامل
            </h2>
            <p className="text-xs sm:text-sm text-[#F5DC7D] font-['Amiri']">
              جداول بيانات Google Sheets • قاعدة بيانات Cloud SQL (PostgreSQL) • سحابة Firebase Firestore
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-[#E2D6B5] leading-relaxed mt-2">
          يمكنك حفظ وتصدير قاعدة بيانات الأعشاب السريرية محلياً، ومزامنتها لحظياً مع جداول Google Sheets في حساب Google Drive الخاص بك، أو مع قواعد البيانات السحابية المركزية.
        </p>
      </div>

      {/* Alerts */}
      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* GOOGLE SHEETS INTEGRATION CARD */}
      <div className="bg-gradient-to-br from-[#0E281C] to-[#123625] text-[#FBF7EE] p-6 sm:p-7 rounded-3xl border-2 border-[#C59B27] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#C59B27]/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700/80 border border-emerald-400/50 flex items-center justify-center text-emerald-200 shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg font-['Cairo'] text-[#FBF7EE]">
                  جداول بيانات Google (Google Sheets)
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-[#E2D6B5]/80">
                تصدير واستيراد سجلات الـ 1000 عشبة مباشرة إلى حساب Google Drive الخاص بك
              </p>
            </div>
          </div>

          {!currentUser && (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-black px-4 py-2 rounded-xl text-xs transition shadow-md active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>ربط حساب Google Sheets</span>
            </button>
          )}
        </div>

        {/* Google Sheets Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Action 1: Create and Export to new Google Sheet */}
          <div className="bg-[#091A12]/90 p-5 rounded-2xl border border-emerald-700/40 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-[#F5DC7D] block mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>إنشاء جدول Google Sheets جديد</span>
              </span>
              <p className="text-[11px] text-[#D8CCA9] leading-relaxed">
                إنشاء جدول بيانات رسمي في Google Drive بالعربية (RTL) مع 16 عموداً صيدلانياً وتنسيق الأعمدة وتصدير كافة الـ {herbs.length} عشبة.
              </p>
            </div>

            <button
              onClick={() => setShowExportConfirmModal(true)}
              disabled={isSheetsOperating}
              className="w-full bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-black py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isSheetsOperating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جارِ التصدير إلى Google Sheets...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>تصدير الآن إلى Google Sheets</span>
                </>
              )}
            </button>
          </div>

          {/* Action 2: Import or Append to existing Sheet */}
          <div className="bg-[#091A12]/90 p-5 rounded-2xl border border-emerald-700/40 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-[#F5DC7D] block mb-1 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-amber-400" />
                <span>استيراد أو إلحاق بجدول قائم</span>
              </span>
              <p className="text-[11px] text-[#D8CCA9] leading-relaxed mb-2">
                أدخل رابط أو معرّف جدول Google Sheets لاستيراد الأعشاب منه أو إلحاق أعشاب إضافية به:
              </p>
              <input
                type="text"
                dir="ltr"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={targetSpreadsheetInput}
                onChange={(e) => setTargetSpreadsheetInput(e.target.value)}
                className="w-full bg-[#050D09] border border-emerald-800 text-[#FBF7EE] placeholder-stone-500 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#C59B27]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowImportConfirmModal(true)}
                disabled={isSheetsOperating || !targetSpreadsheetInput.trim()}
                className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold py-2 rounded-xl text-xs transition disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>استيراد</span>
              </button>
              <button
                onClick={handleAppendToExistingSheet}
                disabled={isSheetsOperating || !targetSpreadsheetInput.trim()}
                className="flex-1 bg-[#1A382B] hover:bg-[#254F3D] text-[#F5DC7D] border border-[#C59B27]/40 font-bold py-2 rounded-xl text-xs transition disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إلحاق بالجدول</span>
              </button>
            </div>
          </div>
        </div>

        {/* Last Exported Sheet Feedback */}
        {lastExportedSheet && (
          <div className="bg-[#06120C] border border-emerald-500/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">{lastExportedSheet.title}</span>
                <span className="text-[11px] text-[#A69772] font-mono">
                  معرّف الجدول: {lastExportedSheet.spreadsheetId}
                </span>
              </div>
            </div>
            <a
              href={lastExportedSheet.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md"
            >
              <span>فتح الجدول في Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* CLOUD SQL (PostgreSQL) CARD */}
      <div className="bg-[#FCF9F2] p-6 rounded-3xl border-2 border-[#E6D8BA] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E6D8BA] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#132B20] text-[#F5DC7D] flex items-center justify-center shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-['Cairo'] text-[#132B20]">
                  قاعدة بيانات Cloud SQL (PostgreSQL)
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  Drizzle ORM
                </span>
              </div>
              <p className="text-xs text-[#6B5731]">
                النسخة العلائقية المهيأة لمنطقة europe-west2 (المشروع: active-catcher-8gmzr)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncToCloudSql}
              disabled={isSyncingSql}
              className="flex items-center gap-1.5 bg-[#132B20] hover:bg-[#1C3E2F] text-[#FBF7EE] font-bold px-4 py-2 rounded-xl text-xs transition shadow-md disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSql ? "animate-spin" : ""}`} />
              <span>{isSyncingSql ? "جارِ المزامنة..." : "مزامنة الأعشاب مع Cloud SQL"}</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#E6D8BA] flex flex-wrap items-center justify-between gap-2 text-xs text-[#524424]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>حالة المحرك: <strong>نشط وجاهز (Active)</strong></span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-[#8C6F32]">
            <span>Instance: {cloudSqlStatus.instance || "ai-studio-4dac90ab"}</span>
            <span>Region: {cloudSqlStatus.region || "europe-west2"}</span>
            <span>Schema: users, herbs, favorites</span>
          </div>
        </div>
      </div>

      {/* FIREBASE FIRESTORE SYNC CARD */}
      <div className="bg-[#FCF9F2] p-6 rounded-3xl border-2 border-[#E6D8BA] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Cairo'] text-[#132B20] flex items-center gap-2">
                <span>تزامن Firebase Firestore اللحظي</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                  سحابي نشط
                </span>
              </h3>
              <p className="text-xs text-[#6B5731]">
                تزامن فوري للأعشاب والمفضلة مع قاعدة بيانات: <strong className="font-mono">active-catcher-8gmzr</strong>
              </p>
            </div>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerCloudSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-black px-4 py-2 rounded-xl text-xs transition shadow-md disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "جارِ الحفظ..." : "مزامنة سحابية الآن"}</span>
              </button>
              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="p-2 bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-700 rounded-xl transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 bg-[#132B20] hover:bg-[#1E4232] text-[#FBF7EE] font-bold px-4 py-2 rounded-xl text-xs transition shadow-md active:scale-95"
            >
              <LogIn className="w-4 h-4 text-[#C59B27]" />
              <span>تسجيل الدخول بـ Google</span>
            </button>
          )}
        </div>

        {currentUser && (
          <div className="bg-white p-3 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-[#423417]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>المستخدم المتصل: <strong>{currentUser.displayName || currentUser.email}</strong></span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold">تزامن تلقائي في الوقت الحقيقي</span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FCF9F2] p-5 rounded-2xl border-2 border-[#E6D8BA] text-center">
          <Database className="w-6 h-6 text-[#C59B27] mx-auto mb-1" />
          <span className="text-xs font-bold text-[#6D5A32] block">إجمالي الأعشاب في جهازك</span>
          <strong className="text-2xl font-black text-[#132B20] font-mono">{herbs.length}</strong>
        </div>

        <div className="bg-[#FCF9F2] p-5 rounded-2xl border-2 border-[#E6D8BA] text-center">
          <ShieldCheck className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
          <span className="text-xs font-bold text-[#6D5A32] block">أعشاب أُضيفت بالذكاء الاصطناعي</span>
          <strong className="text-2xl font-black text-[#132B20] font-mono">{customHerbsCount}</strong>
        </div>

        <div className="bg-[#FCF9F2] p-5 rounded-2xl border-2 border-[#E6D8BA] text-center">
          <FileJson className="w-6 h-6 text-purple-700 mx-auto mb-1" />
          <span className="text-xs font-bold text-[#6D5A32] block">الأعشاب المفضلة</span>
          <strong className="text-2xl font-black text-[#132B20] font-mono">{favoritesCount}</strong>
        </div>
      </div>

      {/* Action Cards (Local JSON) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export Backup */}
        <div className="bg-[#FCF9F2] p-6 rounded-3xl border-2 border-[#E6D8BA] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[#132B20] font-bold text-sm mb-2 font-['Cairo']">
              <Download className="w-4 h-4 text-[#C59B27]" />
              <span>تنزيل نسخة احتياطية محلية (JSON)</span>
            </div>
            <p className="text-xs text-[#594B2C] leading-relaxed">
              قم بتنزيل ملف JSON يحتوي على كافة بيانات الـ {herbs.length} عشبة بما فيها الأعشاب المضافة والجرعات والملاحظات لحفظها على جهازك.
            </p>
          </div>

          <button
            onClick={handleExportJson}
            className="w-full bg-[#132B20] hover:bg-[#1A3B2B] text-[#FBF7EE] font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4 text-[#F5DC7D]" />
            <span>تنزيل ملف النسخة الاحتياطية</span>
          </button>
        </div>

        {/* Import Backup */}
        <div className="bg-[#FCF9F2] p-6 rounded-3xl border-2 border-[#E6D8BA] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[#132B20] font-bold text-sm mb-2 font-['Cairo']">
              <Upload className="w-4 h-4 text-[#A07A15]" />
              <span>استيراد من ملف محلي (JSON)</span>
            </div>
            <p className="text-xs text-[#594B2C] leading-relaxed">
              استرجع بيانات موسوعة 1000 عشبة من ملف JSON محفوظ مسبقاً على حاسوبك، وسيتم دمجها فوراً.
            </p>
          </div>

          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[#C59B27] hover:bg-[#D4AF37] text-[#132B20] font-black py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>اختر ملف JSON للاستيراد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset to Defaults */}
      <div className="bg-[#FFF9EA] p-5 rounded-2xl border border-[#F0DFB3] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-right">
          <span className="text-xs font-bold text-[#8C6914] block">إعادة الضبط المصنعي</span>
          <p className="text-[11px] text-[#69531C]">
            استعادة الـ 53 عشبة السريرية الأساسية المعتمدة والتراجع عن أي تعديلات.
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm("هل أنت متأكد من رغبتك في إعادة تعيين الموسوعة للأعشاب الـ 53 الأصلية؟")) {
              onResetDefaults();
              setStatusMessage("تمت استعادة الـ 53 عشبة الأصلية بنجاح.");
            }
          }}
          className="flex items-center gap-1.5 text-xs text-rose-800 hover:text-rose-950 font-bold bg-rose-100 hover:bg-rose-200 border border-rose-300 px-3 py-2 rounded-xl transition shrink-0 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة التعيين للأصل</span>
        </button>
      </div>

      {/* EXPORT CONFIRMATION MODAL (MANDATORY per Workspace guidelines) */}
      {showExportConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCF9F2] text-[#132B20] max-w-md w-full rounded-3xl p-6 border-2 border-[#C59B27] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base font-['Cairo']">
                تأكيد التصدير إلى Google Sheets
              </h3>
            </div>
            <p className="text-xs text-[#524424] leading-relaxed">
              أنت على وشك إنشاء جدول بيانات جديد في حسابك على Google Drive بعنوان{" "}
              <strong>«موسوعة 1000 عشبة - السجل الصيدلاني الموثق»</strong> وتصدير كامل السجلات ({herbs.length} عشبة طبية) مع كافة الأعمدة والمراجع.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleExecuteExportToSheets}
                className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
              >
                تأكيد التصدير إلى Google Sheets
              </button>
              <button
                onClick={() => setShowExportConfirmModal(false)}
                className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT CONFIRMATION MODAL (MANDATORY per Workspace guidelines) */}
      {showImportConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCF9F2] text-[#132B20] max-w-md w-full rounded-3xl p-6 border-2 border-[#C59B27] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base font-['Cairo']">
                تأكيد استيراد البيانات من Google Sheets
              </h3>
            </div>
            <p className="text-xs text-[#524424] leading-relaxed">
              سيتم قراءة سجلات الأعشاب من جدول Google Sheets المحدد ودمجها في موسوعتك المحلية. هل تريد المتابعة؟
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleExecuteImportFromSheets}
                className="flex-1 bg-[#132B20] hover:bg-[#1E4232] text-[#FBF7EE] font-bold py-2.5 rounded-xl text-xs transition shadow-md"
              >
                تأكيد الاستيراد والدمج
              </button>
              <button
                onClick={() => setShowImportConfirmModal(false)}
                className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
