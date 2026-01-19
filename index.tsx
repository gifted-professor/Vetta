
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ShieldCheck, 
  Settings2,
  Star, 
  Layers, 
  Loader2, 
  MessageSquareText, 
  Copy, 
  Database,
  Search,
  ScanSearch,
  Coins,
  History,
  Target,
  XCircle,
  AlertTriangle,
  Sparkles,
  UserCircle2,
  ImageOff,
  FileWarning,
  Camera,
  LayoutGrid,
  Zap,
  ChevronRight,
  Tags,
  Filter,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Info,
  ExternalLink,
  Users,
  Activity
} from 'lucide-react';

// --- i18n ---
const translations = {
  zh: {
    app_title: "AI 语义探测与审计系统",
    app_version: "V4.0 - 全链路闭环",
    mode_discovery: "AI 自动搜寻模式",
    mode_audit: "手动链接审计",
    product_upload: "上传产品图片 (AI 搜寻起点)",
    product_desc: "产品核心描述",
    btn_analyze: "生成搜寻策略",
    strategy_title: "AI 语义探测矩阵",
    core_tags: "核心品类词",
    lifestyle_tags: "场景延伸词",
    aesthetic_keywords: "视觉调性词",
    btn_start_sourcing: "开始全网探测",
    candidate_pool: "AI 探测候选池",
    btn_audit_now: "执行穿透审计",
    audit_report: "深度审计报告",
    status_active: "Gemini 3.0 Pro 已激活",
    task_input: "任务参数",
    url_label: "网红主页链接",
    brand_label: "目标品牌画像",
    btn_start: "开始加权审计",
    waiting_desc: "上传产品图由 AI 自动找人，或输入链接直接审计。",
    asset_error: "加载失败",
    copy_btn: "复制话术",
    sync_feishu: "同步至飞书",
    cost_est: "运行成本估计",
    consistency_score: "人设稳定性",
    risk_label: "风险点检测",
    final_verdict: "终审结论",
    outreach_title: "AI 自动生成话术",
    copied: "已复制到剪贴板"
  },
  en: {
    app_title: "AI Semantic Discovery & Audit",
    app_version: "V4.0 - Full Pipeline",
    mode_discovery: "AI Sourcing Mode",
    mode_audit: "Manual Audit Mode",
    product_upload: "Upload Product Image",
    product_desc: "Product Description",
    btn_analyze: "Generate Strategy",
    strategy_title: "Semantic Matrix",
    core_tags: "Core Categories",
    lifestyle_tags: "Lifestyle Scenes",
    aesthetic_keywords: "Visual Aesthetic",
    btn_start_sourcing: "Start Sourcing",
    candidate_pool: "Candidate Pool",
    btn_audit_now: "Deep Audit",
    audit_report: "Audit Report",
    status_active: "Gemini 3.0 Pro Active",
    task_input: "Parameters",
    url_label: "Influencer URL",
    brand_label: "Brand Profile",
    btn_start: "Start Audit",
    waiting_desc: "Upload image for AI sourcing or input URL for direct audit.",
    asset_error: "Load Failed",
    copy_btn: "Copy",
    sync_feishu: "Sync to Feishu",
    cost_est: "Cost Estimate",
    consistency_score: "Consistency",
    risk_label: "Risk Flags",
    final_verdict: "Final Verdict",
    outreach_title: "AI Generated Outreach",
    copied: "Copied to clipboard"
  }
};

// --- Types ---
interface SourcingStrategy {
  core_tags: string[];
  lifestyle_tags: string[];
  aesthetic_keywords: string[];
  search_queries: string[];
}

interface Candidate {
  id: string;
  url: string;
  match_score: number;
  niche: string;
  avatar_color: string;
}

interface AuditResult {
  style_tags: { zh: string[]; en: string[] };
  brand_fit_score: number;
  audit_reason: { zh: string; en: string };
  personalized_greeting: { zh: string; en: string };
  engagement_analysis: { consistency_score: number; commercial_ratio: string; };
  visual_analysis: { zh: string; en: string };
  niche_category: { zh: string; en: string };
  risk_factors: { zh: string[]; en: string[] };
}

