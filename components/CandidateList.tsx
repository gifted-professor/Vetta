import React, { useState } from 'react';
import { UserCheck, Eraser, Store, ExternalLink, CheckCircle2, Target, ChevronRight, Copy, Check } from 'lucide-react';
import { translations } from '../locales/translations';
import { Candidate } from '../types';

interface CandidateListProps {
  lang: 'zh' | 'en';
  candidates: Candidate[];
  setCandidates: (candidates: Candidate[]) => void;
  triggerDeepAudit: (candidate: Candidate) => void;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  lang,
  candidates,
  setCandidates,
  triggerDeepAudit,
}) => {
  const t = translations[lang];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const HoverTip: React.FC<{ text: string; className?: string; children: React.ReactNode }> = ({
    text,
    className,
    children,
  }) => {
    return (
      <div className={`relative group ${className || ''}`}>
        {children}
        <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-[320px] max-w-[80vw] rounded-2xl bg-slate-900 px-3 py-2 text-[10px] font-bold leading-relaxed text-white shadow-xl group-hover:block">
          {text}
        </div>
      </div>
    );
  };

  const handleCopyLink = (username: string) => {
    const link = `https://www.instagram.com/${username}/`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(username);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
          <UserCheck className="text-indigo-600" />
          {t.candidate_pool}
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
            {candidates.length} Matches Found
          </span>
          <button
            onClick={() => setCandidates([])}
            className="text-slate-300 hover:text-rose-500 transition-colors"
          >
            <Eraser size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {candidates.map((c, i) => (
          <div
            key={c.id || i}
            className={`bg-white p-6 rounded-[2.5rem] border ${
              c.is_commercial ? 'opacity-60 grayscale-[0.5]' : 'border-slate-100 shadow-lg'
            } flex items-center justify-between group hover:border-indigo-300 transition-all relative overflow-hidden`}
          >
            {c.is_commercial && (
              <div className="absolute top-2 right-6 flex items-center gap-1 text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                <Store size={8} /> Potential Seller
              </div>
            )}
            <div className="flex items-center gap-4 flex-1 min-w-0 pr-2">
              <div
                onClick={() => handleCopyLink(c.id)}
                className={`relative w-12 h-12 shrink-0 rounded-2xl overflow-hidden shadow-inner border-2 border-white group-hover:scale-105 transition-transform flex items-center justify-center ${c.avatar_color} cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-2`}
                title="Click to copy Instagram link"
              >
                {copiedId === c.id ? (
                  <div className="absolute inset-0 bg-emerald-500/80 z-20 flex items-center justify-center animate-in fade-in zoom-in">
                    <Check size={18} className="text-white" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 z-20 flex items-center justify-center transition-colors">
                    <Copy size={14} className="text-white opacity-0 hover:opacity-100" />
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg z-0 select-none">
                  {c.id?.charAt(0)?.toUpperCase() || '?'}
                </span>
                {c.avatar_url && (
                  <img
                    key={c.avatar_url}
                    src={`/api/image?url=${encodeURIComponent(c.avatar_url)}`}
                    alt={c.id}
                    className="absolute inset-0 w-full h-full object-cover z-10"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      const raw = c.avatar_url;
                      if (!raw) {
                        img.src = '';
                        return;
                      }
                      if (img.dataset.fallback !== '1') {
                        img.dataset.fallback = '1';
                        img.src = `/api/image?url=${encodeURIComponent(raw)}&fallback=1&v=${Date.now()}`;
                        return;
                      }
                      img.src = '';
                    }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <a
                    href={`https://www.instagram.com/${c.id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-black text-slate-800 text-sm truncate hover:text-indigo-600 transition-colors block max-w-[140px]"
                    title={`@${c.id}`}
                  >
                    @{c.id}
                  </a>
                  {c.is_verified && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-[6px] text-white shadow-sm shrink-0">
                      <CheckCircle2 size={8} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {c.followers ? (
                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 shrink-0">
                      {c.followers >= 1000 ? `${(c.followers / 1000).toFixed(1)}k` : c.followers}
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-slate-300 italic tracking-tighter">
                      N/A
                    </span>
                  )}
                  <HoverTip
                    className="min-w-0"
                    text={[c.match_reason, ...(c.match_signals || [])].filter(Boolean).join(' · ')}
                  >
                    <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider truncate block">
                      {c.match_reason}
                      {c.match_signals?.length ? ` · ${c.match_signals.join(' · ')}` : ''}
                    </span>
                  </HoverTip>
                </div>
                {c.ai_summary && (
                  <HoverTip className="mt-1 min-w-0" text={c.ai_summary}>
                    <div className="text-[8px] font-bold text-slate-500 tracking-tight truncate">
                      {c.ai_summary}
                    </div>
                  </HoverTip>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div
                className={`px-2 py-1 ${
                  c.match_score > 90 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                } text-[10px] font-black rounded-lg transition-all shadow-sm`}
              >
                {c.match_score}%
              </div>
              <button
                onClick={() => triggerDeepAudit(c)}
                className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all shadow-md group-hover:scale-110 active:scale-95"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
