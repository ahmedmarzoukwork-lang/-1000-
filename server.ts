import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function parseJsonSafely(rawText: string | undefined): any {
  if (!rawText) return {};
  try {
    return JSON.parse(rawText);
  } catch {
    // Attempt markdown fence removal
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned);
  }
}

// Resilient execution candidate models
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

async function callGeminiWithResilience(
  ai: GoogleGenAI,
  params: {
    contents: string;
    config: any;
  }
) {
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    const maxRetries = 1; // 1 quick retry per model before swift fallback to next candidate
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Requesting ${model} (attempt ${attempt + 1}/${maxRetries + 1})...`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || "").toLowerCase();
        const isTemporarySpike =
          msg.includes("503") ||
          msg.includes("unavailable") ||
          msg.includes("high demand") ||
          msg.includes("spikes in demand") ||
          msg.includes("429") ||
          msg.includes("resource_exhausted") ||
          msg.includes("overloaded") ||
          msg.includes("timeout") ||
          msg.includes("econnreset") ||
          msg.includes("fetch failed");

        console.warn(`[Gemini API] ${model} attempt ${attempt + 1} encountered: ${err?.message || err}`);

        if (isTemporarySpike) {
          if (attempt < maxRetries) {
            const delayMs = 400 + Math.floor(Math.random() * 300);
            console.log(`[Gemini API] Temporary spike detected. Quick retry in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          } else {
            console.warn(`[Gemini API] Switching immediately to next fallback candidate...`);
            break; // Try next model candidate in FALLBACK_MODELS
          }
        } else {
          // If non-temporary error (e.g. invalid request structure), do not retry indefinitely
          throw err;
        }
      }
    }
  }

  throw lastError;
}