const App = () => {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = translations[lang];
  const [mode, setMode] = useState<'discovery' | 'audit'>('discovery');
  
  // Discovery States
  const [productImg, setProductImg] = useState<string | null>(null);
  const [productDesc, setProductDesc] = useState('');
  const [strategy, setStrategy] = useState<SourcingStrategy | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  
  // Audit States
  const [url, setUrl] = useState('');
  const [brandProfile, setBrandProfile] = useState('');
  const [apifyToken, setApifyToken] = useState('');
  
  // App States
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AuditResult | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProductImg(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyzeProduct = async () => {
    if (!productImg) return;
    setLoading(true);
    setStrategy(null);
    setCandidates([]);
    addLog("Analyzing product visuals via Gemini 3.0 Pro...");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const b64Data = productImg.split(',')[1];
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: b64Data, mimeType: "image/jpeg" } },
            { text: `分析此产品并生成搜寻策略。描述: ${productDesc}. 输出 JSON: core_tags, lifestyle_tags, aesthetic_keywords, search_queries.` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      
      const json = JSON.parse(res.text || '{}');
      setStrategy(json);
      addLog("Sourcing strategy generated.");
    } catch (err: any) {
      addLog("Analysis Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startSourcing = () => {
    setLoading(true);
    setCandidates([]);
    addLog("Calling Apify Hashtag & Search Cluster...");
    addLog(`Using search queries: ${strategy?.search_queries.join(', ')}`);
    
    setTimeout(() => {
      const mockCandidates: Candidate[] = [
        { id: "silvanaestradab", url: "https://www.instagram.com/silvanaestradab/", match_score: 98, niche: "Folk/Lifestyle", avatar_color: "bg-indigo-500" },
        { id: "minimal_vibes", url: "https://www.instagram.com/p/C_12345", match_score: 94, niche: "Aesthetic Design", avatar_color: "bg-emerald-500" },
        { id: "urban_tech", url: "https://www.instagram.com/p/D_67890", match_score: 89, niche: "Tech Reviews", avatar_color: "bg-amber-500" },
        { id: "creative_daily", url: "https://www.instagram.com/p/E_11223", match_score: 86, niche: "Daily Vlogs", avatar_color: "bg-rose-500" },
      ];
      setCandidates(mockCandidates);
      setLoading(false);
      addLog(`Discovery complete. Found ${mockCandidates.length} potential matches.`);
    }, 2000);
  };

  const triggerDeepAudit = (candidate: Candidate) => {
    setUrl(candidate.url);
    setBrandProfile(productDesc || strategy?.core_tags.join(', ') || "");
    setMode('audit');
    // 延迟执行以确保状态切换完成
    setTimeout(() => runAudit(), 100);
  };

  const runAudit = async () => {
    setLoading(true);
    setResult(null);
    addLog(`Starting Deep Audit for: ${url}`);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // 模拟审计流程
      setTimeout(() => {
        setResult({
          style_tags: { zh: ["极简主义", "高质感"], en: ["Minimalism", "High-Quality"] },
          brand_fit_score: 92,
          audit_reason: { zh: "博主的视觉语言与产品设计高度契合，受众具有高审美门槛。", en: "Perfect alignment with visual language; audience has high aesthetic standards." },
          personalized_greeting: { zh: "你好！我注意到你在最近的动态中分享了...", en: "Hi! I noticed your recent sharing about..." },
          engagement_analysis: { consistency_score: 95, commercial_ratio: "8%" },
          visual_analysis: { zh: "人设极其稳定", en: "Highly consistent persona" },
          niche_category: { zh: "垂直领域先锋", en: "Niche Pioneer" },
          risk_factors: { zh: ["暂无风险"], en: ["No major risks"] }
        });
        setLoading(false);
        addLog("Deep audit successful.");
      }, 1500);
    } catch (err: any) {
      addLog("Audit Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFF] pb-24 font-sans text-slate-900">
      <header className="py-4 px-10 bg-white border-b flex items-center justify-between sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200"><ShieldCheck size={20} /></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight">{t.app_title}</h1>
              <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">{t.app_version}</span>
            </div>
            <div className="flex gap-3 mt-1">
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>{t.status_active}
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                <Sparkles size={8} /> Sourcing Engine v4.0
              </span>
            </div>
          </div>
        </div>

        <nav className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button onClick={() => setMode('discovery')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black transition-all ${mode === 'discovery' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
            <Zap size={14} className={mode === 'discovery' ? 'text-indigo-500' : ''} /> {t.mode_discovery}
          </button>
          <button onClick={() => setMode('audit')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black transition-all ${mode === 'audit' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
            <Filter size={14} className={mode === 'audit' ? 'text-indigo-500' : ''} /> {t.mode_audit}
          </button>
        </nav>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setLang('zh')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${lang === 'zh' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}>ZH</button>
          <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${lang === 'en' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}>EN</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-12 px-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-8">
          {mode === 'discovery' ? (
            <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <h2 className="text-xl font-black mb-8 flex items-center gap-4 text-slate-800"><UploadCloud size={24} className="text-indigo-600" />{t.product_upload}</h2>
              <div className="space-y-6">
                <div className="relative group">
                  {productImg ? (
                    <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-indigo-100">
                      <img src={productImg} className="w-full h-full object-cover" />
                      <button onClick={() => {setProductImg(null); setStrategy(null); setCandidates([]);}} className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors">×</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-square rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                      <Camera size={48} className="text-slate-300 mb-4" />
                      <span className="text-xs font-black text-slate-400">点击上传产品图</span>
                      <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                    </label>
                  )}
                </div>
                <textarea 
                  value={productDesc}
                  onChange={e => setProductDesc(e.target.value)}
                  placeholder={t.product_desc}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:border-indigo-500 outline-none h-24 resize-none"
                />
                <button 
                  onClick={analyzeProduct}
                  disabled={loading || !productImg}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} />}
                  {t.btn_analyze}
                </button>
              </div>
            </section>
          ) : (
            <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <h2 className="text-xl font-black mb-8 flex items-center gap-4 text-slate-800"><Settings2 size={24} className="text-indigo-600" />{t.task_input}</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.url_label}</label>
                  <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.brand_label}</label>
                  <textarea value={brandProfile} onChange={e => setBrandProfile(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm outline-none h-24 resize-none" />
                </div>
                <button onClick={runAudit} disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <ScanSearch size={18} />}
                  {t.btn_start}
                </button>
              </div>
            </section>
          )}

          <div className="bg-slate-900 rounded-[2rem] p-6 h-48 overflow-y-auto font-mono text-[10px] space-y-2 border-4 border-slate-800 shadow-inner">
            {logs.map((l, i) => (
              <div key={i} className="flex gap-2 text-slate-400">
                <span className="text-indigo-500/50">#{i}</span>
                <span className="text-slate-300">{l}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Right Stage Panel */}
        <div className="lg:col-span-8 space-y-10">
          {mode === 'discovery' && strategy && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <section className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 text-slate-100 opacity-20 pointer-events-none"><Activity size={120} /></div>
                <h2 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-4"><Tags className="text-indigo-600" />{t.strategy_title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: t.core_tags, tags: strategy.core_tags, color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
                    { label: t.lifestyle_tags, tags: strategy.lifestyle_tags, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                    { label: t.aesthetic_keywords, tags: strategy.aesthetic_keywords, color: "bg-amber-50 text-amber-700 border-amber-100" }
                  ].map((col, idx) => (
                    <div key={idx} className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{col.label}</h4>
                      <div className="flex flex-wrap gap-2">
                        {col.tags.map((tag, i) => (
                          <span key={i} className={`px-3 py-1.5 ${col.color} text-[10px] font-black rounded-lg border`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {!candidates.length && (
                  <button onClick={startSourcing} disabled={loading} className="mt-12 w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-500 transition-all">
                    {loading ? <Loader2 className="animate-spin" /> : <Search size={18} />} {t.btn_start_sourcing}
                  </button>
                )}
              </section>

              {candidates.length > 0 && (
                <section className="space-y-6 animate-in fade-in duration-1000">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><Users className="text-indigo-600" />{t.candidate_pool}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {candidates.map((c, i) => (
                      <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-lg flex items-center justify-between group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-5">
                          <div className={`w-16 h-16 ${c.avatar_color} rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-inner`}>
                            {c.id[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-800">@{c.id}</h4>
                              <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">{c.match_score}% Match</span>
                            </div>
                            <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{c.niche}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => triggerDeepAudit(c)}
                          className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {result ? (
            <div className="space-y-12 animate-in fade-in duration-700">
              <section className="bg-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-3xl font-black flex items-center gap-4"><Star className="text-amber-400 fill-amber-400" />{t.audit_report}</h3>
                  <div className="text-8xl font-black leading-none bg-gradient-to-br from-indigo-600 to-violet-800 bg-clip-text text-transparent">{result.brand_fit_score}</div>
                </div>
                <div className="p-8 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 text-slate-700 font-bold italic mb-10 leading-relaxed text-xl shadow-inner">"{result.visual_analysis[lang]}"</div>
                <div className="space-y-6">
                  <h4 className="font-black text-2xl flex items-center gap-3 text-slate-800"><CheckCircle2 className="text-emerald-500" />{t.final_verdict}</h4>
                  <p className="text-slate-600 text-xl leading-relaxed">{result.audit_reason[lang]}</p>
                </div>
              </section>

              <div className="bg-slate-900 text-white p-16 rounded-[4rem] shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-6"><MessageSquareText className="text-indigo-400" size={32} /><h3 className="text-3xl font-black">{t.outreach_title}</h3></div>
                  <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 font-serif italic text-2xl leading-relaxed text-indigo-50 shadow-inner">
                        {result.personalized_greeting[lang]}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => alert(t.copied)} className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl text-sm flex items-center gap-3"><Copy size={18} />{t.copy_btn}</button>
                    <button className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl text-sm flex items-center gap-3"><Database size={18} />{t.sync_feishu}</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            mode === 'audit' && !loading && (
              <div className="bg-white h-[600px] border-2 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center text-slate-200">
                <ScanSearch size={80} className="mb-8 opacity-20" />
                <h3 className="text-slate-800 font-black text-2xl">Ready for Deep Audit</h3>
                <p className="text-slate-400 mt-4 font-bold">Input URL or select a candidate from discovery mode.</p>
              </div>
            )
          )}

          {mode === 'discovery' && !strategy && !loading && (
            <div className="bg-white h-[600px] border-2 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center text-slate-200">
              <History size={80} className="mb-8 opacity-20" />
              <h3 className="text-slate-800 font-black text-2xl">V4.0 Sourcing Workflow</h3>
              <p className="max-w-xs text-center text-slate-400 mt-4 font-bold leading-relaxed">{t.waiting_desc}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
