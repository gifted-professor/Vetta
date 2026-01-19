
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
  Images as ImagesIcon
} from 'lucide-react';

// --- i18n Dictionary ---
const translations = {
  zh: {
    app_title: "跨境网红 AI 智能审计系统",
    app_version: "MVP POC PHASE v2.9 - 加权博弈审计版",
    status_active: "Gemini 3.0 Pro 已激活",
    mode_manual: "手动截图模式",
    mode_auto: "Apify 自动抓取",
    task_input: "审计任务参数",
    url_label: "网红主页链接 (URL)",
    brand_label: "目标品牌画像 (核心调性)",
    brand_placeholder: "例：吉列剃须刀, 男性理容, 硬核科技",
    depth_label: "审计深度 (采集动态数量)",
    depth_quick: "快速抽查 (1-3条)",
    depth_standard: "标准画像 (9-12条)",
    depth_deep: "深度背调 (13-15条)",
    btn_start: "开始智能审计",
    btn_loading: "系统正在执行加权分析...",
    waiting_data: "等待输入审计指令",
    waiting_desc: "Gemini 3.0 Pro 将在并行扫描视觉资产后，为您呈现一份包含“首图欺诈”检测的深度审计方案。",
    loading_title: "AI 深度审计画像中",
    loading_desc: "正在执行“多图穿透”审计，正在并行抓取所有素材...",
    report_title: "加权审计结果报告",
    vision_insight: "视觉资产深度透视",
    outreach_title: "智选开发信开头",
    outreach_detail: "基于最近动态细节生成的个性化话术",
    copy_btn: "复制话术",
    sync_feishu: "同步至飞书",
    final_verdict: "审计结论 (核心权重分配)",
    apify_token_label: "Apify API Token",
    error_apify_failed: "数据抓取失败，请检查 Token。",
    copied: "已复制",
    log_init: "初始化加权审计引擎...",
    log_apify_start: "抓取博主时间轴数据...",
    log_apify_success: "获取原始数据成功。",
    log_image_extract: "启动并行多图提取...",
    log_ai_start: "Gemini 3.0 正在执行权重博弈算法...",
    log_ai_done: "审计完成，已捕捉审美质量衰减风险。",
    overview_title: "博主动态快照",
    avg_likes: "平均点赞",
    avg_comments: "平均评论",
    cost_est: "本次审计预估成本",
    cost_hint: "基于深度加权审计模式估算",
    cost_apify: "Apify 费用",
    cost_ai: "AI 费用",
    ad_ratio: "商业化比例",
    consistency_score: "人设稳定性",
    trend_analysis: "近期趋势分析",
    error_title: "审计流程中断",
    error_retry: "重试审计",
    risk_label: "致命风险风险点 (Risk Flags)",
    mismatch_warning: "⚠️ 【不建议合作】 品牌调性极差",
    analysis_duration: "分析耗时",
    sec_unit: "秒"
  },
  en: {
    app_title: "Influencer AI Audit System",
    app_version: "MVP POC PHASE v2.9 - Weighted Audit",
    status_active: "Gemini 3.0 Pro Active",
    mode_manual: "Manual Mode",
    mode_auto: "Apify Auto-Fetch",
    task_input: "Audit Parameters",
    url_label: "Influencer URL",
    brand_label: "Brand Profile",
    brand_placeholder: "e.g. Gillette Razor, Men's Grooming",
    depth_label: "Audit Depth (Post Count)",
    depth_quick: "Quick Scan (1-3)",
    depth_standard: "Profile (9-12)",
    depth_deep: "Due Diligence (13-15)",
    btn_start: "Start AI Audit",
    btn_loading: "Weighted Profiling...",
    waiting_data: "Waiting for Input",
    waiting_desc: "AI will analyze multi-image narratives and detect cover-baiting.",
    loading_title: "Deep Risk Profiling",
    loading_desc: "Executing parallel fetch and performing visual narrative checks...",
    report_title: "Weighted Audit Report",
    vision_insight: "Visual Asset Deep-Dive",
    outreach_title: "Smart Greeting",
    outreach_detail: "Personalized based on recent details",
    copy_btn: "Copy",
    sync_feishu: "Sync to Feishu",
    final_verdict: "Final Verdict (Core Weights)",
    apify_token_label: "Apify API Token",
    error_apify_failed: "Apify failed.",
    copied: "Copied!",
    log_init: "Initializing weighted engine...",
    log_apify_start: "Starting deep crawler...",
    log_apify_success: "Time-series data retrieved!",
    log_image_extract: "Parallel fetching carousel assets...",
    log_ai_start: "Gemini performing adversarial weighting...",
    log_ai_done: "Audit complete.",
    overview_title: "Feed Snapshot",
    avg_likes: "Avg Likes",
    avg_comments: "Avg Comments",
    cost_est: "Est. Run Cost",
    cost_hint: "Based on parallel deep profiling",
    cost_apify: "Apify Cost",
    cost_ai: "AI Cost",
    ad_ratio: "Commercial Ratio",
    consistency_score: "Persona Stability",
    trend_analysis: "Trend Analysis",
    error_title: "Audit Interrupted",
    error_retry: "Retry Audit",
    risk_label: "Risk Flags",
    mismatch_warning: "⚠️ [DO NOT COOPERATE] Poor Fit",
    analysis_duration: "Duration",
    sec_unit: "s"
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

const App = () => {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = translations[lang];
  
  const [url, setUrl] = useState('https://www.instagram.com/silvanaestradab/');
  const [brandProfile, setBrandProfile] = useState('吉列剃须刀, 男性理容, 追求干净清爽');
  const [apifyToken, setApifyToken] = useState('');
  const [auditDepth, setAuditDepth] = useState(12);
  
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [images, setImages] = useState<{preview: string, base64?: string}[]>([]);
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

  const imageUrlToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) return null;
      const data = await response.json() as any;
      if (!data.contents) return null;
      const blobResponse = await fetch(data.contents);
      if (!blobResponse.ok) return null;
      const blob = await blobResponse.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
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
      if (!data || data.length === 0) throw new Error("No feed data.");
      setRawApifyData(data);
      addLog(t.log_apify_success);
      
      // Extraction logic for multi-image carousels
      const urlsToFetch: string[] = [];
      data.slice(0, 5).forEach((post: any) => {
        if (post.displayUrl) urlsToFetch.push(post.displayUrl);
        if (post.childPosts && post.childPosts.length > 0) {
          post.childPosts.slice(0, 2).forEach((child: any) => {
            if (child.displayUrl) urlsToFetch.push(child.displayUrl);
          });
        }
      });

      const finalUrls = urlsToFetch.slice(0, 12);
      addLog(`${t.log_image_extract} (${finalUrls.length} assets)...`);
      
      // PARALLEL EXECUTION for image fetching
      const b64Promises = finalUrls.map(u => imageUrlToBase64(u));
      const b64Results = await Promise.all(b64Promises);
      const validBase64Images = b64Results.filter(b => b !== null) as string[];

      setImages(validBase64Images.map(b64 => ({ preview: `data:image/jpeg;base64,${b64}`, base64: b64 })));
      addLog(`Parallel fetch complete. Captured ${validBase64Images.length} images.`);

      const postsContext = data.map((p: any, i: number) => `Post #${i+1}: Likes: ${p.likesCount}, Comments: ${p.commentsCount}, Caption: ${p.caption}`).join('\n---\n');

      addLog(t.log_ai_start);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imageParts = validBase64Images.map(b64 => ({ inlineData: { data: b64, mimeType: "image/jpeg" } }));
      
      // REFINED PROMPT with WEIGHTED ALLOCATION
      const systemPrompt = `你是一位毒舌、专业的跨境营销审计官，你的目标是为品牌方省下错误的预算。
请按照以下【权重优先级】执行审计：

1. 【第一优先级：红线审查 (权重 50%)】
   - 核心任务：判断品牌 "${brandProfile}" 与博主受众的“生殖隔离”。
   - 判定准则：如果是男士理容产品配对女性博主，或硬核科技配对纯感性艺术博主，即使对方粉丝再多，分值也严禁超过 25 分。
   - 强制动作：在 risk_factors 中必须列出“受众错配”风险。

2. 【第二优先级：多图穿透审计 (权重 30%)】
   - 核心任务：对比分析收到的 12 张图片。
   - 判定准则：识别属于同一条帖子（Carousel）的图片序列。如果封面（第一张）极美，但后续副图（第二、三张）质感断崖式下跌、构图凌乱或光影廉价，说明博主人设属于“精装修”，人设稳定性（consistency_score）需扣除 40 分。
   - 记录：如果发现此现象，在 risk_factors 中注明“Coverbaiting quality decay (封面欺诈)”。

3. 【第三优先级：互动去噪分析 (权重 20%)】
   - 核心任务：阅读最近动态的评论细节。
   - 判定准则：如果评论全是 Emoji 或 "Love it" 等通用词，判定为低价值粉丝；如果评论涉及具体的歌词、特定的产品问题或长段文字，判定为高粘性。

【输出要求】：
- 严禁给出模棱两可的评价。
- 如果 brand_fit_score 低于 40，audit_reason 必须以“【不建议合作】”开头并说明致命伤。
- 必须返回标准 JSON 格式。`;

      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...imageParts as any, { text: `Target Brand Profile: ${brandProfile}\n\nSocial Feed Data:\n${postsContext}` }] },
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
      setCostEst(calculateCost(data.length, 32000)); 
      setResult(parsedResult);
      addLog(t.log_ai_done);
    } catch (err: any) {
      setError(err.message || "Audit failed.");
      addLog(`Error: ${err.message}`);
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
    <div className="min-h-screen bg-[#FDFDFF] pb-20 font-sans text-slate-900">
      <header className="py-5 px-10 bg-white/70 border-b flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><ShieldCheck size={26} /></div>
          <div><h1 className="text-xl font-black tracking-tight">{t.app_title}</h1><p className="text-[10px] text-indigo-500 font-bold uppercase">{t.app_version}</p></div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border">
          <button onClick={() => setLang('zh')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${lang === 'zh' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>中文</button>
          <button onClick={() => setLang('en')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${lang === 'en' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>ENGLISH</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-12 px-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3"><Settings2 size={24} className="text-indigo-600" />{t.task_input}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">API TOKEN</label>
                <input type="password" value={apifyToken} placeholder="Apify-Token..." onChange={e => setApifyToken(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.url_label}</label>
                <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.brand_label}</label>
                <textarea value={brandProfile} placeholder={t.brand_placeholder} onChange={e => setBrandProfile(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm focus:border-indigo-500 outline-none h-28 resize-none transition-all" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.depth_label}</label>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${auditDepth >= 9 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{auditDepth >= 9 ? t.depth_standard : t.depth_quick}</span>
                </div>
                <input type="range" min="1" max="15" step="1" value={auditDepth} onChange={e => setAuditDepth(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none accent-indigo-600" />
              </div>
              <button onClick={runAudit} disabled={loading} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[1.5rem] font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={22} className="text-yellow-400 fill-yellow-400" />}
                {loading ? t.btn_loading : t.btn_start}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-10">
          {error && (
            <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[3rem] shadow flex flex-col gap-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4 text-rose-600"><AlertTriangle size={32} /><div><h3 className="font-black">{t.error_title}</h3><p className="text-sm">{error}</p></div></div>
              <button onClick={runAudit} className="self-end px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-black">{t.error_retry}</button>
            </div>
          )}

          {costEst && (
            <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[3rem] flex items-center justify-between shadow-sm animate-in slide-in-from-top-6">
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200"><Coins size={28} /></div>
                  <div><h3 className="text-emerald-900 font-black">{t.cost_est}</h3><p className="text-emerald-600/70 text-[10px] font-bold uppercase">{t.cost_hint}</p></div>
               </div>
               <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-[9px] font-black text-emerald-600/60 uppercase mb-1 flex items-center gap-1 justify-end"><Timer size={10} />{t.analysis_duration}</div>
                    <div className="text-xl font-black text-emerald-900 leading-none">{elapsedTime.toFixed(1)}{t.sec_unit}</div>
                  </div>
                  <div className="w-px h-10 bg-emerald-100"></div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-900 leading-none">¥{costEst.total}</div>
                    <div className="flex gap-4 text-[9px] font-black text-emerald-600/60 mt-2"><span>{t.cost_apify}: ¥{costEst.apify}</span><span>{t.cost_ai}: ¥{costEst.ai}</span></div>
                  </div>
               </div>
            </div>
          )}

          {loading ? (
            <div className="bg-white border-2 border-slate-100 rounded-[3.5rem] p-12 h-[600px] flex flex-col shadow-xl">
              <div className="flex flex-col items-center mb-12">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-xs z-20 tabular-nums">{elapsedTime.toFixed(1)}s</div>
                  <Loader2 className="animate-spin text-indigo-600 relative z-10 w-full h-full" size={80} strokeWidth={1} />
                </div>
                <h3 className="font-black text-2xl">{t.loading_title}</h3><p className="text-slate-400 text-sm mt-2">{t.loading_desc}</p>
              </div>
              <div className="flex-1 bg-slate-900 rounded-[2rem] p-8 font-mono text-[11px] text-slate-400 overflow-y-auto space-y-2 border-4 border-slate-800">
                {logs.map((l, i) => <div key={i} className="flex gap-3"><span className="text-indigo-500/50">0x{i.toString(16).padStart(2, '0')}</span>{l}</div>)}
                <div ref={logEndRef} />
              </div>
            </div>
          ) : result ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {result.brand_fit_score < 40 && (
                <div className="bg-amber-600 text-white px-10 py-6 rounded-[2rem] flex items-center justify-between shadow-lg ring-4 ring-amber-100">
                  <div className="flex items-center gap-4"><Ban size={28} /><h3 className="text-lg font-black">{t.mismatch_warning}</h3></div>
                  <div className="text-2xl font-black">{result.brand_fit_score}</div>
                </div>
              )}

              {metrics && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex items-center gap-10">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 overflow-hidden"><UserCircle2 size={56} /></div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-black italic">@{metrics.user}</h3>
                    <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black inline-block mt-2 uppercase tracking-widest">{result.niche_category[lang]}</div>
                    <div className="flex gap-6 mt-6">
                      <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">{t.avg_likes}</span><span className="text-lg font-black text-rose-500">{metrics.avgLikes.toLocaleString()}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">{t.avg_comments}</span><span className="text-lg font-black text-indigo-500">{metrics.avgComments.toLocaleString()}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">{t.ad_ratio}</span><span className="text-lg font-black text-amber-500">{result.engagement_analysis.commercial_ratio}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] text-center border">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{t.consistency_score}</div>
                    <div className="text-3xl font-black text-indigo-600">{result.engagement_analysis.consistency_score}%</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                {images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-md border-2 border-white relative group">
                    <img src={img.preview} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-full text-[9px] text-white font-bold">Asset #{i + 1}</div>
                  </div>
                ))}
              </div>

              {result.risk_factors?.[lang]?.length > 0 && (
                <div className="bg-rose-50 p-10 rounded-[3rem] border border-rose-100">
                  <h3 className="text-rose-600 font-black flex items-center gap-3 mb-6 uppercase tracking-wider text-sm"><XCircle size={18} />{t.risk_label}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.risk_factors[lang].map((risk, i) => (
                      <div key={i} className="flex gap-3 text-rose-800 text-sm font-bold bg-white/50 p-4 rounded-2xl border border-rose-200/50">
                        <AlertCircle className="shrink-0 text-rose-500" size={16} />
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3"><Star className="text-yellow-400 fill-yellow-400" /> <h3 className="text-2xl font-black">{t.report_title}</h3></div>
                  <div className="text-5xl font-black bg-gradient-to-br from-indigo-600 to-violet-700 bg-clip-text text-transparent">{result.brand_fit_score}<span className="text-sm text-slate-200">/100</span></div>
                </div>
                <div className="p-8 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/50 mb-8">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={14} />{t.vision_insight}</h4>
                  <p className="text-slate-700 leading-relaxed font-medium italic">"{result.visual_analysis[lang]}"</p>
                </div>
                <h3 className="font-black text-slate-800 text-xl mb-6 flex items-center gap-3"><ShieldCheck className="text-green-600" size={24} />{t.final_verdict}</h3>
                <p className="text-slate-500 leading-relaxed text-lg">{result.audit_reason[lang]}</p>
              </div>

              <div className="bg-slate-900 text-white p-16 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4"><MessageSquareText className="text-indigo-400" size={36} /><h3 className="text-3xl font-black">{t.outreach_title}</h3></div>
                  <p className="text-indigo-300/80 text-[11px] font-bold uppercase tracking-[0.2em]">{t.outreach_detail}</p>
                  <div className="bg-white/5 p-10 rounded-3xl border border-white/10 font-serif italic text-xl leading-relaxed text-indigo-50 ring-1 ring-white/5">{result.personalized_greeting[lang]}</div>
                  <div className="flex gap-4">
                    <button onClick={() => navigator.clipboard.writeText(result.personalized_greeting[lang])} className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl text-xs hover:scale-105 transition-all shadow-xl flex items-center gap-2"><Copy size={16} />{t.copy_btn}</button>
                    <button className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl text-xs border border-indigo-400/30 hover:bg-indigo-500 transition-all">{t.sync_feishu}</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white h-[600px] border-2 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-200">
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8"><History size={64} className="text-slate-100" /></div>
              <h3 className="text-slate-800 font-black text-2xl">{t.waiting_data}</h3>
              <p className="max-w-md text-center text-slate-400 mt-4 font-medium px-10">{t.waiting_desc}</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-6 z-50">
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div><span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{t.status_active}</span></div>
        <div className="w-px h-4 bg-white/10"></div>
        <div className="flex items-center gap-2 text-indigo-400"><ImagesIcon size={14} /><span className="text-[10px] font-black uppercase tracking-widest">v2.9 Weighted Game Theory Audit Mode</span></div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
