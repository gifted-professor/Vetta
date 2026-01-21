import React from 'react';
import { Activity, Tags, Video, Hash, Search, Loader2 } from 'lucide-react';
import { translations } from '../locales/translations';
import { SourcingStrategy, Candidate } from '../types';

interface StrategyMatrixProps {
  lang: 'zh' | 'en';
  strategy: SourcingStrategy;
  candidates: Candidate[];
  loading: boolean;
  apifyToken: string;
  startSourcing: () => void;
}

export const StrategyMatrix: React.FC<StrategyMatrixProps> = ({
  lang,
  strategy,
  candidates,
  loading,
  apifyToken,
  startSourcing,
}) => {
  const t = translations[lang];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5">
      <section className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-40 pointer-events-none">
          <Activity size={120} />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-10 flex items-center gap-4 uppercase tracking-tighter">
          <Tags className="text-indigo-600" />
          {t.strategy_title}
        </h2>
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
                    {tag}
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
              disabled={loading || !apifyToken}
              className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-50 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Search size={16} />}{' '}
              {t.btn_start_sourcing}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
