import React from 'react';
import { ScanSearch, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Candidate, AuditDraft } from '../types';

interface AuditReportShellProps {
  lang: 'zh' | 'en';
  url: string;
  loading: boolean;
  seedCandidate: Candidate | null;
  draft: AuditDraft | null;
}

const extractUsername = (url: string) => {
  const raw = String(url || '').trim();
  if (!raw) return '';
  let username = raw.replace(/\/$/, '').split('/').pop() || raw;
  if (username.includes('?')) username = username.split('?')[0];
  return username;
};

const Skeleton: React.FC<{ className: string }> = ({ className }) => (
  <div className={`animate-pulse bg-slate-200/70 ${className}`} />
);

export const AuditReportShell: React.FC<AuditReportShellProps> = ({
  lang,
  url,
  loading,
  seedCandidate,
  draft,
}) => {
  const draftProfile = draft?.profile;
  const username = draftProfile?.username || seedCandidate?.id || extractUsername(url);
  const avatarUrl = draftProfile?.avatar_url || seedCandidate?.avatar_url;
  const followers =
    typeof draftProfile?.followers === 'number'
      ? draftProfile.followers
      : typeof seedCandidate?.followers === 'number'
        ? seedCandidate.followers
        : undefined;
  const verified =
    typeof draftProfile?.verified === 'boolean'
      ? draftProfile.verified
      : typeof seedCandidate?.is_verified === 'boolean'
        ? seedCandidate.is_verified
        : undefined;

  const posts = Array.isArray(draft?.recent_posts) ? draft?.recent_posts.slice(0, 9) : [];
  const hasTarget = Boolean(username);

  if (!hasTarget && !loading) {
    return (
      <div className="bg-white h-[600px] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-200 shadow-sm">
        <ScanSearch size={64} className="mb-6 opacity-10" />
        <h3 className="text-slate-800 font-black text-xl uppercase tracking-widest">
          Awaiting Target URL
        </h3>
        <p className="text-slate-400 mt-4 font-bold text-sm text-center max-w-xs">
          Run a discovery scan or paste a link to initiate Gemini 3.0 deep penetration.
        </p>
      </div>
    );
  }

  const tagText = seedCandidate
    ? lang === 'zh'
      ? '预加载：来自拓圈候选池'
      : 'Prefill: from discovery pool'
    : loading
      ? lang === 'zh'
        ? '正在加载审计数据'
        : 'Loading audit data'
      : lang === 'zh'
        ? '已识别目标'
        : 'Target detected';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#E0F7FA] p-8 rounded-[3rem] border-2 border-white/50 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="w-14 h-14 bg-[#00C853] rounded-2xl shadow-lg rotate-3" />
            <Skeleton className="h-12 w-32 rounded-2xl" />
          </div>
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-3 w-52 rounded-lg opacity-60" />
            </div>
            <Skeleton className="h-6 w-44 rounded-full" />
          </div>
        </div>

        <div className="bg-[#FFF3E0] p-8 rounded-[3rem] border-2 border-white/50 shadow-xl relative overflow-hidden flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-7 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-16 w-20 rounded-2xl" />
        </div>
      </div>

      <section className="bg-white p-12 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100">
        <div className="flex items-center gap-10 mb-12">
          <div className="w-32 h-32 shrink-0 rounded-full bg-slate-100 p-1.5 shadow-2xl ring-1 ring-slate-100 overflow-hidden">
            {avatarUrl ? (
              <img
                key={avatarUrl}
                src={`/api/image?url=${encodeURIComponent(avatarUrl)}`}
                alt={username}
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget;
                  const raw = avatarUrl;
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
            ) : (
              <Skeleton className="w-full h-full rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight truncate">
                {username ? `@${username}` : <Skeleton className="h-10 w-64 rounded-2xl" />}
              </h2>
              {verified ? (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm shrink-0">
                  <CheckCircle2 size={14} />
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide shadow-sm">
                {tagText}
              </span>
              {typeof seedCandidate?.match_score === 'number' && (
                <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border border-indigo-100">
                  {seedCandidate.match_score}%
                </span>
              )}
              {typeof followers === 'number' ? (
                <span className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border border-emerald-100">
                  {lang === 'zh' ? '粉丝' : 'Followers'}:{' '}
                  {followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : followers}
                </span>
              ) : (
                <Skeleton className="h-8 w-28 rounded-xl" />
              )}
              {seedCandidate?.match_reason ? (
                <span
                  className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border border-slate-100 truncate max-w-[360px]"
                  title={seedCandidate.match_reason}
                >
                  {seedCandidate.match_reason}
                </span>
              ) : null}
            </div>

            {seedCandidate?.ai_summary ? (
              <div className="mt-3 text-xs font-bold text-slate-500 leading-relaxed">
                {seedCandidate.ai_summary}
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] text-center min-w-[140px] border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              {lang === 'zh' ? '一致性' : 'Consistency'}
            </div>
            {typeof draft?.consistency_score === 'number' ? (
              <div className="text-3xl font-black text-[#6200EA]">{draft.consistency_score}%</div>
            ) : (
              <Skeleton className="h-10 w-20 rounded-2xl mx-auto" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {posts.length
            ? posts.map((p, i) => (
                <a
                  key={i}
                  href={p.post_url || p.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative group shadow-inner block"
                >
                  {(p.image_url || p.url) ? (
                    <img
                      src={`/api/image?url=${encodeURIComponent(p.image_url || p.url || '')}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const img = e.currentTarget;
                        const raw = p.image_url || p.url;
                        if (!raw) {
                          img.style.display = 'none';
                          return;
                        }
                        if (img.dataset.fallback !== '1') {
                          img.dataset.fallback = '1';
                          img.src = `/api/image?url=${encodeURIComponent(raw)}&fallback=1&v=${Date.now()}`;
                          return;
                        }
                        img.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                      <ImageIcon size={32} className="mb-2 opacity-50" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                        {lang === 'zh' ? '暂无预览' : 'No preview'}
                      </span>
                    </div>
                  )}
                </a>
              ))
            : Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
        </div>

        <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100 text-slate-700 italic text-center font-medium leading-loose text-lg">
          <div className="space-y-3">
            <Skeleton className="h-5 w-[92%] rounded-lg mx-auto" />
            <Skeleton className="h-5 w-[86%] rounded-lg mx-auto" />
            <Skeleton className="h-5 w-[78%] rounded-lg mx-auto" />
          </div>
        </div>
      </section>
    </div>
  );
};
