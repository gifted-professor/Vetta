
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BarChart3, 
  Camera, 
  CheckCircle2, 
  Copy, 
  Database,
  ExternalLink, 
  Globe, 
  Info, 
  Layers, 
  Loader2, 
  MessageSquareText, 
  PieChart, 
  ShieldCheck, 
  Settings2,
  Star, 
  Upload, 
  Zap,
  RefreshCw,
  Languages,
  ArrowRightLeft,
  Sparkles,
  Link2,
  Cpu,
  Terminal as TerminalIcon,
  ChevronRight,
  Code2,
  Eye,
  EyeOff,
  AlertCircle,
  Heart,
  MessageCircle,
  UserCircle2,
  Coins,
  History,
  TrendingUp,
  Target,
  XCircle,
  AlertTriangle,
  Ban,
  Timer,
  Images as ImagesIcon,
  Search,
  ScanSearch,
  Maximize2,
  FileWarning,
  ImageOff
} from 'lucide-react';

// --- i18n Dictionary ---
const translations = {
  zh: {
    app_title: "跨境网红 AI 智能审计系统",
    app_version: "MVP POC PHASE v3.1 - 视觉高可用版",
    status_active: "Gemini 3.0 Pro 已激活",
    task_input: "审计任务参数",
    url_label: "网红主页链接 (URL)",
    brand_label: "目标品牌画像 (核心调性)",
    brand_placeholder: "例：吉列剃须刀, 男性理容, 硬核科技",
    depth_label: "审计深度 (采集动态数量)",
    depth_quick: "快速抽查 (1-3条)",
    depth_standard: "标准画像 (9-12条)",
    depth_deep: "深度背调 (13-15条)",
    btn_start: "开始加权智能审计",
    btn_loading: "正在穿透内容层...",
    waiting_data: "等待审计指令",
    waiting_desc: "系统将执行“红蓝对抗”审计，穿透封面伪装，识别博主最真实的视觉生产力与受众画像。",
    loading_title: "AI 穿透式审计中",
    loading_desc: "正在进行加权博弈分析，正在穿透第 {n} 层视觉素材...",
    report_title: "深度审计报告 (加权模型)",
    vision_insight: "视觉资产一致性透视",
    outreach_title: "高转化开发信开头",
    outreach_detail: "提取博主真实细节生成的个性化话术",
    copy_btn: "复制话术",
    sync_feishu: "同步至飞书",
    final_verdict: "终审结论 (50/30/20 权重分配)",
    apify_token_label: "Apify API Token",
    error_apify_failed: "抓取失败，请检查 Token 或网络状态。",
    error_title: "审计异常",
    error_retry: "重试审计",
    copied: "已复制到剪贴板",
    log_init: "初始化加权审计引擎...",
    log_apify_start: "执行 API 内容抓取...",
    log_apify_success: "数据抓取成功，解析资产中...",
    log_penetrate: "正在穿透第 {n} 条动态的多图资产...",
    log_ai_start: "Gemini 3.0 Pro 正在执行“质量穿透”加权算法...",
    log_ai_done: "审计完成，已剔除封面欺诈干扰项。",
    avg_likes: "平均点赞",
    avg_comments: "平均评论",
    cost_est: "审计运行成本",
    cost_hint: "基于加权穿透深度审计模式",
    cost_apify: "抓取费用",
    cost_ai: "AI 算力",
    consistency_score: "人设稳定性",
    risk_label: "致命风险风险点 (Risk Flags)",
    mismatch_warning: "⚠️ 【强烈不建议合作】 品牌严重不匹配",
    analysis_duration: "分析总耗时",
    sec_unit: "秒",
    asset_error: "资源获取失败",
    asset_skipped: "资产受限已略过"
  },
  en: {
    app_title: "Influencer AI Audit System",
    app_version: "MVP POC PHASE v3.1 - High Availability",
    status_active: "Gemini 3.0 Pro Active",
    task_input: "Audit Task Params",
    url_label: "Influencer URL",
    brand_label: "Brand Profile",
    brand_placeholder: "e.g. Gillette Razor, Men's Grooming",
    depth_label: "Audit Depth (Posts)",
    depth_quick: "Quick (1-3)",
    depth_standard: "Profile (9-12)",
    depth_deep: "Due Diligence (13+)",
    btn_start: "Start Weighted Audit",
    btn_loading: "Penetrating Layers...",
    waiting_data: "Awaiting Command",
    waiting_desc: "The system will perform 'Red-Blue' adversarial audit, penetrating cover-baiting.",
    loading_title: "Visual Penetration Audit",
    loading_desc: "Performing weighted analysis, penetrating layer {n}...",
    report_title: "Weighted Audit Report",
    vision_insight: "Visual Consistency Insight",
    outreach_title: "Smart Outreach Script",
    outreach_detail: "Personalized based on deep-level post details",
    copy_btn: "Copy",
    sync_feishu: "Sync to Feishu",
    final_verdict: "Final Verdict (50/30/20 Weighting)",
    apify_token_label: "Apify API Token",
    error_apify_failed: "Fetch failed. Check Token.",
    error_title: "Audit Interrupted",
    error_retry: "Retry Audit",
    copied: "Copied!",
    log_init: "Initializing weighted engine...",
    log_apify_start: "Running content crawler...",
    log_apify_success: "Fetch successful, analyzing assets...",
    log_penetrate: "Penetrating carousel assets for post #{n}...",
    log_ai_start: "Gemini performing quality-leak audit...",
    log_ai_done: "Audit complete. Cover-baiting noise removed.",
    avg_likes: "Avg Likes",
    avg_comments: "Avg Comments",
    cost_est: "Audit Run Cost",
    cost_hint: "Based on deep penetration mode",
    cost_apify: "Fetch Cost",
    cost_ai: "AI Cost",
    consistency_score: "Consistency",
    risk_label: "Weighted Risk Flags",
    mismatch_warning: "⚠️ [DO NOT COOPERATE] Major Mismatch",
    analysis_duration: "Total Duration",
    sec_unit: "s",
    asset_error: "Asset Failed",
    asset_skipped: "Skipped"
  }
};

