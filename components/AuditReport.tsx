/*
 * @Author: gifted-professor 1044396185@qq.com
 * @Date: 2026-01-20 12:44:35
 * @LastEditors: gifted-professor 1044396185@qq.com
 * @LastEditTime: 2026-01-20 12:44:36
 * @FilePath: /Vetta/components/AuditReport.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';
import { Star, CheckCircle2, MessageSquareText, Copy, Database, AlertTriangle, Activity, DollarSign, Image as ImageIcon } from 'lucide-react';
import { translations } from '../locales/translations';
import { AuditResult } from '../types';

interface AuditReportProps {
  lang: 'zh' | 'en';
  result: AuditResult;
}

export const AuditReport: React.FC<AuditReportProps> = ({ lang, result }) => {
  const t = translations[lang];

  const scoreColor = result.brand_fit_score >= 80 ? 'text-emerald-500' : result.brand_fit_score >= 60 ? 'text-amber-500' : 'text-rose-500';
  const scoreBg = result.brand_fit_score >= 80 ? 'bg-emerald-50' : result.brand_fit_score >= 60 ? 'bg-amber-50' : 'bg-rose-50';

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 1. Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cost Estimation */}
        <div className="bg-[#E0F7FA] p-8 rounded-[3rem] border-2 border-white/50 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
           <div className="flex items-center justify-between mb-2">
             <div className="w-14 h-14 bg-[#00C853] rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-12 transition-transform">
               <DollarSign size={28} strokeWidth={3} />
             </div>
             <span className="text-5xl font-black text-[#00695C] tracking-tighter">¥{result.cost_estimation?.total_cny || '0.00'}</span>
           </div>
           <div className="flex justify-between items-end">
              <div>
                <h3 className="text-lg font-black text-[#004D40]">{t.cost_est}</h3>
                <p className="text-[10px] font-bold text-[#00897B] uppercase tracking-wider opacity-60">Based on Deep Audit Compute</p>
              </div>
              <div className="text-[10px] font-bold text-[#00796B] bg-white/40 px-3 py-1 rounded-full">
                Apify: ¥{result.cost_estimation?.apify_cost} · AI: ¥{result.cost_estimation?.ai_cost}
              </div>
           </div>
        </div>

        {/* Fit Score Alert */}
        <div className={`${result.brand_fit_score >= 60 ? 'bg-[#FFF3E0]' : 'bg-[#FFEBEE]'} p-8 rounded-[3rem] border-2 border-white/50 shadow-xl relative overflow-hidden flex items-center justify-between group hover:scale-[1.02] transition-transform duration-500`}>
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-3">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result.brand_fit_score >= 60 ? 'bg-[#FF9800] text-white' : 'bg-[#D32F2F] text-white'}`}>
                 <AlertTriangle size={16} strokeWidth={3} />
               </div>
               <span className={`text-xs font-black uppercase tracking-widest ${result.brand_fit_score >= 60 ? 'text-[#E65100]' : 'text-[#C62828]'}`}>
                 {result.brand_fit_score < 60 ? 'Critical Alert' : 'Compatibility'}
               </span>
             </div>
             <h3 className={`text-2xl font-black ${result.brand_fit_score >= 60 ? 'text-[#EF6C00]' : 'text-[#B71C1C]'}`}>
               {result.brand_fit_score < 60 ? 'Low Match' : 'High Match'}
             </h3>
           </div>
           <div className={`text-7xl font-black tracking-tighter ${result.brand_fit_score >= 60 ? 'text-[#FF9800]' : 'text-[#D32F2F]'} drop-shadow-sm`}>
             {result.brand_fit_score}
           </div>
        </div>
      </div>

      {/* 2. Profile & Visual Wall */}
      <section className="bg-white p-12 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden">
        
        {/* Profile Header - V3.1 Style */}
        <div className="flex items-center gap-10 mb-12">
           <div className="w-32 h-32 shrink-0 rounded-full bg-slate-100 p-1.5 shadow-2xl ring-1 ring-slate-100">
             <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-5xl font-black text-slate-300 overflow-hidden relative">
               {result.profile?.username?.charAt(0).toUpperCase()}
               {/* Optional: Try to load avatar again if available in cache */}
             </div>
           </div>
           
           <div className="flex-1 min-w-0">
             <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3 truncate">@{result.profile?.username}</h2>
             <div className="flex items-center gap-4">
               <span className="bg-[#F3E5F5] text-[#7B1FA2] px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wide border border-[#E1BEE7]">
                 {result.niche_category || "Uncategorized"}
               </span>
               <div className="h-8 w-px bg-slate-200"></div>
               <div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Likes</div>
                 <div className="text-lg font-black text-slate-700">{(result.profile?.avg_likes || 0).toLocaleString()}</div>
               </div>
               <div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ER</div>
                 <div className="text-lg font-black text-[#6200EA]">{result.profile?.engagement_rate}</div>
               </div>
             </div>
           </div>
           
           <div className="bg-slate-50 p-6 rounded-[2rem] text-center min-w-[140px] border border-slate-100">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Visual DNA</div>
             <div className="text-3xl font-black text-[#6200EA]">{result.consistency_score || 0}%</div>
           </div>
        </div>

        {/* Visual Wall */}
        <div className="grid grid-cols-3 gap-4 mb-10 relative z-10">
          {result.recent_posts?.map((p, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative group shadow-inner">
              {p.url ? (
                <img 
                  src={`/api/image?url=${encodeURIComponent(p.url)}`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                  <ImageIcon size={32} className="mb-2 opacity-50" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">No Preview</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center p-6">
                <p className="text-white text-xs font-medium line-clamp-3 text-center leading-relaxed">
                  {p.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Analysis */}
        <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100 text-slate-700 italic text-center font-medium leading-loose text-lg relative z-10">
          <span className="text-4xl text-indigo-200 absolute top-4 left-6">"</span>
          {result.visual_analysis}
          <span className="text-4xl text-indigo-200 absolute bottom-0 right-6">"</span>
        </div>
      </section>

      {/* 3. Risk Factors (Red Flags) */}
      {result.risk_factors && result.risk_factors.length > 0 && (
        <section className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100">
          <h4 className="flex items-center gap-3 text-rose-600 font-black uppercase tracking-widest mb-6">
            <AlertTriangle size={18} /> {t.risk_label}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.risk_factors.map((risk, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-rose-100 flex items-center gap-3 shadow-sm">
                <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0"></div>
                <span className="text-sm font-bold text-rose-700">{risk}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Verdict & Outreach */}
      <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,#4338ca_0%,transparent_50%)] opacity-20"></div>
        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <MessageSquareText className="text-indigo-400" size={24} />
               <h3 className="text-xl font-black tracking-widest uppercase">{t.outreach_title}</h3>
             </div>
             <span className="text-[10px] font-bold bg-indigo-600 px-2 py-1 rounded text-white uppercase">
               AI Generated
             </span>
          </div>
          
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 font-serif italic text-lg leading-loose text-indigo-50">
            {result.personalized_greeting}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.personalized_greeting);
                alert(t.copied);
              }}
              className="flex-1 py-4 bg-white text-slate-900 font-black rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
            >
              <Copy size={16} /> {t.copy_btn}
            </button>
            <button className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors">
              <Database size={16} /> {t.sync_feishu}
            </button>
          </div>
        </div>
      </div>

      {/* 5. V3.1 Status Bar (Floating) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-2 rounded-full shadow-2xl border border-white/10 flex items-center gap-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Gemini 3.0 Pro Active</span>
        </div>
        <div className="w-px h-3 bg-white/20"></div>
        <div className="flex items-center gap-2">
          <Activity size={10} className="text-indigo-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">V3.1 Audit Protocol</span>
        </div>
      </div>

    </div>
  );
};
