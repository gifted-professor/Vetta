import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History,
  Sparkles,
} from 'lucide-react';

import { translations } from '../locales/translations';
import { SourcingStrategy, Candidate, AuditResult, AuditDraft } from '../types';
import { Header } from '../components/Header';
import { LogViewer } from '../components/LogViewer';
import { FilterPanel } from '../components/FilterPanel';
import { InputSection } from '../components/InputSection';
import { StrategyMatrix } from '../components/StrategyMatrix';
import { CandidateList } from '../components/CandidateList';
import { AuditReport } from '../components/AuditReport';
import { AuditReportShell } from '../components/AuditReportShell';

import { abortApifyRun, fetchApifyLimits, runApifyTask } from '../utils/apify';
import { supabase } from '../supabase.client';
import { useAuth } from '../auth';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, profileLoading, error: authError, deductCredits } = useAuth();
  const [lang, setLang] = useState<'zh' | 'en'>(() => {
    const saved = localStorage.getItem('vetta_lang');
    if (saved === 'zh' || saved === 'en') return saved;
    const nav = String(navigator.language || '').toLowerCase();
    if (nav.startsWith('zh')) return 'zh';
    if (nav.startsWith('en')) return 'en';
    return 'zh';
  });
  const t = translations[lang];
  const [mode, setMode] = useState<'discovery' | 'audit'>('discovery');
  const hasApifyToken = Boolean(process.env.VETTA_HAS_APIFY_TOKEN);
  const hasGeminiKey = Boolean(process.env.VETTA_HAS_GEMINI_KEY);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [creditsModalDetail, setCreditsModalDetail] = useState<string | null>(null);
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      navigate('/login');
    }
  };

  const openCreditsModal = () => setCreditsModalOpen(true);
  const credits = typeof profile?.credits === 'number' ? profile.credits : null;

  const deductBeforeCostlyAction = async () => {
    if (!user) {
      navigate('/login');
      return false;
    }
    if (typeof profile?.credits === 'number' && profile.credits <= 0) {
      setCreditsModalDetail(null);
      openCreditsModal();
      return false;
    }
    const res = await deductCredits();
    if (!res.ok) {
      setCreditsModalDetail(res.error || authError || null);
      openCreditsModal();
      return false;
    }
    setCreditsModalDetail(null);
    return true;
  };

  const [productImg, setProductImg] = useState<string | null>(() => localStorage.getItem('vetta_productImg') || null);
  const [productDesc, setProductDesc] = useState(() => localStorage.getItem('vetta_productDesc') || '');
  const [strategy, setStrategy] = useState<SourcingStrategy | null>(() => {
    const s = localStorage.getItem('vetta_strategy');
    return s ? JSON.parse(s) : null;
  });
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const c = localStorage.getItem('vetta_candidates');
    return c ? JSON.parse(c) : [];
  });

  const isLikelyProfileAvatarUrl = (url: any) => {
    const s = String(url || '');
    if (!s) return false;
    return /(t51\.2885-19|profile_pic|s150x150|p150x150)/i.test(s);
  };

  const candidatesRef = React.useRef<Candidate[]>([]);
  React.useEffect(() => {
    candidatesRef.current = candidates;
  }, [candidates]);
  
  // Persistence effects
  React.useEffect(() => {
    localStorage.setItem('vetta_lang', lang);
  }, [lang]);

  React.useEffect(() => {
    if (productImg) localStorage.setItem('vetta_productImg', productImg);
    else localStorage.removeItem('vetta_productImg');
  }, [productImg]);

  React.useEffect(() => {
    localStorage.setItem('vetta_productDesc', productDesc);
  }, [productDesc]);

  React.useEffect(() => {
    if (strategy) localStorage.setItem('vetta_strategy', JSON.stringify(strategy));
    else localStorage.removeItem('vetta_strategy');
  }, [strategy]);

  React.useEffect(() => {
    localStorage.setItem('vetta_candidates', JSON.stringify(candidates));
  }, [candidates]);
  
  const [minFollowers, setMinFollowers] = useState<number>(1000); 
  const [creatorOnly, setCreatorOnly] = useState<boolean>(true);
  
  const [url, setUrl] = useState('');
  const [brandProfile, setBrandProfile] = useState('');
  const [auditSeedCandidate, setAuditSeedCandidate] = useState<Candidate | null>(null);
  const [auditDraft, setAuditDraft] = useState<AuditDraft | null>(null);
  const [apifyToken, setApifyToken] = useState('');
  const [apifyQuota, setApifyQuota] = useState<{
    monthlyUsageUsd?: number;
    maxMonthlyUsageUsd?: number;
    updatedAt?: number;
    error?: string;
    loading?: boolean;
  }>({});
  const [apifySpend, setApifySpend] = useState<{
    lastRunUsd?: number;
    sessionUsd: number;
    runCount: number;
  }>({ sessionUsd: 0, runCount: 0 });
  const apifyQuotaLastFetchRef = React.useRef(0);
  
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('vetta_logs');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map((s) => String(s || '')).filter(Boolean).slice(-400) : [];
    } catch {
      return [];
    }
  });
  const [result, setResult] = useState<AuditResult | null>(null);
  const taskControllerRef = React.useRef<AbortController | null>(null);
  const activeApifyRunsRef = React.useRef(new Set<string>());
  const auditTranslateAbortRef = React.useRef<AbortController | null>(null);
  const auditTranslateInFlightRef = React.useRef<{ zh: boolean; en: boolean }>({ zh: false, en: false });
  const auditTranslateTokenRef = React.useRef<{ zh: number; en: number }>({ zh: 0, en: 0 });
  const [auditTranslateBusy, setAuditTranslateBusy] = useState<{ zh: boolean; en: boolean }>({ zh: false, en: false });

  const addLog = (msg: string) => {
    setLogs(prev => {
      const next = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
      return next.length > 400 ? next.slice(-400) : next;
    });
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('vetta_logs', JSON.stringify(logs.slice(-400)));
    } catch {
      return;
    }
  }, [logs]);

  const isAbortError = (e: any) => {
    const name = String(e?.name || '');
    const msg = String(e?.message || '');
    return name === 'AbortError' || msg === 'Aborted';
  };

  const abortableDelay = (ms: number, signal?: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        return;
      }
      const id = setTimeout(() => {
        cleanup();
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(id);
        cleanup();
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
      };
      const cleanup = () => {
        if (signal) signal.removeEventListener('abort', onAbort);
      };
      if (signal) signal.addEventListener('abort', onAbort);
    });

  const cancelCurrentTask = async () => {
    const controller = taskControllerRef.current;
    if (!controller || controller.signal.aborted) return;

    controller.abort();
    addLog(lang === 'zh' ? '已停止：将终止当前任务并阻止后续请求。' : 'Stopped: cancelling current task and preventing further requests.');

    const runIds = Array.from(activeApifyRunsRef.current.values()) as string[];
    activeApifyRunsRef.current.clear();
    await Promise.allSettled(runIds.map((runId) => abortApifyRun(runId)));
  };

  const refreshApifyQuota = React.useCallback(async (force?: boolean) => {
    if (!hasApifyToken) return;
    const now = Date.now();
    if (!force && now - apifyQuotaLastFetchRef.current < 30000) return;
    apifyQuotaLastFetchRef.current = now;

    try {
      setApifyQuota(prev => ({ ...prev, loading: true, error: undefined }));
      const limits = await fetchApifyLimits();
      if (!limits) {
        setApifyQuota(prev => ({ ...prev, loading: false, updatedAt: Date.now(), error: 'fetch_failed' }));
        return;
      }
      setApifyQuota({
        monthlyUsageUsd: limits.monthlyUsageUsd,
        maxMonthlyUsageUsd: limits.maxMonthlyUsageUsd,
        updatedAt: Date.now(),
        loading: false,
      });
    } catch (e: any) {
      setApifyQuota(prev => ({ ...prev, loading: false, updatedAt: Date.now(), error: e?.message || 'fetch_failed' }));
    }
  }, [hasApifyToken]);

  React.useEffect(() => {
    setApifySpend({ sessionUsd: 0, runCount: 0 });
    setApifyQuota({ loading: false });
    if (!hasApifyToken) return;
    const id = setTimeout(() => {
      refreshApifyQuota(true);
    }, 600);
    return () => clearTimeout(id);
  }, [hasApifyToken, refreshApifyQuota]);

  const geminiGenerateJson = async (parts: any[], signal?: AbortSignal, timeoutMs: number = 35000) => {
    if (!hasGeminiKey) throw new Error('Missing Gemini API key');

    const url = `/api/gemini/v1beta/models/gemini-3-pro-preview:generateContent`;
    try {
      const fetchPromise = (async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
          signal,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `Gemini HTTP ${response.status}`);
        }

        const data = await response.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') || '';
        if (!text) throw new Error('Empty Gemini response');
        return text;
      })();

      let timeoutId: any;
      const timeoutPromise = new Promise<string>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Gemini request timed out after ${Math.round(timeoutMs / 1000)}s`));
        }, timeoutMs);
      });

      try {
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        return result;
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    } catch (e: any) {
      throw e;
    }
  };

  const normalizeList = (arr: any[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map(s => String(s || ''))
      .map(s => s.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')) // Remove emojis only
      .map(s => s.replace(/[#@]/g, '').trim()) // Remove # and @
      .filter(s => s.length > 2)
      .slice(0, 8); // Top 8
  };

  const outputLanguageInstruction = (lang: 'zh' | 'en') => {
    const target = lang === 'zh' ? 'Simplified Chinese (简体中文)' : 'English';
    const notes =
      lang === 'zh'
        ? `- All user-facing strings MUST be in Simplified Chinese.\n- Do NOT use English unless it is a proper noun (e.g., @username, model numbers, brand names, place names).\n`
        : `- All user-facing strings MUST be in English.\n`;
    return `\nOutput language:\n- Target language: ${target}\n${notes}- Return STRICT JSON only. No Markdown, no backticks.\n- Keep JSON keys exactly as specified in the schema.\n`;
  };

  const countMatches = (s: string, re: RegExp) => {
    const m = s.match(re);
    return m ? m.length : 0;
  };

  const isMostlyEnglishText = (v: any) => {
    const s = String(v || '').trim();
    if (!s) return false;
    const cjk = countMatches(s, /[\u4E00-\u9FFF]/g);
    const latin = countMatches(s, /[A-Za-z]/g);
    return latin >= 20 && cjk === 0;
  };

  const isMostlyChineseText = (v: any) => {
    const s = String(v || '').trim();
    if (!s) return false;
    const cjk = countMatches(s, /[\u4E00-\u9FFF]/g);
    const latin = countMatches(s, /[A-Za-z]/g);
    if (cjk < 8) return false;
    return cjk >= latin * 2;
  };

  const shouldTranslateAuditToZh = (r: any) => {
    if (!r) return false;
    const singleFields = ['audit_reason', 'personalized_greeting', 'engagement_analysis', 'visual_analysis', 'niche_category'];
    if (singleFields.some((k) => isMostlyEnglishText(r?.[k]))) return true;
    if (Array.isArray(r?.risk_factors) && r.risk_factors.some((x: any) => isMostlyEnglishText(x))) return true;
    if (Array.isArray(r?.style_tags) && r.style_tags.some((x: any) => isMostlyEnglishText(x))) return true;
    return false;
  };

  const shouldTranslateAuditToEn = (r: any) => {
    if (!r) return false;
    const singleFields = ['audit_reason', 'personalized_greeting', 'engagement_analysis', 'visual_analysis', 'niche_category'];
    if (singleFields.some((k) => isMostlyChineseText(r?.[k]))) return true;
    if (Array.isArray(r?.risk_factors) && r.risk_factors.some((x: any) => isMostlyChineseText(x))) return true;
    if (Array.isArray(r?.style_tags) && r.style_tags.some((x: any) => isMostlyChineseText(x))) return true;
    return false;
  };

  const getAuditTranslationInput = (r: any) => ({
    style_tags: Array.isArray(r?.style_tags) ? r.style_tags : [],
    audit_reason: typeof r?.audit_reason === 'string' ? r.audit_reason : '',
    personalized_greeting: typeof r?.personalized_greeting === 'string' ? r.personalized_greeting : '',
    engagement_analysis: typeof r?.engagement_analysis === 'string' ? r.engagement_analysis : '',
    visual_analysis: typeof r?.visual_analysis === 'string' ? r.visual_analysis : '',
    niche_category: typeof r?.niche_category === 'string' ? r.niche_category : '',
    risk_factors: Array.isArray(r?.risk_factors) ? r.risk_factors : [],
  });

  const translateAuditFieldsToZh = async (r: any, signal: AbortSignal) => {
    const input = getAuditTranslationInput(r);
    const prompt = `Role: Professional translator.