function handleGeminiError(error: any, res: express.Response, defaultArabicMessage: string) {
  console.error("Gemini Route Error:", error);
  const msg = String(error?.message || error || "").toLowerCase();
  const isHighDemand =
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("unavailable") ||
    msg.includes("spikes in demand") ||
    msg.includes("429") ||
    msg.includes("resource_exhausted");

  const friendlyMessage = isHighDemand
    ? "خوادم الذكاء الاصطناعي تشهد إقبالاً وضغطاً مؤقتاً في هذه اللحظة. يرجى النقر على زر 'إعادة المحاولة' للمتابعة."
    : error?.message || defaultArabicMessage;

  res.status(isHighDemand ? 503 : 500).json({
    success: false,
    error: friendlyMessage,
    isTemporary: isHighDemand,
    canRetry: true,
  });
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI: Generate comprehensive clinical & botanical monograph for any herb or plant
app.post("/api/gemini/add-herb", async (req, res) => {
  try {
    const { plantQuery } = req.body;
    if (!plantQuery || typeof plantQuery !== "string") {
      res.status(400).json({ error: "اسم النبتة أو الوصف مطلوب" });
      return;
    }

    const ai = getGenAI();
    const systemInstruction = `أنت خبير صيدلاني سريري وباحث ومحقق في علم العقاقير والنباتات الطبية والتراث الطبي العربي والإسلامي (Pharmacognosy, Phytotherapy & Classical Arabic Herbal Heritage) لدى موسوعة وصيدلية '1000 عشبة' (جُمعت لأجلك).
مهمتك: توليد بطاقة علمية وتراثية شاملة ودقيقة لأي عشبة أو نبتة طبية يطلبها المستخدم، مستنداً ومستشهداً بالمصادر المعتمدة الأصيلة:

أولاً: أمهات كتب التراث الطبي العربي والإسلامي:
1. كتاب «الطب النبوي» للإمام ابن قيم الجوزية، وكتاب «الطب النبوي» للإمام الذهبي (الأحاديث النبوية، ومنافع النباتات المذكورة في السنة النبوية، وتطبيقاتها العلاجية).
2. موسوعة «القانون في الطب» للشيخ الرئيس ابن سينا (ماهية العشبة، مزاجها: حار/بارد/رطب/يابس، درجتها، وأفعالها وخواصها في علاج الأعضاء والرأس والصدر والأحشاء).
3. كتاب «الجامع لمفردات الأدوية والأغذية» للمحدث العشاب ضياء الدين ابن البيطار.
4. كتاب «تذكرة أولي الألباب والجامع للعجب العجاب» للحكيم داود الأنطاكي.
5. كتاب «الحاوي في الطب» للحكيم أبي بكر الرازي.

ثانياً: دساتير الأدوية والبحوث السريرية العالمية الحديثة:
1. دراسات منظمة الصحة العالمية للنباتات الطبية (WHO Monographs on Selected Medicinal Plants Volumes 1-4)
2. دراسات الهيئة الأوروبية للأدوية (EMA/HMPC Community Herbal Monographs)
3. دستور اللجنة الألمانية للأعشاب الطبية (German Commission E Monographs)
4. دستور الأدوية الأمريكي للمكملات النباتية (United States Pharmacopeia - USP-NF)
5. التعاونية العلمية الأوروبية للعلاج بالنباتات (ESCOP Monographs)
6. بردية إيبرس المصرية الطبية وبرديات الطب المصري القديم (Ebers Papyrus c. 1550 BCE)
7. المكتبة الوطنية الأمريكية للطب وأبحاث (PubMed / NCBI & NIH-NCCIH).

الإخراج يجب أن يكون بتنسيق JSON متوافق مع المخطط المحدد بالكامل، مع معلومات سريرية دقيقة، جرعات قياسية، اقتباس صريح وموثق من كتب التراث العربي وابن سينا والطب النبوي، وسرد كامل للمراجع المعتمدة.`;

    const prompt = `قم بإنشاء بطاقة سريرية وتوثيقية كاملة للعشبة أو النبتة الطبية: "${plantQuery}".
تأكد من استخراج وتوثيق الآتي مستشهداً بالمصادر العربية الأصيلة والمراجع العالمية:
1. الاسم العربي الشائع والدقيق (nameAr).
2. الاسم الإنجليزي (nameEn).
3. الاسم العلمي باللاتينية (scientific).
4. الفصيلة النباتية (family).
5. الجهاز الحيوي المستهدف (system): اختر الفئة الأنسب من بين:
   - "المناعة"
   - "الهضم والكبد"
   - "الأعصاب والتكيف"
   - "التنفس والقلب"
   - "الهرمونات والصحة العامة"
   - "المفاصل والكلى"
   - "مغذية ووقائية"
   - "الجلد والتجميل"
6. التأثير والهدف العلاجي الرئيسي (target).
7. المادة الفعالة الرئيسية (active).
8. الجرعة القياسية وطريقة الاستعمال (dose).
9. طريقة التحضير الصيدلانية التقليدية (منقوع، مغلي، مسحوق، كبسولة، صبغة) (preparation).
10. درجة الأمان والمحاذير السريرية (safety).
11. موانع الاستعمال الصارمة (contraindications).
12. أهم التداخلات الدوائية المعروفة (interactions).
13. اقتباس وتوثيق صريح من كتب التراث الطبي العربي والطب النبوي (arabicHeritageCitation):
    - استشهد بدقة بما ورد عن هذه النبتة في "كتاب الطب النبوي" لابن القيم أو الذهبي إن ذُكرت أو ثبت فيها حديث/أثر.
    - واستشهد بما نص عليه الشيخ الرئيس ابن سينا في "القانون في الطب" مبيناً مزاجها (حرارتها وبرودتها ويبوستها) ونفعها للأعضاء.
    - أو ما ذكره ابن البيطار في "الجامع لمفردات الأدوية والأغذية" أو داود الأنطاكي في "التذكرة".
    - اذكر نص المقولة مع عزوها الصريح لمؤلفها وكتابه.
14. لمحة تاريخية أو أثرية موثقة في التراث المصري القديم وبردية إيبرس أو الحضارات العريقة (historicalNote).
15. وسم درجة الخطورة أو الحذر (safetyLevel): "آمن جداً" أو "حذر معتدل" أو "عالي الخطورة ويشترط إشراف طبي".
16. شرح وتوصيف صيدلاني مفصل للمنتج (description): شرح علمي متعمق يجمع بين الأصالة الطبية العربية والاكتشافات الصيدلانية الحديثة.
17. آلية العمل الدوائية والفسيولوجية في الجسم (pharmacology): تفاعل المواد الفعالة داخل الجسم.
18. قائمة بأهم 4 فوائد علاجية وصحية ملموسة للمنتج (benefits).
19. المراجع العلمية الدولية والتراثية المعتمدة (references): وثّق فيها كتب التراث (مثل: كتاب الطب النبوي لابن القيم، القانون في الطب لابن سينا، الجامع لابن البيطار) بجانب المراجع الدولية (WHO Monographs, German Commission E, EMA, USP).`;

    const response = await callGeminiWithResilience(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nameAr: { type: Type.STRING },
            nameEn: { type: Type.STRING },
            scientific: { type: Type.STRING },
            family: { type: Type.STRING },
            system: { type: Type.STRING },
            target: { type: Type.STRING },
            active: { type: Type.STRING },
            dose: { type: Type.STRING },
            preparation: { type: Type.STRING },
            safety: { type: Type.STRING },
            contraindications: { type: Type.STRING },
            interactions: { type: Type.STRING },
            arabicHeritageCitation: {
              type: Type.STRING,
              description: "اقتباس وتوثيق صريح من كتاب الطب النبوي وكتب ابن سينا (القانون في الطب) وابن البيطار والأنطاكي",
            },
            historicalNote: { type: Type.STRING },
            safetyLevel: { type: Type.STRING },
            description: { type: Type.STRING, description: "شرح صيدلاني وسريري شامل ومفصل جداً للمنتج وفوائده" },
            pharmacology: { type: Type.STRING, description: "آلية العمل الدوائية والتأثير الحيوي في الجسم" },
            benefits: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "أبرز الفوائد والخصائص العلاجية للمنتج",
            },
            references: { type: Type.STRING, description: "المراجع العربية التراثية والدولية المعتمدة المستند إليها" },
          },
          required: [
            "nameAr",
            "nameEn",
            "scientific",
            "system",
            "target",
            "active",
            "dose",
            "safety",
            "description",
          ],
        },
      },
    });

    const parsedData = parseJsonSafely(response.text);
    res.json({ success: true, herb: parsedData });
  } catch (error: any) {
    handleGeminiError(error, res, "حدث خطأ أثناء استخراج بيانات النبتة بالذكاء الاصطناعي");
  }
});

