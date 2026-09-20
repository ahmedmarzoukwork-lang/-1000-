import { HerbItem } from "../types";

export interface GoogleSpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

const SHEETS_HEADERS = [
  "المعرف",
  "الاسم العربي",
  "الاسم العلمي",
  "الاسم الإنجليزي",
  "الفصيلة النباتية",
  "الجهاز الحيوي",
  "التأثير العلاجي",
  "المادة الفعالة",
  "الجرعة والاستعمال",
  "طريقة التحضير",
  "درجة الأمان والمحاذير",
  "مستوى الأمان",
  "موانع الاستعمال",
  "التداخلات الدوائية",
  "لمحة تاريخية وأثرية",
  "المراجع والدساتير الدولية",
];

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Creates a brand new Google Spreadsheet in the authenticated user's Drive and exports herbs into it.
 */
export async function createAndExportToSheets(
  accessToken: string,
  herbs: HerbItem[],
  sheetTitle: string = "موسوعة 1000 عشبة - السجل الصيدلاني الموثق"
): Promise<GoogleSpreadsheetInfo> {
  // 1. Create spreadsheet with RTL Arabic sheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle,
        locale: "ar_EG",
      },
      sheets: [
        {
          properties: {
            title: "الأعشاب الطبية",
            rightToLeft: true,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`فشل إنشاء جدول بيانات Google: ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl =
    createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare rows
  const rows: (string | number)[][] = [SHEETS_HEADERS];
  for (const h of herbs) {
    rows.push([
      h.id,
      h.nameAr || "",
      h.scientific || "",
      h.nameEn || "",
      h.family || "",
      h.system || "",
      h.target || "",
      h.active || "",
      h.dose || "",
      h.preparation || "",
      h.safety || "",
      h.safetyLevel || "",
      h.contraindications || "",
      h.interactions || "",
      h.historicalNote || "",
      h.references || "",
    ]);
  }

  // 3. Write data to sheet
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'الأعشاب الطبية'!A1?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range: "'الأعشاب الطبية'!A1",
        majorDimension: "ROWS",
        values: rows,
      }),
    }
  );

  if (!writeRes.ok) {
    const writeErr = await writeRes.text();
    throw new Error(`فشل حفظ بيانات الأعشاب في الجدول: ${writeErr}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: sheetTitle,
  };
}

/**
 * Appends herbs into an existing Google Spreadsheet
 */
export async function appendHerbsToExistingSheet(
  accessToken: string,
  spreadsheetId: string,
  herbs: HerbItem[]
): Promise<number> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!metaRes.ok) {
    const err = await metaRes.text();
    throw new Error(`تعذر الوصول إلى جدول Google Sheets المحدد: ${err}`);
  }

  const metaData = await metaRes.json();
  const firstSheetTitle =
    metaData.sheets?.[0]?.properties?.title || "Sheet1";

  const rows: (string | number)[][] = [];
  for (const h of herbs) {
    rows.push([
      h.id,
      h.nameAr || "",
      h.scientific || "",
      h.nameEn || "",
      h.family || "",
      h.system || "",
      h.target || "",
      h.active || "",
      h.dose || "",
      h.preparation || "",
      h.safety || "",
      h.safetyLevel || "",
      h.contraindications || "",
      h.interactions || "",
      h.historicalNote || "",
      h.references || "",
    ]);
  }

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(
      firstSheetTitle
    )}'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.text();
    throw new Error(`فشل إضافة الأعشاب إلى الجدول: ${err}`);
  }

  return herbs.length;
}

/**
 * Imports herbs from a Google Spreadsheet
 */
export async function importHerbsFromSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<HerbItem[]> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!metaRes.ok) {
    const err = await metaRes.text();
    throw new Error(`تعذر قراءة بيانات الجدول من Google: ${err}`);
  }

  const metaData = await metaRes.json();
  const firstSheetTitle =
    metaData.sheets?.[0]?.properties?.title || "Sheet1";

  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(
      firstSheetTitle
    )}'!A1:Z500`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!readRes.ok) {
    const err = await readRes.text();
    throw new Error(`فشل قراءة صفوف جدول البيانات: ${err}`);
  }

  const data = await readRes.json();
  const rows: string[][] = data.values || [];
  if (rows.length <= 1) {
    return [];
  }

  // Row 0 is header
  const importedHerbs: HerbItem[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[1]) continue;

    const herb: HerbItem = {
      id: row[0] || `sheet-${Date.now()}-${i}`,
      nameAr: row[1] || "",
      scientific: row[2] || "",
      nameEn: row[3] || "",
      family: row[4] || "",
      system: row[5] || "المناعة",
      target: row[6] || "",
      active: row[7] || "",
      dose: row[8] || "",
      preparation: row[9] || "",
      safety: row[10] || "",
      safetyLevel: row[11] || "آمن جداً",
      contraindications: row[12] || "",
      interactions: row[13] || "",
      historicalNote: row[14] || "",
      references: row[15] || "تم الاستيراد من Google Sheets",
      isCustom: true,
      addedAt: new Date().toISOString(),
    };
    importedHerbs.push(herb);
  }

  return importedHerbs;
}