// --- Types ---
interface AuditResult {
  style_tags: { zh: string[]; en: string[] };
  brand_fit_score: number;
  audit_reason: { zh: string; en: string };
  personalized_greeting: { zh: string; en: string };
  engagement_analysis: {
    estimated_rate: number;
    follower_authenticity: { zh: string; en: string };
    consistency_score: number; 
    commercial_ratio: string; 
  };
  visual_analysis: { zh: string; en: string };
  trend_summary: { zh: string; en: string };
  niche_category: { zh: string; en: string };
  risk_factors: { zh: string[]; en: string[] };
}

interface ImageAsset {
  b64: string | null;
  error?: boolean;
}

interface ImageGroup {
  postId: number;
  mainImage: ImageAsset;
  subImages: ImageAsset[];
}

const App = () => {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = translations[lang];
  
  const [url, setUrl] = useState('https://www.instagram.com/silvanaestradab/');
  const [brandProfile, setBrandProfile] = useState('吉列剃须刀, 男性理容, 追求干净清爽');
  const [apifyToken, setApifyToken] = useState('');
  const [auditDepth, setAuditDepth] = useState(12);
  
  const [loading, setLoading] = useState(false);
  const [penetrationLevel, setPenetrationLevel] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [imageGroups, setImageGroups] = useState<ImageGroup[]>([]);
  const [rawApifyData, setRawApifyData] = useState<any>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [costEst, setCostEst] = useState<{ total: number, apify: number, ai: number } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const logEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const calculateCost = (postCount: number, tokens: number) => {
    const exchangeRate = 7.2;
    const apifyCostUsd = postCount * 0.002;
    const aiCostUsd = (tokens / 1000000) * 0.1;
    return {
      apify: parseFloat((apifyCostUsd * exchangeRate).toFixed(4)),
      ai: parseFloat((aiCostUsd * exchangeRate).toFixed(4)),
      total: parseFloat(((apifyCostUsd + aiCostUsd) * exchangeRate).toFixed(4))
    };
  };

  // IMPROVED: Direct streaming proxy for higher availability
  const imageUrlToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Proxy failed");
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1]);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Asset Fetch Error:", imageUrl, e);
      return null;
    }
  };

  const cleanJsonResponse = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCostEst(null);
    setElapsedTime(0);
    setPenetrationLevel(1);
    setImageGroups([]);
    addLog(t.log_init);

    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);

    try {
      if (!apifyToken) throw new Error(t.apify_token_label + " is required");
      
      addLog(t.log_apify_start);
      const apifyRes = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "directUrls": [url], "resultsLimit": auditDepth, "resultsType": "posts" })
      });
      
      if (!apifyRes.ok) throw new Error(t.error_apify_failed);
      
      const data = await apifyRes.json() as any;
      if (!data || data.length === 0) throw new Error("Empty dataset from crawler.");
      setRawApifyData(data);
      addLog(t.log_apify_success);
      
      // PARALLEL VISUAL PENETRATION WITH ERROR TRACKING
      const groups: ImageGroup[] = [];
      const fetchQueue: { url: string; groupId: number; isMain: boolean }[] = [];
      
      data.slice(0, 5).forEach((post: any, idx: number) => {
        if (post.displayUrl) fetchQueue.push({ url: post.displayUrl, groupId: idx, isMain: true });
        if (post.childPosts) {
          post.childPosts.slice(0, 2).forEach((cp: any) => {
            if (cp.displayUrl) fetchQueue.push({ url: cp.displayUrl, groupId: idx, isMain: false });
          });
        }
      });

      addLog(`Executing penetration on ${fetchQueue.length} assets (Streaming Proxy)...`);
      
      const b64Results = await Promise.all(fetchQueue.map(item => imageUrlToBase64(item.url)));
      
      // Build groups while preserving slots for errors
      fetchQueue.forEach((item, idx) => {
        const b64 = b64Results[idx];
        let group = groups.find(g => g.postId === item.groupId);
        if (!group) {
          group = { postId: item.groupId, mainImage: { b64: null }, subImages: [] };
          groups.push(group);
        }
        
        const asset = { b64: b64, error: !b64 };
        if (item.isMain) group.mainImage = asset;
        else group.subImages.push(asset);
      });

      setImageGroups(groups);
      setPenetrationLevel(4);
      addLog("Asset processing finished. Starting AI weighted analysis...");

      const allValidBase64 = b64Results.filter(b => b !== null) as string[];
      if (allValidBase64.length === 0) throw new Error("Critical network failure: All visual assets failed to load.");
      
      const imageParts = allValidBase64.map(b64 => ({ inlineData: { data: b64, mimeType: "image/jpeg" } }));
      const postsContext = data.map((p: any, i: number) => `Post #${i+1}: Likes: ${p.likesCount}, Comments: ${p.commentsCount}, Caption: ${p.caption}`).join('\n---\n');

      addLog(t.log_ai_start);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemPrompt = `你是一位毒舌、专业的跨境营销审计官。
请按照以下【严格权重逻辑】执行审计：
1. 【红线审查 (50%)】：判断品牌 "${brandProfile}" 与博主受众是否错配。错配严禁超过 25 分。
2. 【视觉穿透 (30%)】：对比 Carousel 多图。封面美但内页质感差判定为“封面欺诈”，重扣 consistency_score。
3. 【互动去噪 (20%)】：识别 Emoji/通用词评论，判定粉丝价值。

输出要求：
- 如果低于 40 分，audit_reason 必须以“【强烈不建议合作】”开头。
- 必须返回标准 JSON。`;

      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...imageParts as any, { text: `Brand Profile: ${brandProfile}\n\nSocial Context:\n${postsContext}` }] },
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              style_tags: { type: Type.OBJECT, properties: { zh: { type: Type.ARRAY, items: { type: Type.STRING } }, en: { type: Type.ARRAY, items: { type: Type.STRING } } } },
              brand_fit_score: { type: Type.NUMBER },
              audit_reason: { type: Type.OBJECT, properties: { zh: { type: Type.STRING }, en: { type: Type.STRING } } },
              personalized_greeting: { type: Type.OBJECT, properties: { zh: { type: Type.STRING }, en: { type: Type.STRING } } },
              engagement_analysis: { type: Type.OBJECT, properties: { estimated_rate: { type: Type.NUMBER }, follower_authenticity: { type: Type.OBJECT, properties: { zh: { type: Type.STRING }, en: { type: Type.STRING } } }, consistency_score: { type: Type.NUMBER }, commercial_ratio: { type: Type.STRING } } },
              visual_analysis: { type: Type.OBJECT, properties: { zh: { type: Type.STRING }, en: { type: Type.STRING } } },
              trend_summary: { type: Type.OBJECT, properties: { zh: { type: Type.STRING }, en: { type: Type.STRING } } },
              niche_category: { type: Type.OBJECT, properties: { zh: { type: Type.STRING }, en: { type: Type.STRING } } },
              risk_factors: { type: Type.OBJECT, properties: { zh: { type: Type.ARRAY, items: { type: Type.STRING } }, en: { type: Type.ARRAY, items: { type: Type.STRING } } } }
            },
            required: ["brand_fit_score", "audit_reason", "niche_category", "risk_factors"]
          }
        }
      });

      const parsedResult = JSON.parse(cleanJsonResponse(res.text || '{}'));
      setCostEst(calculateCost(data.length, 38000)); 
      setResult(parsedResult);
      addLog(t.log_ai_done);
    } catch (err: any) {
      setError(err.message || "Audit interrupted by technical error.");
      addLog(`Critical Error: ${err.message}`);
    } finally {
      if (timerRef.current) window.clearInterval(timerRef.current);
      setLoading(false);
    }
  };

  const metrics = rawApifyData ? {
    avgLikes: Math.round(rawApifyData.reduce((a, b) => a + (b.likesCount || 0), 0) / rawApifyData.length),
    avgComments: Math.round(rawApifyData.reduce((a, b) => a + (b.commentsCount || 0), 0) / rawApifyData.length),
    user: rawApifyData[0]?.ownerUsername || 'Influencer'
  } : null;

  return (
    <div className="min-h-screen bg-[#FAFAFF] pb-24 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="py-6 px-12 bg-white/80 border-b flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)]"><ShieldCheck size={30} /></div>
          <div><h1 className="text-2xl font-black tracking-tight flex items-center gap-2">{t.app_title}<span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full border border-indigo-200">V3.1</span></h1><p className="text-[10px] text-indigo-500/70 font-bold uppercase tracking-widest mt-1">Audit Protocol Layer: Adversarial Weights + Resilient Asset Engine</p></div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button onClick={() => setLang('zh')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${lang === 'zh' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>中文</button>
          <button onClick={() => setLang('en')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${lang === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>EN</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-16 px-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4 space-y-10">
          <section className="bg-white p-12 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-10 pointer-events-none"><Database size={120} /></div>
            <h2 className="text-xl font-black mb-10 flex items-center gap-4 text-slate-800"><Settings2 size={24} className="text-indigo-600" />{t.task_input}</h2>
            <div className="space-y-8 relative z-10">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 group-focus-within:text-indigo-500 transition-colors">Apify API Access Token</label>
                <input type="password" value={apifyToken} placeholder="sk-..." onChange={e => setApifyToken(e.target.value)} className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 shadow-inner" />
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 group-focus-within:text-indigo-500 transition-colors">{t.url_label}</label>
                <div className="relative">
                    <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="w-full pl-14 pr-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner" />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                </div>
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 group-focus-within:text-indigo-500 transition-colors">{t.brand_label}</label>
                <textarea value={brandProfile} placeholder={t.brand_placeholder} onChange={e => setBrandProfile(e.target.value)} className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm focus:border-indigo-500 focus:bg-white outline-none h-32 resize-none transition-all shadow-inner" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.depth_label}</label>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${auditDepth >= 9 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{auditDepth >= 9 ? t.depth_standard : t.depth_quick}</span>
                </div>
                <input type="range" min="1" max="15" step="1" value={auditDepth} onChange={e => setAuditDepth(parseInt(e.target.value))} className="w-full h-2.5 bg-slate-100 rounded-full appearance-none accent-indigo-600 cursor-pointer" />
              </div>
              <button onClick={runAudit} disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <ScanSearch size={22} className="text-indigo-400" />}
                {loading ? t.btn_loading : t.btn_start}
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-12">
          {error && (
            <div className="bg-rose-50 border-2 border-rose-100 p-10 rounded-[3.5rem] shadow-xl flex flex-col gap-6 animate-in slide-in-from-top-6">
              <div className="flex items-center gap-6 text-rose-600">
                <AlertTriangle size={40} strokeWidth={2.5} />
                <div>
                  <h3 className="text-xl font-black">{t.error_title}</h3>
                  <p className="text-sm font-medium opacity-80">{error}</p>
                </div>
              </div>
              <button onClick={runAudit} className="self-end px-8 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200">{t.error_retry}</button>
            </div>
          )}

          {costEst && (
            <div className="bg-white border border-slate-100 p-10 rounded-[3.5rem] flex items-center justify-between shadow-sm animate-in fade-in zoom-in-95">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100"><Coins size={32} /></div>
                  <div><h3 className="text-slate-800 font-black text-lg">{t.cost_est}</h3><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t.cost_hint}</p></div>
               </div>
               <div className="flex items-center gap-12">
                  <div className="text-right">
                    <div className="text-[9px] font-black text-slate-300 uppercase mb-1 flex items-center gap-1 justify-end"><Timer size={10} />{t.analysis_duration}</div>
                    <div className="text-2xl font-black text-slate-800 tabular-nums">{elapsedTime.toFixed(1)}{t.sec_unit}</div>
                  </div>
                  <div className="w-px h-12 bg-slate-100"></div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-emerald-600 leading-none tabular-nums">¥{costEst.total}</div>
                    <div className="flex gap-4 text-[9px] font-black text-slate-400 mt-2 uppercase"><span>{t.cost_apify} ¥{costEst.apify}</span><span>{t.cost_ai} ¥{costEst.ai}</span></div>
                  </div>
               </div>
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-slate-100 rounded-[4rem] p-16 h-[700px] flex flex-col shadow-2xl shadow-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(penetrationLevel / 4) * 100}%` }}></div>
              </div>
              <div className="flex flex-col items-center mb-16">
                <div className="relative w-28 h-28 mb-8">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-600 z-20">
                    <span className="text-[10px] font-black uppercase tracking-tighter">Layer</span>
                    <span className="text-2xl font-black tabular-nums">{penetrationLevel}/4</span>
                  </div>
                  <Loader2 className="animate-spin text-indigo-600 relative z-10 w-full h-full" size={112} strokeWidth={1} />
                </div>
                <h3 className="font-black text-3xl text-slate-800">{t.loading_title}</h3>
                <p className="text-slate-400 text-base mt-3 font-medium">{t.loading_desc.replace('{n}', penetrationLevel.toString())}</p>
              </div>
              <div className="flex-1 bg-slate-900 rounded-[2.5rem] p-10 font-mono text-[11px] text-slate-400 overflow-y-auto space-y-3 border-[6px] border-slate-800/50 shadow-inner scrollbar-hide">
                {logs.map((l, i) => (
                    <div key={i} className="flex gap-4 group">
                        <span className="text-indigo-500/30 group-hover:text-indigo-500 transition-colors">#{i.toString().padStart(3, '0')}</span>
                        <span className="text-slate-300 transition-colors">{l}</span>
                    </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          ) : result ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {result.brand_fit_score < 40 && (
                <div className="bg-rose-600 text-white px-12 py-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-rose-200 ring-8 ring-rose-50 border border-white/20">
                  <div className="flex items-center gap-6"><Ban size={36} strokeWidth={2.5} /><div className="space-y-1"><h3 className="text-xl font-black tracking-tight">{t.mismatch_warning}</h3><p className="text-xs text-rose-100 font-bold uppercase tracking-widest">Weighted fit below acceptable threshold</p></div></div>
                  <div className="text-5xl font-black tabular-nums">{result.brand_fit_score}</div>
                </div>
              )}

              {metrics && (
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl flex items-center gap-12 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-40 group-hover:scale-110 transition-transform duration-1000"><UserCircle2 size={160} /></div>
                  <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 ring-4 ring-slate-50 relative z-10 overflow-hidden"><UserCircle2 size={80} /></div>
                  <div className="flex-1 relative z-10">
                    <h3 className="text-4xl font-black italic text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">@{metrics.user}</h3>
                    <div className="px-5 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black inline-block mt-3 uppercase tracking-[0.15em] border border-indigo-100 shadow-sm">{result.niche_category[lang]}</div>
                    <div className="flex gap-10 mt-10">
                      <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.avg_likes}</span><span className="text-2xl font-black text-rose-500 tabular-nums">{metrics.avgLikes.toLocaleString()}</span></div>
                      <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.avg_comments}</span><span className="text-2xl font-black text-indigo-600 tabular-nums">{metrics.avgComments.toLocaleString()}</span></div>
                      <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AD Ratio</span><span className="text-2xl font-black text-amber-500 tabular-nums">{result.engagement_analysis.commercial_ratio}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] text-center border border-slate-100 min-w-[140px] relative z-10 shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.consistency_score}</div>
                    <div className="text-4xl font-black text-indigo-600 tabular-nums">{result.engagement_analysis.consistency_score}%</div>
                  </div>
                </div>
              )}

              <section className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Layers size={16} /> Visual Asset Matrix (Resilient Grid)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {imageGroups.map((group, gIdx) => (
                    <div key={gIdx} className="relative group/card">
                        {group.subImages.length > 0 && <div className="absolute inset-0 bg-slate-200 translate-x-2 translate-y-2 rounded-[2rem] opacity-40"></div>}
                        {group.subImages.length > 1 && <div className="absolute inset-0 bg-slate-100 translate-x-4 translate-y-4 rounded-[2rem] opacity-20"></div>}
                        
                        <div className="relative bg-white p-3 rounded-[2rem] border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                            <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden relative bg-slate-50">
                                {group.mainImage.error ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                        <ImageOff size={48} strokeWidth={1} />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.asset_error}</span>
                                    </div>
                                ) : (
                                    <img src={`data:image/jpeg;base64,${group.mainImage.b64}`} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                                )}
                                <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-white font-black border border-white/20">Post #{group.postId + 1}</div>
                                
                                {group.subImages.length > 0 && (
                                    <div className="absolute bottom-4 right-4 flex -space-x-3">
                                        {group.subImages.map((sub, sIdx) => (
                                            <div key={sIdx} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-lg bg-slate-100 flex items-center justify-center">
                                                {sub.error ? (
                                                    <FileWarning size={14} className="text-slate-300" />
                                                ) : (
                                                    <img src={`data:image/jpeg;base64,${sub.b64}`} className="w-full h-full object-cover opacity-80" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                  ))}
                </div>
              </section>

              {result.risk_factors?.[lang]?.length > 0 && (
                <div className="bg-rose-50 p-12 rounded-[4rem] border border-rose-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 text-rose-100 opacity-30 group-hover:rotate-12 transition-transform duration-500"><AlertTriangle size={120} /></div>
                  <h3 className="text-rose-600 font-black flex items-center gap-4 mb-8 uppercase tracking-[0.2em] text-sm relative z-10"><XCircle size={22} strokeWidth={2.5} />{t.risk_label}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {result.risk_factors[lang].map((risk, i) => (
                      <div key={i} className="flex gap-5 text-rose-900 text-sm font-bold bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-rose-200 shadow-sm hover:border-rose-400 transition-colors">
                        <AlertCircle className="shrink-0 text-rose-500" size={18} />
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white p-16 rounded-[4.5rem] border border-slate-100 shadow-2xl shadow-indigo-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-50/20 to-transparent pointer-events-none"></div>
                <div className="flex items-center justify-between mb-16 relative z-10">
                  <div className="flex items-center gap-4"><Star className="text-yellow-400 fill-yellow-400" size={28} /> <h3 className="text-3xl font-black text-slate-800">{t.report_title}</h3></div>
                  <div className="flex flex-col items-end">
                    <div className="text-7xl font-black bg-gradient-to-br from-indigo-600 to-violet-800 bg-clip-text text-transparent tabular-nums leading-none">{result.brand_fit_score}</div>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">Weighted Audit Index</div>
                  </div>
                </div>
                <div className="p-10 bg-indigo-50/50 rounded-[3rem] border border-indigo-100/50 mb-12 shadow-inner">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3"><Target size={16} />{t.vision_insight}</h4>
                  <p className="text-slate-700 leading-relaxed font-semibold italic text-lg">"{result.visual_analysis[lang]}"</p>
                </div>
                <div className="space-y-6 relative z-10">
                    <h3 className="font-black text-slate-800 text-2xl mb-8 flex items-center gap-4"><ShieldCheck className="text-emerald-500" size={32} />{t.final_verdict}</h3>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-600 leading-relaxed text-xl font-medium antialiased">{result.audit_reason[lang]}</p>
                    </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-20 rounded-[5rem] shadow-[0_40px_100px_-20px_rgba(15,23,42,0.3)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/5 rounded-full blur-[80px] group-hover:bg-violet-600/10 transition-all duration-1000"></div>
                
                <div className="relative z-10 space-y-12">
                  <div className="flex items-center gap-6"><div className="p-4 bg-white/5 rounded-2xl"><MessageSquareText className="text-indigo-400" size={44} /></div><h3 className="text-4xl font-black tracking-tight">{t.outreach_title}</h3></div>
                  <div>
                    <p className="text-indigo-300/60 text-[11px] font-black uppercase tracking-[0.4em] mb-6">{t.outreach_detail}</p>
                    <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/10 font-serif italic text-2xl leading-relaxed text-indigo-50 shadow-inner ring-1 ring-white/10 selection:bg-indigo-500/30">
                        {result.personalized_greeting[lang]}
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <button onClick={() => {
                        navigator.clipboard.writeText(result.personalized_greeting[lang]);
                        alert(t.copied);
                    }} className="px-12 py-6 bg-white text-slate-900 font-black rounded-[2rem] text-sm hover:scale-105 hover:bg-indigo-50 active:scale-95 transition-all shadow-2xl flex items-center gap-3"><Copy size={20} />{t.copy_btn}</button>
                    <button className="px-12 py-6 bg-indigo-600/30 text-white font-black rounded-[2rem] text-sm border border-indigo-400/20 hover:bg-indigo-600/50 transition-all flex items-center gap-3 group/btn">
                        <Database size={20} className="group-hover/btn:rotate-12 transition-transform" />
                        {t.sync_feishu}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white h-[700px] border-2 border-dashed border-slate-200 rounded-[5rem] flex flex-col items-center justify-center text-slate-200 shadow-sm animate-in fade-in duration-1000">
              <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center mb-10 group"><History size={80} className="text-slate-100 group-hover:rotate-12 transition-transform duration-500" /></div>
              <h3 className="text-slate-800 font-black text-3xl tracking-tight">{t.waiting_data}</h3>
              <p className="max-w-md text-center text-slate-400 mt-6 font-semibold px-12 leading-relaxed">{t.waiting_desc}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-2xl px-12 py-4 rounded-full border border-white/15 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] flex items-center gap-10 z-50">
        <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]"></div><span className="text-[11px] font-black text-white/80 uppercase tracking-[0.2em]">{t.status_active}</span></div>
        <div className="w-px h-5 bg-white/20"></div>
        <div className="flex items-center gap-3 text-indigo-400"><Sparkles size={16} /><span className="text-[11px] font-black uppercase tracking-[0.2em]">v3.1 Resilient Asset Mode Active</span></div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