Task: Translate the JSON values to Simplified Chinese (简体中文).
Rules:
- Keep the JSON keys and structure identical.
- Preserve proper nouns (e.g., @username, model numbers, brand names, place names) without translating them.
- Do not add or remove items. Keep arrays the same length.
- Output STRICT JSON only.

Input JSON:
${JSON.stringify(input)}`;
    const text = await geminiGenerateJson([{ text: prompt }], signal, 35000);
    return JSON.parse(text || '{}');
  };

  const translateAuditFieldsToEn = async (r: any, signal: AbortSignal) => {
    const input = getAuditTranslationInput(r);
    const prompt = `Role: Professional translator.
Task: Translate the JSON values to English.
Rules:
- Keep the JSON keys and structure identical.
- Preserve proper nouns (e.g., @username, model numbers, brand names, place names) without translating them.
- Do not add or remove items. Keep arrays the same length.
- Output STRICT JSON only.

Input JSON:
${JSON.stringify(input)}`;
    const text = await geminiGenerateJson([{ text: prompt }], signal, 35000);
    return JSON.parse(text || '{}');
  };

  const translateAuditResultToZh = async (r: any, signal: AbortSignal) => {
    const translated = await translateAuditFieldsToZh(r, signal);
    return { ...r, ...translated };
  };

  const translateAuditResultToEn = async (r: any, signal: AbortSignal) => {
    const translated = await translateAuditFieldsToEn(r, signal);
    return { ...r, ...translated };
  };

  const extractAuditLocalizedFields = (r: any) => ({
    style_tags: Array.isArray(r?.style_tags) ? r.style_tags.map((x: any) => String(x || '')).filter(Boolean) : [],
    audit_reason: typeof r?.audit_reason === 'string' ? r.audit_reason : '',
    personalized_greeting: typeof r?.personalized_greeting === 'string' ? r.personalized_greeting : '',
    engagement_analysis: typeof r?.engagement_analysis === 'string' ? r.engagement_analysis : '',
    visual_analysis: typeof r?.visual_analysis === 'string' ? r.visual_analysis : '',
    niche_category: typeof r?.niche_category === 'string' ? r.niche_category : '',
    risk_factors: Array.isArray(r?.risk_factors) ? r.risk_factors.map((x: any) => String(x || '')).filter(Boolean) : [],
  });

  React.useEffect(() => {
    if (!result) return;

    const locale = lang;
    const localized = result._localized;
    const base = localized?.base;
    const hasLocaleFields = Boolean(localized && (localized as any)[locale]);

    if (!base || !localized) {
      setResult((prev) => {
        if (!prev) return prev;
        const fields = extractAuditLocalizedFields(prev);
        return {
          ...prev,
          _localized: {
            base: locale,
            [locale]: fields,
          },
        };
      });
      return;
    }

    if (hasLocaleFields) return;

    if (base === locale) {
      setResult((prev) => {
        if (!prev) return prev;
        const fields = extractAuditLocalizedFields(prev);
        return {
          ...prev,
          _localized: {
            ...(prev._localized || {}),
            base,
            [locale]: fields,
          },
        };
      });
      return;
    }

    const needsTranslate = locale === 'zh' ? shouldTranslateAuditToZh(result) : shouldTranslateAuditToEn(result);
    if (!needsTranslate) {
      setResult((prev) => {
        if (!prev) return prev;
        const fields = extractAuditLocalizedFields(prev);
        return {
          ...prev,
          _localized: {
            ...(prev._localized || {}),
            base,
            [locale]: fields,
          },
        };
      });
      return;
    }

    if (!hasGeminiKey) return;
    if (auditTranslateInFlightRef.current[locale]) return;

    auditTranslateAbortRef.current?.abort();
    const controller = new AbortController();
    auditTranslateAbortRef.current = controller;
    auditTranslateInFlightRef.current[locale] = true;
    auditTranslateTokenRef.current[locale] += 1;
    const token = auditTranslateTokenRef.current[locale];
    setAuditTranslateBusy((prev) => ({ ...prev, [locale]: true }));

    addLog(locale === 'zh' ? '语言已切换：正在将审计结果翻译为中文...' : 'Language switched: translating audit result to English...');

    (async () => {
      try {
        const translated =
          locale === 'zh'
            ? await translateAuditFieldsToZh(result, controller.signal)
            : await translateAuditFieldsToEn(result, controller.signal);

        setResult((prev) => {
          if (!prev) return prev;
          if ((prev.profile?.username || '') !== (result.profile?.username || '')) return prev;
          return {
            ...prev,
            _localized: {
              ...(prev._localized || {}),
              base,
              [locale]: {
                ...extractAuditLocalizedFields(prev),
                ...translated,
              },
            },
          };
        });
      } catch (e: any) {
        if (!controller.signal.aborted && !isAbortError(e)) {
          addLog(locale === 'zh' ? `翻译失败：${e?.message || 'unknown error'}` : `Translation failed: ${e?.message || 'unknown error'}`);
        }
      } finally {
        auditTranslateInFlightRef.current[locale] = false;
        if (auditTranslateTokenRef.current[locale] === token) {
          setAuditTranslateBusy((prev) => ({ ...prev, [locale]: false }));
        }
      }
    })();
  }, [lang, result, hasGeminiKey]);

  const validateStrategyJson = (json: any) => {
    const core = normalizeList(json?.core_tags || []);
    const lifestyle = normalizeList(json?.lifestyle_tags || []);
    const actions = normalizeList(json?.visual_actions || []);
    const aesthetic = normalizeList(json?.aesthetic_keywords || []);
    const queries = normalizeList(json?.search_queries || []);

    const bad =
      core.length < 4 ||
      lifestyle.length < 6 ||
      actions.length < 6 ||
      aesthetic.length < 6 ||
      queries.length < 8;

    return {
      ok: !bad,
      strategy: {
        core_tags: core,
        lifestyle_tags: lifestyle,
        visual_actions: actions,
        aesthetic_keywords: aesthetic,
        search_queries: queries,
      },
    };
  };

  const analyzeProduct = async () => {
    if (!productImg) return;
    setLoading(true);
    setStrategy(null);
    setCandidates([]);
    addLog("Applying 4:4:2 Scene-Based Logic via Gemini...");
    const controller = new AbortController();
    taskControllerRef.current = controller;
    activeApifyRunsRef.current.clear();
    
    try {
      const b64Parts = productImg.split(',');
      const b64Data = b64Parts.length > 1 ? b64Parts[1] : b64Parts[0];

      const baseParts = [
        { inlineData: { data: b64Data, mimeType: "image/jpeg" } },
        {
          text: `Role: Senior Instagram Strategist & Aesthetics Curator.