// AI: Check Drug-Herb Interaction
app.post("/api/gemini/check-interaction", async (req, res) => {
  try {
    const { herbName, medications, condition } = req.body;
    if (!herbName || !medications) {
      res.status(400).json({ error: "اسم العشبة وقائمة الأدوية مطلوبة للفحص" });
      return;
    }

    const ai = getGenAI();
    const prompt = `بصفتك صيدلياً سريرياً خبيراً وباحثاً في التراث الطبي العربي، قم بفحص التداخل الدوائي بين العشبة: "${herbName}"
والأدوية أو المواد التالية: "${medications}"
الحالة الصحية للمريض (إن وجدت): "${condition || "غير محدد"}"

استحضر معلوماتك من أهم المراجع الصيدلانية السريرية المعتمدة عالمياً والتراث الطبي:
- مرجع ستوكلي للتداخلات الدوائية والعشبية (Stockley's Herbal Medicines Interactions)
- تقارير الهيئة الأوروبية للأدوية ولجنة المنتجات العشبية (EMA / HMPC)
- أبحاث المكتبة الوطنية الأمريكية للطب (PubMed / NCBI & NIH-NCCIH)
- ما نص عليه الشيخ الرئيس ابن سينا في "القانون في الطب" والإمام ابن القيم في "الطب النبوي" من تنبيهات لمزج الأعشاب وإصلاح غائلتها.

قم بتقديم تقرير فحص تفصيلي يتضمن:
1. مستوى الخطورة الإجمالي (riskLevel: "آمن - منخفض الخطورة" | "تداخل معتدل - يلزم المراقبة أو المباعدة" | "خطر شديد - تعارض ممنوع تماماً").
2. الآلية الحيوية للتداخل (cytochrome P450, امتصاص، سيولة الدم، ضغط، سكر).
3. التوصية السريرية للمريض وطريقة الاستخدام الآمنة أو البديل.
4. مدة الفصل الزمني الموصى بها بين الجرعات.
5. توجيه أو ملاحظة من كتب التراث الطبي العربي أو ابن سينا أو الطب النبوي حول هذه النبتة وطبائعها (traditionalNote).
6. المراجع السريرية والتراثية المعتمدة (references).`;

    const response = await callGeminiWithResilience(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            riskColor: { type: Type.STRING, description: "green, yellow, red" },
            mechanism: { type: Type.STRING },
            clinicalAdvice: { type: Type.STRING },
            spacingHours: { type: Type.STRING },
            summary: { type: Type.STRING },
            traditionalNote: { type: Type.STRING, description: "توجيهات ابن سينا والطب النبوي بخصوص هذه النبتة ومزاجها" },
            references: { type: Type.STRING, description: "المراجع السريرية والتراثية المعتمدة (Stockley's, EMA, القانون لابن سينا، الطب النبوي)" },
          },
          required: ["riskLevel", "mechanism", "clinicalAdvice", "summary"],
        },
      },
    });

    const analysis = parseJsonSafely(response.text);
    res.json({ success: true, analysis });
  } catch (error: any) {
    handleGeminiError(error, res, "حدث خطأ أثناء فحص التداخل الدوائي");
  }
});

