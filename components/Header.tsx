/*
 * @Author: gifted-professor 1044396185@qq.com
 * @Date: 2026-01-20 12:43:19
 * @LastEditors: gifted-professor 1044396185@qq.com
 * @LastEditTime: 2026-01-20 12:43:21
 * @FilePath: /Vetta/components/Header.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';
import { ShieldCheck, Compass, Zap, Filter, Compass as CompassIcon, LogOut } from 'lucide-react';
import { translations } from '../locales/translations';

interface HeaderProps {
  lang: 'zh' | 'en';
  setLang: (lang: 'zh' | 'en') => void;
  mode: 'discovery' | 'audit';
  setMode: (mode: 'discovery' | 'audit') => void;
  onLogout: () => void;
  credits?: number | null;
  creditsLoading?: boolean;
  langBusy?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang, mode, setMode, onLogout, credits, creditsLoading, langBusy }) => {
  const t = translations[lang];

  return (
    <header className="py-4 px-10 bg-white border-b flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <ShieldCheck size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight">{t.app_title}</h1>
            <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              {t.app_version}
            </span>
          </div>
          <div className="flex gap-3 mt-1">
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
              {t.status_active}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              <CompassIcon size={8} /> Parallel-Sourcing Active
            </span>
          </div>
        </div>
      </div>

      <nav className="flex bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setMode('discovery')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black transition-all ${
            mode === 'discovery' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
          }`}
        >
          <Zap size={14} className={mode === 'discovery' ? 'text-indigo-500' : ''} /> {t.mode_discovery}
        </button>
        <button
          onClick={() => setMode('audit')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black transition-all ${
            mode === 'audit' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
          }`}
        >
          <Filter size={14} className={mode === 'audit' ? 'text-indigo-500' : ''} /> {t.mode_audit}
        </button>
      </nav>

      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black text-slate-900 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl uppercase tracking-widest">
          {lang === 'zh'
            ? `点数 ${creditsLoading ? '…' : typeof credits === 'number' ? credits : '—'}`
            : `Credits ${creditsLoading ? '…' : typeof credits === 'number' ? credits : '—'}`}
        </span>
        {langBusy && (
          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></span>
            {lang === 'zh' ? '翻译中…' : 'Translating…'}
          </span>
        )}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setLang('zh')}
            disabled={Boolean(langBusy)}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              lang === 'zh' ? 'bg-white text-indigo-600' : 'text-slate-400'
            }`}
          >
            ZH
          </button>
          <button
            onClick={() => setLang('en')}
            disabled={Boolean(langBusy)}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              lang === 'en' ? 'bg-white text-indigo-600' : 'text-slate-400'
            }`}
          >
            EN
          </button>
        </div>
        
        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
