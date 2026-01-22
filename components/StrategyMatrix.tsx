import React from 'react';
import { Activity, Tags, Video, Hash, Search, Loader2, Languages } from 'lucide-react';
import { translations } from '../locales/translations';
import { SourcingStrategy, Candidate } from '../types';

interface StrategyMatrixProps {
  lang: 'zh' | 'en';
  strategy: SourcingStrategy;
  candidates: Candidate[];
  loading: boolean;
  apifyToken: string;
  startSourcing: () => void;
  startSourcingLabel?: string;
  startSourcingLocked?: boolean;
}

export const StrategyMatrix: React.FC<StrategyMatrixProps> = ({
  lang,
  strategy,
  candidates,
  loading,
  apifyToken,
  startSourcing,
  startSourcingLabel,
  startSourcingLocked,
}) => {
  const t = translations[lang];
  const hasGeminiKey = Boolean(process.env.VETTA_HAS_GEMINI_KEY);
  const hasApifyToken = Boolean(process.env.VETTA_HAS_APIFY_TOKEN);
  const [isHoldingZh, setIsHoldingZh] = React.useState(false);
  const [zhMap, setZhMap] = React.useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem('vetta_term_zh_map');
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  });
  const [zhLoading, setZhLoading] = React.useState(false);

  const terms = React.useMemo(() => {
    const raw = [
      ...(strategy?.visual_actions || []),
      ...(strategy?.lifestyle_tags || []),
      ...(strategy?.core_tags || []),
    ];
    const unique = Array.from(new Set(raw.map(s => String(s || '').trim()).filter(Boolean)));
    return unique.slice(0, 30);
  }, [strategy]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('vetta_term_zh_map', JSON.stringify(zhMap));
    } catch {
      return;
    }
  }, [zhMap]);

  const ensureZhMap = React.useCallback(async () => {
    if (zhLoading) return;
    if (!hasGeminiKey) return;

    const missing = terms.filter(term => !zhMap[term]).slice(0, 30);
    if (missing.length === 0) return;

    setZhLoading(true);
    try {
      const url = `/api/gemini/v1beta/models/gemini-3-pro-preview:generateContent`;
      const prompt = `Translate each item in this JSON array from English to Simplified Chinese.
- Output MUST be STRICT JSON only (no markdown).
- Return a single JSON object mapping original item -> Chinese.
- Keys MUST match the original items exactly (including spaces/underscores).
- Values should be natural, short Chinese phrases suitable for UI labels.

Input:
${JSON.stringify(missing)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) return;
      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') || '';
      if (!text) return;
      const json = JSON.parse(text);
      const mapCandidate =
        json && typeof json === 'object' && !Array.isArray(json)
          ? json?.translations && typeof json.translations === 'object' && !Array.isArray(json.translations)
            ? json.translations
            : json
          : null;
      if (!mapCandidate) return;

      const next: Record<string, string> = {};
      Object.entries(mapCandidate).forEach(([k, v]) => {
        const key = String(k || '').trim();
        const val = String(v || '').trim();
        if (key && val) next[key] = val;
      });
      setZhMap(prev => ({ ...prev, ...next }));
    } catch {
      return;
    } finally {
      setZhLoading(false);
    }
  }, [hasGeminiKey, terms, zhLoading, zhMap]);

  const setHolding = React.useCallback(
    (next: boolean) => {
      setIsHoldingZh(next);
      if (next) ensureZhMap();
    },
    [ensureZhMap]
  );

  const renderTagText = React.useCallback(
    (tag: string) => {
      if (!isHoldingZh) return tag;
      return zhMap[tag] || tag;
    },
    [isHoldingZh, zhMap]
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5">
      <section className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-40 pointer-events-none">
          <Activity size={120} />
        </div>
        <div className="mb-10 flex items-start justify-between gap-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-4 uppercase tracking-tighter">
            <Tags className="text-indigo-600" />
            {t.strategy_title}
          </h2>
          <button
            type="button"
            onPointerDown={() => setHolding(true)}
            onPointerUp={() => setHolding(false)}
            onPointerCancel={() => setHolding(false)}
            onPointerLeave={() => setHolding(false)}
            onContextMenu={e => e.preventDefault()}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') setHolding(true);
            }}
            onKeyUp={e => {
              if (e.key === 'Enter' || e.key === ' ') setHolding(false);
            }}
            className="relative z-20 px-3 py-2 bg-white/80 backdrop-blur rounded-2xl border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-white transition-all active:scale-95 select-none"
            aria-label={lang === 'zh' ? '长按显示中文翻译' : 'Hold to show Chinese translations'}
          >
            <span className="flex items-center gap-2">
              {zhLoading ? <Loader2 className="animate-spin" size={12} /> : <Languages size={12} />}
              {lang === 'zh' ? '按住翻译' : 'Hold CN'}
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {[
            {
              label: t.visual_actions,
              tags: strategy.visual_actions,
              color: 'bg-rose-50 text-rose-700 border-rose-100',
              icon: <Video size={10} />,
            },
            {
              label: t.lifestyle_tags,
              tags: strategy.lifestyle_tags,
              color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              prefix: '#',
            },
            {
              label: t.core_tags,
              tags: strategy.core_tags,
              color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
            },
          ].map((col, idx) => (
            <div key={idx} className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                {col.icon}
                {col.label}
              </h4>
              <div className="flex flex-wrap gap-2">
                {col.tags.map((tag, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1.5 ${col.color} text-[10px] font-black rounded-lg border shadow-sm`}
                  >
                    {col.prefix || ''}
                    {renderTagText(tag)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!candidates.length && !loading && (
          <div className="mt-12 p-8 bg-indigo-600 rounded-3xl flex items-center justify-between group shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:rotate-6 transition-transform">
                <Hash size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tighter">
                  Ready for Parallel Interception
                </p>
                <p className="text-[10px] font-bold text-white/60 italic">
                  Intersecting creators via 'visual actions' instead of Bio keywords.
                </p>
              </div>
            </div>
            <button
              onClick={startSourcing}
              disabled={loading || (!hasApifyToken && !apifyToken)}
              aria-disabled={startSourcingLocked ? true : undefined}
              className={`px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${
                startSourcingLocked ? 'opacity-60 cursor-not-allowed hover:bg-white' : 'hover:bg-slate-50'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Search size={16} />}{' '}
              {startSourcingLabel || t.btn_start_sourcing}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