// AI: Smart Phytotherapy Remedy Advisor
app.post("/api/gemini/remedy-advisor", async (req, res) => {
  try {
    const { symptoms, userProfile } = req.body;
    if (!symptoms) {
      res.status(400).json({ error: "الأعراض أو الهدف الصحي مطلوب" });
      return;
    }

    const ai = getGenAI();
    const prompt = `استناداً إلى موسوعة "1000 عشبة" ودساتير الأعشاب الطبية العالمية الحديثة، وأمهات كتب التراث الطبي العربي والإسلامي:
1. كتاب «الطب النبوي» للإمام ابن قيم الجوزية وكتاب «الطب النبوي» للإمام الذهبي
2. كتاب «القانون في الطب» للشيخ الرئيس ابن سينا
3. كتاب «الجامع لمفردات الأدوية والأغذية» لابن البيطار
4. دساتير (WHO Monographs, German Commission E, ESCOP, EMA/HMPC, وبردية إيبرس):

ما هي أفضل الوصفات والأعشاب الطبيعية الموصى بها للحالة التالية:
الأعراض أو الهدف: "${symptoms}"
معلومات إضافية (عمر، أمراض مزمنة، حمل/إرضاع): "${userProfile || "لا يوجد"}"

قدم بروتوكولاً عشبياً مقترحاً موثقاً يجمع بين العلم الحديث وهدي التراث الطبي العربي:
1. أسماء 2 إلى 3 أعشاب رئيسية مناسبة مع ذكر أسمائها العلمية ودورها العلاجي.
2. طريقة التحضير الصيدلانية الدقيقة والجرعة اليومية الآمنة.
3. التحذيرات وموانع الاستعمال الدقيقة.
4. نصائح نمط الحياة والتغذية المصاحبة.
5. استشهاد وهدي من "كتاب الطب النبوي" أو توجيه من "كتاب القانون في الطب لابن سينا" للحالة (arabicHeritageAdvice): اذكر نصيحة أو مقولة الشيخ الرئيس ابن سينا أو ما ورد في الطب النبوي للحالة.
6. المراجع العلمية الدولية والتراثية المعتمدة المستند إليها (references).`;

    const response = await callGeminiWithResilience(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            recommendedHerbs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  herbName: { type: Type.STRING },
                  role: { type: Type.STRING },
                  doseAndUsage: { type: Type.STRING },
                },
                required: ["herbName", "role", "doseAndUsage"],
              },
            },
            preparationGuide: { type: Type.STRING },
            precautions: { type: Type.STRING },
            lifestyleTip: { type: Type.STRING },
            arabicHeritageAdvice: {
              type: Type.STRING,
              description: "توجيهات واستشهادات من كتاب الطب النبوي وكتاب القانون في الطب لابن سينا للمريض",
            },
            references: { type: Type.STRING, description: "المراجع الدولية ودساتير التراث العربي المعتمدة" },
          },
          required: ["title", "recommendedHerbs", "preparationGuide", "precautions"],
        },
      },
    });

    const advisorResult = parseJsonSafely(response.text);
    res.json({ success: true, protocol: advisorResult });
  } catch (error: any) {
    handleGeminiError(error, res, "حدث خطأ أثناء إعداد البروتوكول النباتي");
  }
});

// Cloud SQL (PostgreSQL) Status & Sync Endpoints
app.get("/api/cloudsql/status", async (_req, res) => {
  try {
    if (!process.env.SQL_HOST) {
      res.json({
        enabled: true,
        connected: false,
        instance: "ai-studio-4dac90ab",
        region: "europe-west2",
        database: "postgres",
        message: "Cloud SQL instance provisioned",
      });
      return;
    }
    const { db } = await import("./src/db/index.ts");
    const { users } = await import("./src/db/schema.ts");
    await db.select().from(users).limit(1);
    res.json({
      enabled: true,
      connected: true,
      instance: "ai-studio-4dac90ab",
      region: "europe-west2",
      database: "postgres",
    });
  } catch (err: any) {
    res.json({
      enabled: true,
      connected: false,
      instance: "ai-studio-4dac90ab",
      region: "europe-west2",
      error: err.message,
    });
  }
});

app.post("/api/cloudsql/sync", async (req, res) => {
  try {
    const { user, herbs: items } = req.body;
    if (!user || !user.uid) {
      res.status(400).json({ error: "User UID is required" });
      return;
    }
    const { getOrCreateUser, saveHerbToSql } = await import("./src/db/users.ts");
    await getOrCreateUser(user.uid, user.email, user.displayName);
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.isCustom) {
          await saveHerbToSql({
            customId: String(item.id),
            userUid: user.uid,
            nameAr: item.nameAr,
            nameEn: item.nameEn,
            scientific: item.scientific,
            family: item.family,
            system: item.system,
            target: item.target,
            active: item.active,
            dose: item.dose,
            preparation: item.preparation,
            safety: item.safety,
            safetyLevel: item.safetyLevel,
            contraindications: item.contraindications,
            interactions: item.interactions,
            historicalNote: item.historicalNote,
            references: item.references,
          });
        }
      }
    }
    res.json({ success: true, count: items?.length || 0 });
  } catch (err: any) {
    console.error("Cloud SQL Sync Error:", err);
    res.status(500).json({ error: err.message || "فشل المزامنة مع Cloud SQL" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[1000 Herbs Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