Input: product image + optional description.
Description: ${productDesc || "(none)"}

Task: Generate a 4:4:2 sourcing matrix to find high-end LIFESTYLE creators (NOT sellers/shops).

### Strategy & Constraints:
1. **visual_actions (40%) - The Scene**:
   - Focus on "Lifestyle Moments" and "Visual Context".
   - MUST be purely aesthetic/routine based (e.g., "Morning Ritual", "Vanity Organization", "Texture Shot").
   - ⚠️ STRICTLY FORBIDDEN: Transactional verbs (Buy, Order, Shop, Sale, Deal).

2. **lifestyle_tags (40%) - Aesthetic DNA**:
   - Focus on VISUAL STYLE, COLOR, and VIBE.
   - Include color/texture keywords matching the product (e.g., #goldaesthetic, #minimalistchic, #glossyfeed).
   - Avoid generic tags like #love or #happy. Use niche tags like #vanitydetails, #skincaretexture, #slowliving.

3. **core_tags (20%) - Creative Identity**:
   - ⚠️ CRITICAL: STRICTLY FORBIDDEN to use Product Names or Brand Names.
   - MUST be a PERSONA found in a Bio (e.g., "Beauty Editor", "Visual Curator", "Aesthete", "Content Creator").
   - EXCLUDE: "Seller", "Shop", "Store", "Wholesaler".

4. **search_queries**:
     - Generate 12 "Username-like" search terms.
     - MUST look like Instagram handles (no spaces, use . or _).
     - Examples: "luxury.vanity", "gold_decor_daily", "skincare.routines", "minimalist_home".
     - AVOID long sentences.
  
  Rules:
- - All strings MUST be English only (ASCII).
- - ⚠️ ABSOLUTE BAN on Commercial/Seller terms: daigou, seller, shop, store, discount, order, price, shipping, wholesale, agent.
- - Output STRICT JSON only.

Output JSON schema:
{
  "core_tags": string[] (>= 6),
  "lifestyle_tags": string[] (>= 10),
  "visual_actions": string[] (>= 10),
  "aesthetic_keywords": string[] (>= 10),
  "search_queries": string[] (>= 12)
}
`,
        },
      ];

      const attempt = async (extraInstruction?: string) => {
        const parts = extraInstruction ? [...baseParts, { text: extraInstruction }] : baseParts;
        const text = await geminiGenerateJson(parts, controller.signal, 60000);
        const json = JSON.parse(text || '{}');
        return { text, json };
      };

      let { json } = await attempt();
      let validated = validateStrategyJson(json);
      if (!validated.ok) {
        addLog('Matrix quality low. Regenerating with stricter constraints...');
        ({ json } = await attempt(`Your previous JSON was low quality or violated rules.
Fix it by regenerating a brand new JSON that satisfies ALL rules and minimum counts.
Return JSON only.`));
        validated = validateStrategyJson(json);
      }

      setStrategy(validated.strategy);
      addLog("Matrix Ready. Parallel Scenarios Capturing Engine Initialized.");
    } catch (err: any) {
      if (controller.signal.aborted || isAbortError(err)) {
        addLog(lang === 'zh' ? '已停止：产品解析已取消。' : 'Stopped: product analysis cancelled.');
        return;
      }
      addLog("Analysis Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startSourcing = async () => {
    if (!hasApifyToken) {
      addLog("Error: Missing Apify token (server env).");
      return;
    }
    
    setLoading(true);
    addLog(`Launching Parallel Sourcing (Concurrent Mode)...`);
    const controller = new AbortController();
    taskControllerRef.current = controller;
    activeApifyRunsRef.current.clear();
    
    try {
      const uniqueMap = new Map();
      let totalSuppressed = 0;
      let suppressedCommercial = 0;
      let suppressedOffTopic = 0;
      let lastPublishedSize = 0;
      let hardLimitReached = false;
      const avatarEnriched = new Set<string>();
      const avatarEnrichInFlight = new Set<string>();
      const avatarEnrichAttempts = new Map<string, number>();
      let avatarEnrichLastAt = 0;

      const commercialBlacklist = [
        'daigou', 'price', 'wholesale', 'reseller', 'seller', 'sale', 'shop', 'store', 
        'factory', 'deals', 'global', 'shipping', 'order', 'original', 'discount', 
        'agent', 'proxy', 'personalshopper', 'mall', 'outlet', 'service'
      ];

      const stopwords = new Set([
        'a', 'an', 'the', 'and', 'or', 'to', 'for', 'of', 'with', 'in', 'on', 'at', 'by', 'from', 'as', 'is', 'are',
        'be', 'this', 'that', 'these', 'those', 'your', 'my', 'our', 'their', 'it', 'its',
      ]);

      const normalizeText = (v: any) => String(v || '').toLowerCase().trim();
      const sanitizeUrl = (v: any): string | null => {
        if (!v) return null;
        let s = String(v).trim();
        s = s.replace(/^['"`]+|['"`]+$/g, '').trim();
        if (!/^https?:\/\//i.test(s)) return null;
        return s;
      };
      const toFiniteNumber = (v: any): number | undefined => {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string') {
          const n = Number(v);
          if (Number.isFinite(n)) return n;
        }
        return undefined;
      };

      const tokenizeQuery = (q: string) => {
        const raw = normalizeText(q).replace(/^[@#]/, '');
        if (!raw) return [];
        return raw
          .split(/[\s/_-]+/g)
          .map((t) => t.trim())
          .filter((t) => t.length >= 3 && !stopwords.has(t));
      };

      const extractCaption = (item: any) =>
        normalizeText(
          item?.caption ||
            item?.text ||
            item?.description ||
            item?.edge_media_to_caption?.edges?.[0]?.node?.text ||
            item?.node?.edge_media_to_caption?.edges?.[0]?.node?.text ||
            ''
        );

      const extractHashtags = (item: any) => {
        const tags = item?.hashtags || item?.hashTags || item?.tags || item?.tagList;
        if (Array.isArray(tags)) return normalizeText(tags.join(' '));
        if (typeof tags === 'string') return normalizeText(tags);
        return '';
      };

      const extractUsernameRaw = (item: any) => {
        return (
          item?.owner?.username ||
          item?.node?.owner?.username ||
          item?.user?.username ||
          item?.ownerUsername ||
          item?.authorUsername ||
          item?.userName ||
          item?.username ||
          item?.handle ||
          ''
        );
      };

      const ingestResults = (raw: any[], matchReason: string) => {
        if (!raw || raw.length === 0) return;

        // Debug: Log first item keys to understand Apify response structure
        const first = raw[0];
        addLog(`Debug: Raw batch size: ${raw.length}. First item keys: ${Object.keys(first || {}).join(', ')}`);
        if (first?.user) addLog(`Debug: item.user keys: ${Object.keys(first.user).join(', ')}`);
        if (first?.owner) addLog(`Debug: item.owner keys: ${Object.keys(first.owner).join(', ')}`);

        let addedCount = 0;
        let batchFiltered = 0;

        raw.forEach((item: any) => {
          if (item?.error || item?.errorDescription) return;

          // 1. 基础信息提取 - Enhanced Compatibility
          const usernameRaw = extractUsernameRaw(item);
          const username = String(usernameRaw).toLowerCase().trim();
          
          if (!username || username.length < 2) return;

          if (uniqueMap.has(username)) return;

          const userObj = item.owner || item.user || item.node?.owner || item;
          const bio = String(userObj.biography || userObj.bio || item.biography || item.bio || '').toLowerCase();
          const isCommercial = commercialBlacklist.some((kw) => username.includes(kw) || bio.includes(kw));

          const displayNameRaw =
            userObj.fullName || userObj.full_name || item.fullName || item.full_name || '';
          const displayName = String(displayNameRaw || username);

          const caption = extractCaption(item);
          const hashtags = extractHashtags(item);
          const contextText = [username, displayName, bio, caption, hashtags].filter(Boolean).join(' ').toLowerCase();
          
          const fCountRaw =
            userObj.followerCount ||
            userObj.followersCount ||
            userObj.follower_count ||
            userObj.edge_followed_by?.count ||
            item.followerCount ||
            item.followersCount ||
            item.follower_count ||
            item.followers ||
            item.followersCount ||
            item.followers_count ||
            0;
          const fCount = toFiniteNumber(fCountRaw) ?? 0;

          // Scoring System V2 (Adaptive)
          let score = 80;
          let reasons: string[] = [];

          if (fCount > 0 && fCount < minFollowers) {
            score -= 20;
            reasons.push(`LowFollowers(${fCount})`);
          }
          if (fCount === 0) {
            score -= 10;
            reasons.push(`NoData`);
          }
          if (isCommercial) {
            score -= 30;
            reasons.push(`Commercial`);
          }
          
          const aestheticHit = Boolean(
            strategy?.aesthetic_keywords.some((kw) => contextText.includes(String(kw || '').toLowerCase()))
          );
          if (aestheticHit) {
            score += 15;
            reasons.push('Aesthetic');
          }
          const tagHit = Boolean(
            strategy?.core_tags.some((kw) => contextText.includes(String(kw || '').toLowerCase()))
          );
          if (tagHit) {
            score += 10;
            reasons.push('TagMatch');
          }

          const reasonTokens = tokenizeQuery(matchReason);
          const queryHit = reasonTokens.length > 0 && reasonTokens.some((tok) => contextText.includes(tok));

          if (!queryHit && !aestheticHit && !tagHit) {
            score -= 35;
            reasons.push('OffTopic');
          }

          if (creatorOnly && isCommercial && score < 50) {
            totalSuppressed++;
            suppressedCommercial++;
            batchFiltered++;
            return;
          }

          if (creatorOnly && reasons.includes('OffTopic') && score < 60) {
            totalSuppressed++;
            suppressedOffTopic++;
            batchFiltered++;
            return;
          }

          const avatarUrl = sanitizeUrl(
            userObj.profile_pic_url ||
              userObj.profilePicUrl ||
              userObj.profile_pic_url_hd ||
              item.profile_pic_url ||
              item.profilePicUrl ||
              item.profile_pic_url_hd ||
              item.ownerProfilePicUrl ||
              item.owner_profile_pic_url
          );

          const verified = !!(userObj.isVerified || userObj.is_verified || item.isVerified || item.is_verified);

          uniqueMap.set(username, {
            username,
            followers: fCount,
            displayName,
            verified,
            match_reason: matchReason,
            avatarUrl,
            match_score: Math.min(Math.max(score, 10), 99),
            is_commercial: isCommercial,
            match_signals: reasons,
            bio,
            sample_captions: caption ? [caption] : [],
          });
          addedCount++;
        });
        
        addLog(`Ingest: ${addedCount} added, ${batchFiltered} filtered from batch.`);
      };

      const gradients = ["from-indigo-500 to-purple-600", "from-pink-500 to-rose-500", "from-emerald-400 to-cyan-500", "from-amber-400 to-orange-500"];

      const enrichCandidateAvatars = async (list: any[]) => {
        const now = Date.now();
        if (now - avatarEnrichLastAt < 8000) return;
        avatarEnrichLastAt = now;
        const needsProfilePic = (u: any) => !isLikelyProfileAvatarUrl(u?.avatar_url);
        const targets = list
          .slice(0, 18)
          .filter((c) => c?.id && needsProfilePic(c))
          .filter((c) => {
            const key = String(c.id || '').toLowerCase().trim();
            const n = avatarEnrichAttempts.get(key) || 0;
            return n < 2;
          })
          .filter((c) => !avatarEnriched.has(c.id) && !avatarEnrichInFlight.has(c.id));
        if (targets.length === 0) return;
        if (controller.signal.aborted) return;

        addLog(`Avatar Enrichment: probing ${targets.length} profiles for profile pictures...`);
        const BATCH = 6;
        const take = targets.slice(0, BATCH * 2);
        for (let i = 0; i < take.length; i += BATCH) {
          if (controller.signal.aborted) return;
          const batch = take.slice(i, i + BATCH);
          batch.forEach((c) => {
            avatarEnrichInFlight.add(c.id);
            const key = String(c.id || '').toLowerCase().trim();
            avatarEnrichAttempts.set(key, (avatarEnrichAttempts.get(key) || 0) + 1);
          });

          try {
            await abortableDelay(Math.random() * 400, controller.signal);
            const directUrls = batch.map((c) => `https://www.instagram.com/${c.id}/`);
            const details = await runApifyTask(
              'apify~instagram-scraper',
              { directUrls, resultsType: 'details', resultsLimit: directUrls.length },
              addLog,
              (info) => {
                const usd = typeof info.usageTotalUsd === 'number' ? info.usageTotalUsd : info.usageUsd;
                if (typeof usd === 'number') {
                  setApifySpend((prev) => ({
                    lastRunUsd: usd,
                    sessionUsd: prev.sessionUsd + usd,
                    runCount: prev.runCount + 1,
                  }));
                  refreshApifyQuota(false);
                }
              },
              { signal: controller.signal, onRunStarted: (runId) => activeApifyRunsRef.current.add(runId) }
            );

            const picByUsername = new Map<string, string>();
            (Array.isArray(details) ? details : []).forEach((d: any) => {
              const uname = String(d?.username || d?.userName || d?.handle || '').toLowerCase().trim();
              const pic = sanitizeUrl(
                d?.profilePicUrlHD || d?.profilePicUrl || d?.profile_pic_url_hd || d?.profile_pic_url
              );
              if (uname && pic) picByUsername.set(uname, pic);
            });

            if (picByUsername.size > 0) {
              picByUsername.forEach((pic, uname) => {
                const cur = uniqueMap.get(uname);
                if (cur) cur.avatarUrl = pic;
              });
              setCandidates((prev) =>
                prev.map((x) => {
                  const uname = String(x?.id || '').toLowerCase().trim();
                  const pic = picByUsername.get(uname);
                  return pic ? { ...x, avatar_url: pic } : x;
                })
              );
            }

            batch.forEach((c) => {
              const uname = String(c?.id || '').toLowerCase().trim();
              if (picByUsername.has(uname)) avatarEnriched.add(c.id);
            });
          } catch (e: any) {
            if (!controller.signal.aborted && !isAbortError(e)) addLog(`Avatar Enrichment failed: ${e?.message || 'unknown error'}`);
          } finally {
            batch.forEach((c) => avatarEnrichInFlight.delete(c.id));
          }
        }
      };

      const publishCandidates = () => {
        const prevById: Map<string, Candidate> = new Map(
          (candidatesRef.current || [])
            .map((c) => [String(c?.id || '').toLowerCase().trim(), c] as [string, Candidate])
            .filter((x) => x[0].length > 0)
        );
        const mapped = Array.from(uniqueMap.values()).map((u: any, idx: number) => {
          const uname = String(u.username || '').toLowerCase().trim();
          const prev = uname ? prevById.get(uname) : undefined;
          return {
            id: u.username,
            url: `https://www.instagram.com/${u.username}/`,
            match_score: u.match_score,
            niche: u.displayName,
            followers: u.followers,
            avatar_url: u.avatarUrl || prev?.avatar_url,
            avatar_color: `bg-gradient-to-br ${gradients[idx % gradients.length]}`,
            is_verified: u.verified,
            match_reason: u.match_reason,
            is_commercial: u.is_commercial,
            match_signals: u.match_signals,
            ai_account_type: u.ai_account_type,
            ai_is_creator_account: u.ai_is_creator_account,
            ai_confidence: u.ai_confidence,
            aesthetic_match_score: u.aesthetic_match_score,
            ai_reasons: u.ai_reasons,
            ai_business_signals: u.ai_business_signals,
            ai_creator_signals: u.ai_creator_signals,
            ai_mismatch_reason: u.ai_mismatch_reason,
            ai_summary: u.ai_summary,
          };
        });
        mapped.sort((a, b) => b.match_score - a.match_score);
        setCandidates(mapped);
        void enrichCandidateAvatars(mapped);
      };

      const businessHintTokens = [
        'menu',
        'reservation',
        'book',
        'booking',
        'address',
        'hours',
        'open',
        'whatsapp',
        'order',
        'delivery',
        'happy hour',
        'dm to order',
      ];
      const looksLikeBusinessText = (txt: string) => {
        const s = String(txt || '').toLowerCase();
        return businessHintTokens.some((kw) => s.includes(kw));
      };

      const GEMINI_MAX = 8;
      const geminiInFlight = new Set<string>();
      let geminiAuditCount = 0;

      const buildAiSummary = (lang: 'zh' | 'en', r: any) => {
        const score = typeof r?.aesthetic_match_score === 'number' ? Math.round(r.aesthetic_match_score) : undefined;
        const conf = typeof r?.confidence === 'number' ? Math.round(r.confidence * 100) : undefined;
        const acct = String(r?.account_type || 'other');
        const biz = Array.isArray(r?.evidence?.business_signals) ? r.evidence.business_signals[0] : '';
        if (lang === 'zh') {
          const parts = [
            typeof score === 'number' ? `审美匹配度 ${score}%` : '',
            conf ? `置信度 ${conf}%` : '',
            acct ? `类型 ${acct}` : '',
            biz ? `证据：${biz}` : '',
          ].filter(Boolean);
          return parts.join('，');
        }
        const parts = [
          typeof score === 'number' ? `Aesthetic ${score}%` : '',
          conf ? `Conf ${conf}%` : '',
          acct ? `Type ${acct}` : '',
          biz ? `Evidence: ${biz}` : '',
        ].filter(Boolean);
        return parts.join(' • ');
      };

      const shouldGeminiAudit = (u: any) => {
        if (!hasGeminiKey) return false;
        if (!u?.username) return false;
        if (u.ai_confidence != null || u.ai_summary) return false;
        if (geminiAuditCount >= GEMINI_MAX) return false;
        if (geminiInFlight.has(u.username)) return false;
        if (typeof u.match_score === 'number' && u.match_score < 65) return false;
        const sample = [u.username, u.displayName, u.bio, ...(u.sample_captions || [])].filter(Boolean).join('\n');
        return Boolean(u.is_commercial) || looksLikeBusinessText(sample) || !u.bio;
      };

      const runGeminiAudit = async (u: any) => {
        const aestheticKeywords = (strategy?.aesthetic_keywords || []).slice(0, 10);
        const captions = Array.isArray(u.sample_captions) ? u.sample_captions.slice(0, 3) : [];
        const prompt = `
Role: Semantic reviewer for Instagram discovery (grey-zone audit).
Goal: Decide whether this account is a creator or a local business (restaurant/shop/brand), and how strong the aesthetic match is.

Decision weights:
- Business signals: 50% (menu, reservation link, address, opening hours, WhatsApp order, delivery)
- Creator persona signals: 30% (first-person reviews like \"I went...\", tutorials, creator voice)
- Aesthetic match: 20% (match to provided aesthetic keywords)

Input:
- match_reason: ${String(u.match_reason || '')}
- aesthetic_keywords: ${JSON.stringify(aestheticKeywords)}
- username: @${String(u.username || '')}
- display_name: ${String(u.displayName || '')}
- bio: ${String(u.bio || '')}
- recent_captions: ${JSON.stringify(captions)}

Output STRICT JSON only with this schema:
{
  \"account_type\": \"creator\" | \"restaurant\" | \"shop\" | \"brand\" | \"other\",
  \"is_creator_account\": boolean,
  \"confidence\": number,
  \"aesthetic_match_score\": number,
  \"reasons\": string[],
  \"evidence\": {
    \"business_signals\": string[],
    \"creator_signals\": string[],
    \"mismatch_reason\": string
  }
}
${outputLanguageInstruction(lang)}`;
        const text = await geminiGenerateJson([{ text: prompt }], controller.signal, 35000);
        return JSON.parse(text || '{}');
      };

      const pumpGeminiAudits = async () => {
        if (!hasGeminiKey) return;
        if (geminiAuditCount >= GEMINI_MAX) return;
        if (geminiInFlight.size >= 1) return;
        if (controller.signal.aborted) return;

        const next = Array.from(uniqueMap.values())
          .sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0))
          .find((u: any) => shouldGeminiAudit(u));
        if (!next) return;

        const uname = String(next.username);
        geminiInFlight.add(uname);
        geminiAuditCount++;
        addLog(`AI audit: reviewing @${uname} (${geminiAuditCount}/${GEMINI_MAX})...`);
        try {
          const ai = await runGeminiAudit(next);
          const acct = String(ai?.account_type || 'other').toLowerCase();
          const patched = {
            ...next,
            ai_account_type: acct,
            ai_is_creator_account: Boolean(ai?.is_creator_account),
            ai_confidence: typeof ai?.confidence === 'number' ? ai.confidence : undefined,
            aesthetic_match_score: typeof ai?.aesthetic_match_score === 'number' ? ai.aesthetic_match_score : undefined,
            ai_reasons: Array.isArray(ai?.reasons) ? ai.reasons.map((s: any) => String(s || '')).filter(Boolean).slice(0, 3) : undefined,
            ai_business_signals: Array.isArray(ai?.evidence?.business_signals) ? ai.evidence.business_signals.map((s: any) => String(s || '')).filter(Boolean).slice(0, 3) : undefined,
            ai_creator_signals: Array.isArray(ai?.evidence?.creator_signals) ? ai.evidence.creator_signals.map((s: any) => String(s || '')).filter(Boolean).slice(0, 3) : undefined,
            ai_mismatch_reason: typeof ai?.evidence?.mismatch_reason === 'string' ? ai.evidence.mismatch_reason : undefined,
            ai_summary: buildAiSummary(lang, ai),
          };
          uniqueMap.set(uname, patched);
          publishCandidates();
          addLog(`AI audit: @${uname} -> ${acct} (conf=${typeof patched.ai_confidence === 'number' ? patched.ai_confidence.toFixed(2) : 'n/a'}).`);
        } catch (e: any) {
          if (!controller.signal.aborted && !isAbortError(e)) addLog(`AI audit failed: ${e?.message || 'unknown error'}`);
        } finally {
          geminiInFlight.delete(uname);
          if (!controller.signal.aborted) void pumpGeminiAudits();
        }
      };

      const cleanQuery = (s: string) => s.replace(/^#/, '').trim();
      const isHardLimit = (msg: string) => {
        const m = (msg || '').toLowerCase();
        return m.includes('monthly usage hard limit') || m.includes('platform-feature-disabled') || m.includes('hard limit');
      };

      const targetCount = 5;
      const maxRounds = 8;
      addLog(`Adaptive sourcing: probe 3 dimensions per round until ${targetCount}+ (max ${maxRounds} rounds).`);
      
      const { core_tags, lifestyle_tags, visual_actions, search_queries } = strategy!;
      const actionPool = (visual_actions || []).map((q) => cleanQuery(String(q || ''))).filter(Boolean);
      const aestheticPool = (lifestyle_tags || []).map((q) => cleanQuery(String(q || ''))).filter(Boolean);
      const identityPool = (core_tags || []).map((q) => cleanQuery(String(q || ''))).filter(Boolean);
      const fallbackPool = [
        ...(search_queries || []),
        ...(strategy?.aesthetic_keywords || []),
        ...(core_tags || []),
        ...(lifestyle_tags || []),
        ...(visual_actions || []),
      ]
        .map((q) => cleanQuery(String(q || '')))
        .filter((q) => q.length > 0);

      addLog(`Query pools: action=${actionPool.length}, aesthetic=${aestheticPool.length}, identity=${identityPool.length}, fallback=${fallbackPool.length}`);

      const tried = new Set<string>();
      const actionIdx = { v: 0 };
      const aestheticIdx = { v: 0 };
      const identityIdx = { v: 0 };
      const fallbackIdx = { v: 0 };

      const nextFrom = (pool: string[], idxRef: { v: number }) => {
        while (idxRef.v < pool.length) {
          const q = pool[idxRef.v++];
          if (!q) continue;
          const key = q.toLowerCase();
          if (tried.has(key)) continue;
          tried.add(key);
          return q;
        }
        return null;
      };

      type Slot = 'A' | 'S' | 'I';
      const refillSlots = (): Slot[] => {
        const slots: Slot[] = ['A', 'A', 'A', 'A', 'S', 'S', 'S', 'S', 'I', 'I'];
        for (let i = slots.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [slots[i], slots[j]] = [slots[j], slots[i]];
        }
        return slots;
      };
      let slotQueue: Slot[] = refillSlots();
      const pullSlot = (): Slot => {
        if (slotQueue.length === 0) slotQueue = refillSlots();
        return slotQueue.shift() as Slot;
      };

      roundLoop: for (let round = 1; round <= maxRounds && uniqueMap.size < targetCount && !controller.signal.aborted; round++) {
        const roundSlots: Slot[] = [pullSlot(), pullSlot(), pullSlot()];
        const tasks: Array<{ q: string; label: string; reason: string; type: string; degraded?: boolean }> = [];

        const pickFromSlot = (slot: Slot) => {
          if (slot === 'A') return nextFrom(actionPool, actionIdx);
          if (slot === 'S') return nextFrom(aestheticPool, aestheticIdx);
          return nextFrom(identityPool, identityIdx);
        };

        const slotLabel = (slot: Slot) => {
          if (slot === 'A') return 'Action-Scene';
          if (slot === 'S') return 'Aesthetic DNA';
          return 'Creative Identity';
        };

        const slotType = (slot: Slot) => {
          if (slot === 'I') return 'user';
          return 'hashtag';
        };

        roundSlots.forEach((slot) => {
          let q = pickFromSlot(slot);
          let degraded = false;
          if (!q) {
            q = nextFrom(fallbackPool, fallbackIdx);
            degraded = Boolean(q);
          }
          if (!q) return;
          tasks.push({ q, label: slotLabel(slot), reason: q, type: slotType(slot), degraded });
        });

        if (tasks.length === 0) break;

        addLog(`Round ${round}/${maxRounds}: probing ${tasks.length} dimensions (4:4:2 scheduler).`);
        if (tasks.some(t => t.degraded)) addLog(`Scheduler degraded: some pools exhausted, filled by fallback.`);

        // Streaming execution with Concurrency Control (Max 2 parallel tasks) to avoid ERR_ABORTED
        const CONCURRENCY = 2;
        for (let i = 0; i < tasks.length; i += CONCURRENCY) {
            if (hardLimitReached || controller.signal.aborted) break roundLoop;
            const chunk = tasks.slice(i, i + CONCURRENCY);
            await Promise.all(chunk.map(async (t) => {
                if (hardLimitReached || controller.signal.aborted) return;
                // Add jitter
                await abortableDelay(Math.random() * 1000, controller.signal);
                
                const rawQuery = String(t.q || '').trim().replace(/^[@#]/, '');
                const compactQuery = rawQuery.replace(/\s+/g, '');
                const hashtag = compactQuery.replace(/^#/, '');
                const isHashtag = t.type === 'hashtag';

                try {
                  const onRunFinished = (info: any) => {
                    const usd = typeof info.usageTotalUsd === 'number' ? info.usageTotalUsd : info.usageUsd;
                    if (typeof usd === 'number') {
                      setApifySpend(prev => ({
                        lastRunUsd: usd,
                        sessionUsd: prev.sessionUsd + usd,
                        runCount: prev.runCount + 1,
                      }));
                      addLog(`Apify cost: $${usd.toFixed(4)} (${info.runId})`);
                      refreshApifyQuota(false);
                    }
                  };

                  let results: any[] = [];

                  if (isHashtag) {
                    let resolvedTag = hashtag;
                    if (rawQuery !== compactQuery) {
                      const tagHints = await runApifyTask(
                        'apify~instagram-search-scraper',
                        {
                          search: rawQuery,
                          searchType: 'hashtag',
                          searchLimit: 5,
                          proxy: { useApifyProxy: true },
                        },
                        addLog,
                        onRunFinished,
                        {
                          signal: controller.signal,
                          onRunStarted: (runId) => activeApifyRunsRef.current.add(runId),
                        }
                      );
                      const best =
                        (Array.isArray(tagHints) ? tagHints : [])
                          .map((it: any) => String(it?.name || it?.searchTerm || it?.search || '').trim())
                          .map((s: string) => s.replace(/^#/, '').replace(/\s+/g, '').toLowerCase())
                          .find((s: string) => s.length > 1) || '';
                      if (best) resolvedTag = best;
                    }

                    results = await runApifyTask(
                      'apify~instagram-scraper',
                      {
                        directUrls: [`https://www.instagram.com/explore/tags/${resolvedTag}/`],
                        resultsType: 'posts',
                        resultsLimit: 12,
                      },
                      addLog,
                      onRunFinished,
                      {
                        signal: controller.signal,
                        onRunStarted: (runId) => activeApifyRunsRef.current.add(runId),
                      }
                    );
                  } else {
                    results = await runApifyTask(
                      'apify~instagram-search-scraper',
                      {
                        search: rawQuery,
                        searchType: t.type === 'top' ? 'user' : t.type,
                        searchLimit: 10,
                        proxy: { useApifyProxy: true },
                      },
                      addLog,
                      onRunFinished,
                      {
                        signal: controller.signal,
                        onRunStarted: (runId) => activeApifyRunsRef.current.add(runId),
                      }
                    );
                  }
                  
                  addLog(`Dimension [${t.label}] "${t.q}" -> ${results.length} results.`);
                  ingestResults(results, t.reason);
                  void pumpGeminiAudits();

                  // Update UI
                  if (uniqueMap.size > lastPublishedSize) {
                    lastPublishedSize = uniqueMap.size;
                    publishCandidates();
                  }

                } catch (err: any) {
                  if (controller.signal.aborted || isAbortError(err)) return;
                  addLog(`Dimension probe failed: ${err.message}`);
                  if (isHardLimit(String(err?.message || ''))) {
                    hardLimitReached = true;
                    addLog(`Apify hard limit reached. Stop further probing and keep current results (${uniqueMap.size}).`);
                  }
                }
            }));
        }

        addLog(`Round ${round} finished. Current candidate pool: ${uniqueMap.size}/${targetCount}.`);
        
        // Cooldown between rounds
        if (uniqueMap.size < targetCount) {
             await abortableDelay(1500, controller.signal);
        }
      }

      const finalCount = uniqueMap.size;
      if (finalCount > 0) publishCandidates();
      addLog(`Capture finished. ${finalCount} high-aesthetic creators verified.`);
      if (totalSuppressed > 0) {
        const parts: string[] = [];
        if (suppressedCommercial > 0) parts.push(`${suppressedCommercial} commercial`);
        if (suppressedOffTopic > 0) parts.push(`${suppressedOffTopic} off-topic`);
        addLog(`Suppressed: ${totalSuppressed} (${parts.join(', ') || 'filtered'}).`);
      }

    } catch (err: any) {
      if (controller.signal.aborted || isAbortError(err)) {
        addLog(lang === 'zh' ? '已停止：已取消拓圈任务。' : 'Stopped: sourcing cancelled.');
        return;
      }
      addLog("Sourcing Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startSourcingGated = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (typeof credits === 'number' && credits <= 0) {
      openCreditsModal();
      return;
    }
    if (loading) return;
    const ok = await deductBeforeCostlyAction();
    if (!ok) return;
    await startSourcing();
  };

  const triggerDeepAudit = (candidate: Candidate) => {
    setUrl(candidate.url);
    setBrandProfile(productDesc || strategy?.core_tags.join(', ') || "Niche Influencer");
    setAuditSeedCandidate(candidate);
    setAuditDraft(null);
    setResult(null);
    setMode('audit');
    addLog(`Penetrating: @${candidate.id}`);
  };

  const runAudit = async () => {
    setLoading(true);
    setResult(null);
    addLog(`Performing Deep Audit on Target: ${url}`);
    const controller = new AbortController();
    taskControllerRef.current = controller;
    activeApifyRunsRef.current.clear();

    // Extract username from URL
    let targetUsername = url.replace(/\/$/, '').split('/').pop() || url;
    if (targetUsername.includes('?')) targetUsername = targetUsername.split('?')[0];
    
    if (!targetUsername) {
       addLog("Error: Invalid URL or Username");
       setLoading(false);
       return;
    }

    const prefillUsername = auditSeedCandidate?.id || targetUsername;
    setAuditDraft({
      profile: {
        username: prefillUsername,
        followers: typeof auditSeedCandidate?.followers === 'number' ? auditSeedCandidate.followers : undefined,
        avatar_url: auditSeedCandidate?.avatar_url,
        verified: auditSeedCandidate?.is_verified,
      },
    });
    
    try {
      const apifyRunUsdById = new Map<string, number>();
      const onApifyRunFinished = (info: { actorId: string; runId: string; datasetId?: string; usageTotalUsd?: number; usageUsd?: number }) => {
        const usd = typeof info.usageTotalUsd === 'number' ? info.usageTotalUsd : info.usageUsd;
        if (info?.runId) apifyRunUsdById.set(info.runId, typeof usd === 'number' ? usd : 0);
        if (typeof usd === 'number') {
          setApifySpend(prev => ({
            lastRunUsd: usd,
            sessionUsd: prev.sessionUsd + usd,
            runCount: prev.runCount + 1,
          }));
          addLog(`Apify cost: $${usd.toFixed(4)} (${info.runId})`);
          refreshApifyQuota(false);
        }
      };

      const actorId = 'apify~instagram-scraper';
      const profileUrl = `https://www.instagram.com/${targetUsername}/`;

      addLog('Fetching profile details...');
      const detailsResults = await runApifyTask(
        actorId,
        { directUrls: [profileUrl], resultsType: 'details', resultsLimit: 1 },
        addLog,
        onApifyRunFinished,
        {
          signal: controller.signal,
          onRunStarted: (runId) => activeApifyRunsRef.current.add(runId),
        }
      );

      const detailsFirst = Array.isArray(detailsResults) ? detailsResults[0] : null;
      if (detailsFirst && (detailsFirst.error || detailsFirst.errorDescription)) {
        addLog(`Apify Error: ${detailsFirst.error} - ${detailsFirst.errorDescription}`);
      }

      const profile = detailsFirst || {};
      const resolvedUsername = profile.username || targetUsername;
      const resolvedFollowers = profile.followersCount || profile.followers_count;
      const resolvedFollows = profile.followsCount || profile.follows_count;
      const resolvedPostsCount = profile.postsCount || profile.posts_count;
      const resolvedAvatarUrl = profile.profilePicUrlHD || profile.profilePicUrl;
      const postsFromDetails = Array.isArray(profile?.latestPosts)
        ? profile.latestPosts.map((item: any) => ({
            caption: item.caption || item.text || '',
            url: item.url || item.postUrl || '',
            likesCount: item.likesCount || item.likes_count || 0,
            commentsCount: item.commentsCount || item.comments_count || 0,
            imageUrl: item.displayUrl || item.display_url || item.imageUrl || item.image_url,
          }))
        : [];

      setAuditDraft((prev) => ({
        ...prev,
        profile: {
          ...(prev?.profile || {}),
          username: resolvedUsername,
          followers: typeof resolvedFollowers === 'number' ? resolvedFollowers : prev?.profile?.followers,
          follows: typeof resolvedFollows === 'number' ? resolvedFollows : prev?.profile?.follows,
          posts: typeof resolvedPostsCount === 'number' ? resolvedPostsCount : prev?.profile?.posts,
          verified: Boolean(profile.verified),
          private: Boolean(profile.private),
          is_business_account: Boolean(profile.isBusinessAccount),
          business_category_name: profile.businessCategoryName ?? null,
          external_url: profile.externalUrl,
          avatar_url: resolvedAvatarUrl,
        },
      }));

      if (postsFromDetails.length > 0) {
        setAuditDraft((prev) => ({
          ...prev,
          recent_posts:
            prev?.recent_posts?.length
              ? prev.recent_posts
              : postsFromDetails
                  .filter((p: any) => p.imageUrl)
                  .slice(0, 9)
                  .map((p: any) => ({
                    url: p.imageUrl,
                    post_url: p.url,
                    image_url: p.imageUrl,
                    caption: p.caption ? p.caption.substring(0, 50) + '...' : '',
                    likes: p.likesCount,
                  })),
        }));
      }

      addLog('Fetching profile posts...');
      const postsResults = await runApifyTask(
        actorId,
        { directUrls: [profileUrl], resultsType: 'posts', resultsLimit: 12 },
        addLog,
        onApifyRunFinished,
        {
          signal: controller.signal,
          onRunStarted: (runId) => activeApifyRunsRef.current.add(runId),
        }
      );
      
      if (postsResults && postsResults.length === 1 && (postsResults[0].error || postsResults[0].errorDescription)) {
        const errItem = postsResults[0];
        addLog(`Apify Error: ${errItem.error} - ${errItem.errorDescription}`);
        if (errItem.error === 'no_items') {
          addLog('Possible causes: Private account, Invalid username, or Geo-restriction.');
        }
      }

      const postsFromPosts = Array.isArray(postsResults)
        ? postsResults.map((item: any) => ({
            caption: item.caption || item.text || '',
            url: item.url || item.postUrl,
            likesCount: item.likesCount || item.likes_count || 0,
            commentsCount: item.commentsCount || item.comments_count || 0,
            imageUrl: item.displayUrl || item.display_url || item.imageUrl || item.image_url,
          }))
        : [];

      const posts = (postsFromPosts.length ? postsFromPosts : postsFromDetails).filter((p: any) => p.imageUrl);
      if (!detailsFirst && posts.length === 0) {
        throw new Error('Failed to retrieve Instagram data');
      }

      const followersCount = typeof resolvedFollowers === 'number' ? resolvedFollowers : 0;
      const avgLikes = Math.floor(posts.reduce((acc: number, p: any) => acc + (p.likesCount || 0), 0) / (posts.length || 1));
      const engagementRate =
        ((posts.reduce((acc: number, p: any) => acc + (p.likesCount || 0) + (p.commentsCount || 0), 0) / (posts.length || 1)) / (followersCount || 1) * 100).toFixed(2) + '%';

      setAuditDraft((prev) => ({
        ...prev,
        recent_posts: posts.slice(0, 9).map((p: any) => ({
          url: p.imageUrl,
          post_url: p.url,
          image_url: p.imageUrl,
          caption: p.caption ? p.caption.substring(0, 50) + '...' : '',
          likes: p.likesCount,
        })),
        profile: {
          ...(prev?.profile || {}),
          followers: typeof resolvedFollowers === 'number' ? resolvedFollowers : prev?.profile?.followers,
          avg_likes: avgLikes,
          engagement_rate: engagementRate,
        },
      }));

      const igData = {
        username: resolvedUsername,
        fullName: profile.fullName || profile.full_name,
        biography: profile.biography || profile.bio || 'No bio available',
        followersCount,
        followsCount: resolvedFollows,
        postsCount: resolvedPostsCount,
        profileUrl: profile.url || profile.profileUrl || profileUrl,
        profileId: profile.id || profile.profileId,
        verified: Boolean(profile.verified),
        private: Boolean(profile.private),
        isBusinessAccount: Boolean(profile.isBusinessAccount),
        businessCategoryName: profile.businessCategoryName ?? null,
        externalUrl: profile.externalUrl,
        externalUrls: Array.isArray(profile.externalUrls) ? profile.externalUrls : [],
        profilePicUrl: profile.profilePicUrl,
        profilePicUrlHD: profile.profilePicUrlHD,
        posts,
      };

      addLog(`Data Retrieved: ${igData.posts.length} posts ready for Gemini analysis.`);

      // Prepare images for Gemini (Max 12 images to show full context)
      const validImages: { inlineData: { data: string; mimeType: string } }[] = [];
      const imageQueue = igData.posts.slice(0, 12); // Process up to 12 posts

      addLog(`Processing ${imageQueue.length} visual assets via secure proxy...`);

      // Sequential processing to avoid overwhelming the proxy
      for (const p of imageQueue) {
         if (controller.signal.aborted) throw Object.assign(new Error('Aborted'), { name: 'AbortError' });
         if (!p.imageUrl) continue;
         try {
           const proxyUrl = `/api/image?url=${encodeURIComponent(p.imageUrl)}`;
           const res = await fetch(proxyUrl, { signal: controller.signal });

           if (!res.ok) continue;
           
           const blob = await res.blob();
           const arrayBuffer = await blob.arrayBuffer();
           const base64 = Buffer.from(arrayBuffer).toString('base64');
           validImages.push({ inlineData: { data: base64, mimeType: "image/jpeg" } });
           
           // Small delay to be nice to the proxy
           await abortableDelay(200, controller.signal);
         } catch (e) {
           console.warn("Image fetch failed:", p.imageUrl);
         }
      }
      
      addLog(`Visual Context: ${validImages.length} images loaded for AI audit.`);

      const apifyUsdTotal = Array.from(apifyRunUsdById.values()).reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);

      const prompt = `
      Role: Expert Influencer Auditor & Brand Strategist (V3.1 Protocol).
      Task: Perform a deep audit of the following Instagram Creator to determine fit for the brand.
      
      Brand Profile: ${brandProfile || "General High-End Lifestyle Brand"}
      
      Creator Data:
      - Username: @${igData.username}
      - Profile URL: ${igData.profileUrl || `https://www.instagram.com/${igData.username}/`}
      - Full Name: ${igData.fullName || ''}
      - Bio: ${igData.biography}
      - Followers: ${igData.followersCount}
      - Following: ${igData.followsCount ?? ''}
      - Total Posts: ${igData.postsCount ?? ''}
      - Verified: ${String(Boolean(igData.verified))}
      - Private: ${String(Boolean(igData.private))}
      - Business Account: ${String(Boolean(igData.isBusinessAccount))}
      - Business Category: ${igData.businessCategoryName ?? ''}
      - External URL: ${igData.externalUrl || ''}
      
      Recent Content Analysis (Last ${igData.posts.length} posts):
      ${igData.posts.map((p, i) => `
      Post #${i+1}:
      - Caption: "${p.caption.substring(0, 300)}..."
      - Engagement: ${p.likesCount} likes, ${p.commentsCount} comments
      `).join('\n')}
      
      Output Requirement:
      Return a JSON object strictly adhering to the schema.
      - style_tags: Array of keywords describing their visual style (e.g., Minimalist, Retro).
      - brand_fit_score: 0-100 score based on alignment with Brand Profile.
      - consistency_score: 0-100 score on how consistent their aesthetic is across posts.
      - audit_reason: A detailed professional explanation of why they fit or don't fit.
      - personalized_greeting: A DM draft that mentions specific details from their recent posts.
      - engagement_analysis: Short analysis of if engagement looks organic or fake.
      - visual_analysis: Describe their aesthetic consistency (Refer to the provided images).
      - niche_category: Their primary content category.
      - risk_factors: Array of red flags (e.g., "Mismatched Audience", "Low Engagement", "Competitor Promo").
      ${outputLanguageInstruction(lang)}`;

      const parts = [...validImages, { text: prompt }];
      const text = await geminiGenerateJson(parts, controller.signal, 120000);
      let aiResult = JSON.parse(text || '{}');
      if (lang === 'zh' && shouldTranslateAuditToZh(aiResult)) {
        addLog('检测到审计结果存在英文混杂，正在自动翻译为中文...');
        try {
          aiResult = await translateAuditResultToZh(aiResult, controller.signal);
        } catch (e: any) {
          if (!controller.signal.aborted && !isAbortError(e)) addLog(`自动翻译失败：${e?.message || 'unknown error'}`);
        }
      }
      if (lang === 'en' && shouldTranslateAuditToEn(aiResult)) {
        addLog('Detected Chinese mix in audit output, translating to English...');
        try {
          aiResult = await translateAuditResultToEn(aiResult, controller.signal);
        } catch (e: any) {
          if (!controller.signal.aborted && !isAbortError(e)) addLog(`Auto-translation failed: ${e?.message || 'unknown error'}`);
        }
      }
      
      const apifyCost = apifyUsdTotal > 0 ? apifyUsdTotal * 7.2 : 0;
      const aiCost = 0.002 * 7.2;   
      
      const fullResult = {
        ...aiResult,
        _localized: {
          base: lang,
          [lang]: extractAuditLocalizedFields(aiResult),
        },
        cost_estimation: {
          apify_cost: Number(apifyCost.toFixed(4)),
          ai_cost: Number(aiCost.toFixed(4)),
          total_cny: Number((apifyCost + aiCost).toFixed(4))
        },
        recent_posts: igData.posts.slice(0, 9).map((p: any) => ({
          url: p.imageUrl,
          post_url: p.url,
          image_url: p.imageUrl,
          caption: p.caption ? p.caption.substring(0, 50) + '...' : '',
          likes: p.likesCount
        })),
        profile: {
          username: igData.username,
          followers: igData.followersCount,
          follows: igData.followsCount,
          posts: igData.postsCount,
          verified: igData.verified,
          private: igData.private,
          is_business_account: igData.isBusinessAccount,
          business_category_name: igData.businessCategoryName,
          external_url: igData.externalUrl,
          avatar_url: igData.profilePicUrlHD || igData.profilePicUrl,
          avg_likes: Math.floor(igData.posts.reduce((acc: number, p: any) => acc + (p.likesCount || 0), 0) / (igData.posts.length || 1)),
          engagement_rate: ((igData.posts.reduce((acc: number, p: any) => acc + (p.likesCount || 0) + (p.commentsCount || 0), 0) / (igData.posts.length || 1)) / (igData.followersCount || 1) * 100).toFixed(2) + '%'
        }
      };

      setResult(fullResult);
      addLog("Deep Audit Complete. Report Generated.");

    } catch (err: any) {
      if (controller.signal.aborted || isAbortError(err)) {
        addLog(lang === 'zh' ? '已停止：已取消审计任务。' : 'Stopped: audit cancelled.');
        return;
      }
      addLog("Audit Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const runAuditGated = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (typeof credits === 'number' && credits <= 0) {
      openCreditsModal();
      return;
    }
    if (loading) return;
    const ok = await deductBeforeCostlyAction();
    if (!ok) return;
    await runAudit();
  };

  const resetDiscovery = () => {
    setProductImg(null);
    setStrategy(null);
    setCandidates([]);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-24 font-sans text-slate-900">
      <Header 
        lang={lang} 
        setLang={(next) => {
          if (auditTranslateBusy.zh || auditTranslateBusy.en) return;

          const current = result;
          if (mode === 'audit' && current && next !== lang) {
            const localized = current._localized;
            const hasTarget = Boolean(localized && (localized as any)[next]);
            if (!hasTarget && hasGeminiKey) {
              const willTranslate = next === 'zh' ? shouldTranslateAuditToZh(current) : shouldTranslateAuditToEn(current);
              if (willTranslate) setAuditTranslateBusy((prev) => ({ ...prev, [next]: true }));
            }
          }

          setLang(next);
        }} 
        mode={mode} 
        setMode={setMode} 
        onLogout={() => void handleLogout()}
        credits={credits}
        creditsLoading={Boolean(user && profileLoading)}
        langBusy={Boolean(mode === 'audit' && result && auditTranslateBusy[lang])}
      />
      {creditsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8">
            <div className="text-sm font-black text-slate-900 uppercase tracking-widest">
              {lang === 'zh' ? '额度已耗尽' : 'Credits Exhausted'}
            </div>
            <div className="mt-3 text-xs font-bold text-slate-500 leading-relaxed">
              {creditsModalDetail
                ? lang === 'zh'
                  ? `扣点失败：${creditsModalDetail}`
                  : `Deduct failed: ${creditsModalDetail}`
                : lang === 'zh'
                  ? '当前试用点数不足，无法继续执行高成本动作。请联系管理员获取点数。'
                  : 'You have no credits left. Contact admin to get more credits.'}
            </div>
            {creditsModalDetail && (
              <div className="mt-4 text-[10px] font-bold text-slate-400 leading-relaxed">
                {lang === 'zh'
                  ? '如果提示 function 不存在/权限不足：去 Supabase SQL Editor 重新执行 supabase.sql。'
                  : 'If it says function missing/permission denied: re-run supabase.sql in Supabase SQL Editor.'}
              </div>
            )}
            <button
              onClick={() => setCreditsModalOpen(false)}
              className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
              {lang === 'zh' ? '知道了' : 'OK'}
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto mt-12 px-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <InputSection
            lang={lang}
            mode={mode}
            apifyToken={apifyToken}
            setApifyToken={setApifyToken}
            apifyQuota={apifyQuota}
            apifySpend={apifySpend}
            onRefreshApifyQuota={() => void refreshApifyQuota(true)}
            productImg={productImg}
            setProductImg={setProductImg}
            productDesc={productDesc}
            setProductDesc={setProductDesc}
            url={url}
            setUrl={(next) => {
              setUrl(next);
              setAuditSeedCandidate(null);
              setAuditDraft(null);
              setResult(null);
            }}
            brandProfile={brandProfile}
            setBrandProfile={setBrandProfile}
            loading={loading}
            analyzeProduct={analyzeProduct}
            runAudit={runAuditGated}
            resetDiscovery={resetDiscovery}
            auditActionLabel={
              !user
                ? lang === 'zh'
                  ? '登录后开启全网拦截'
                  : 'Sign in to start'
                : typeof credits === 'number' && credits <= 0
                  ? lang === 'zh'
                    ? '额度已耗尽，请联系管理员'
                    : 'No credits left'
                  : undefined
            }
            auditActionLocked={Boolean(user && typeof credits === 'number' && credits <= 0)}
          />

          {mode === 'discovery' && (
            <FilterPanel
              lang={lang}
              minFollowers={minFollowers}
              setMinFollowers={setMinFollowers}
              creatorOnly={creatorOnly}
              setCreatorOnly={setCreatorOnly}
            />
          )}

          <LogViewer
            logs={logs}
            canCancel={loading}
            onCancel={cancelCurrentTask}
            cancelLabel={lang === 'zh' ? '停止' : 'Stop'}
          />
        </div>

        <div className="lg:col-span-8 space-y-10">
          {mode === 'discovery' && strategy && (
            <>
              <StrategyMatrix
                lang={lang}
                strategy={strategy}
                candidates={candidates}
                loading={loading}
                apifyToken={apifyToken}
                startSourcing={startSourcingGated}
                startSourcingLabel={
                  !user
                    ? lang === 'zh'
                      ? '登录后开启全网拦截'
                      : 'Sign in to start'
                    : typeof credits === 'number' && credits <= 0
                      ? lang === 'zh'
                        ? '额度已耗尽，请联系管理员'
                        : 'No credits left'
                      : undefined
                }
                startSourcingLocked={Boolean(user && typeof credits === 'number' && credits <= 0)}
              />
              {candidates.length > 0 && (
                <CandidateList
                  lang={lang}
                  candidates={candidates}
                  setCandidates={setCandidates}
                  triggerDeepAudit={triggerDeepAudit}
                />
              )}
            </>
          )}

          {mode === 'audit' && result && <AuditReport lang={lang} result={result} />}

          {mode === 'audit' && !result && (
            <AuditReportShell
              lang={lang}
              url={url}
              loading={loading}
              seedCandidate={auditSeedCandidate}
              draft={auditDraft}
            />
          )}

          {mode === 'discovery' && !strategy && !loading && (
            <div className="bg-white h-[600px] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-200 shadow-sm">
              <History size={64} className="mb-6 opacity-10" />
              <h3 className="text-slate-800 font-black text-xl uppercase tracking-widest">
                Discovery Idle
              </h3>
              <p className="max-w-xs text-center text-slate-400 mt-4 font-bold leading-relaxed text-sm">
                {t.waiting_desc}
              </p>
            </div>
          )}

          {loading && !strategy && (
            <div className="bg-white h-[600px] border border-slate-100 rounded-[3rem] flex flex-col items-center justify-center animate-in zoom-in-95">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                  <Sparkles size={28} className="animate-pulse" />
                </div>
              </div>
              <p className="mt-8 text-slate-900 font-black text-lg uppercase tracking-widest">
                Launching Parallel Probe
              </p>
              <p className="text-slate-400 text-[9px] mt-2 font-black uppercase tracking-[0.3em] animate-pulse">
                Concurrent Inference: Scene & Aesthetic Interception...
              </p>
            </div>
          )}
        </div>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};
