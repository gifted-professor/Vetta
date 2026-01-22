import React from 'react';
import {
  Key,
  UploadCloud,
  Settings2,
  Camera,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { translations } from '../locales/translations';

interface InputSectionProps {
  lang: 'zh' | 'en';
  mode: 'discovery' | 'audit';
  apifyToken: string;
  setApifyToken: (token: string) => void;
  apifyQuota?: {
    monthlyUsageUsd?: number;
    maxMonthlyUsageUsd?: number;
    updatedAt?: number;
    error?: string;
  };
  apifySpend?: {
    lastRunUsd?: number;
    sessionUsd?: number;
    runCount?: number;
  };
  productImg: string | null;
  setProductImg: (img: string | null) => void;
  productDesc: string;
  setProductDesc: (desc: string) => void;
  url: string;
  setUrl: (url: string) => void;
  brandProfile: string;
  setBrandProfile: (profile: string) => void;
  loading: boolean;
  analyzeProduct: () => void;
  runAudit: () => void;
  resetDiscovery: () => void;
  auditActionLabel?: string;
  auditActionLocked?: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  lang,
  mode,
  apifyToken,
  setApifyToken,
  apifyQuota,
  apifySpend,
  productImg,
  setProductImg,
  productDesc,
  setProductDesc,
  url,
  setUrl,
  brandProfile,
  setBrandProfile,
  loading,
  analyzeProduct,
  runAudit,
  resetDiscovery,
  auditActionLabel,
  auditActionLocked,
}) => {
  const t = translations[lang];
  const hasApifyToken = Boolean(process.env.VETTA_HAS_APIFY_TOKEN);

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProductImg(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black flex items-center gap-3 text-slate-800 uppercase tracking-widest">
            <Key size={16} className="text-indigo-600" /> API Access
          </h2>
        </div>
        <input
          type="password"
          value={apifyToken}
          onChange={(e) => {
            if (hasApifyToken) return;
            setApifyToken(e.target.value);
          }}
          placeholder={hasApifyToken ? (lang === 'zh' ? '安全模式：服务端已配置 Token' : 'Secure mode: server token configured') : t.apify_token_placeholder}
          disabled={hasApifyToken}
          className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs outline-none focus:border-indigo-500 transition-all shadow-inner"
        />
        {(hasApifyToken || apifyToken?.trim()) && (
          <div className="text-[10px] font-bold text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
            <span>
              {lang === 'zh' ? '本周期已用' : 'Cycle used'}:{' '}
              {typeof apifyQuota?.monthlyUsageUsd === 'number' ? `$${apifyQuota.monthlyUsageUsd.toFixed(2)}` : (lang === 'zh' ? '未知' : 'N/A')}
              {typeof apifyQuota?.maxMonthlyUsageUsd === 'number' ? ` / $${apifyQuota.maxMonthlyUsageUsd.toFixed(2)}` : ''}
            </span>
            <span>
              {lang === 'zh' ? '本次消耗' : 'Last run'}:{' '}
              {typeof apifySpend?.lastRunUsd === 'number' ? `$${apifySpend.lastRunUsd.toFixed(4)}` : (lang === 'zh' ? '—' : '—')}
            </span>
            <span>
              {lang === 'zh' ? '会话累计' : 'Session'}:{' '}
              {typeof apifySpend?.sessionUsd === 'number' ? `$${apifySpend.sessionUsd.toFixed(4)}` : (lang === 'zh' ? '—' : '—')}
              {typeof apifySpend?.runCount === 'number' ? ` (${apifySpend.runCount})` : ''}
            </span>
            <span>
              {lang === 'zh' ? '更新' : 'Updated'}:{' '}
              {apifyQuota?.updatedAt ? new Date(apifyQuota.updatedAt).toLocaleTimeString() : (lang === 'zh' ? '—' : '—')}
            </span>
            {apifyQuota?.error && (
              <span className="text-rose-600">
                {lang === 'zh' ? '用量获取失败' : 'Usage fetch failed'}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
        <h2 className="text-sm font-black mb-8 flex items-center gap-3 text-slate-800 uppercase tracking-widest">
          {mode === 'discovery' ? (
            <UploadCloud size={18} className="text-indigo-600" />
          ) : (
            <Settings2 size={18} className="text-indigo-600" />
          )}
          {mode === 'discovery' ? t.product_upload : t.task_input}
        </h2>

        <div className="space-y-6">
          {mode === 'discovery' && (
            <div className="relative group">
              {productImg ? (
                <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-indigo-100 shadow-sm">
                  <img src={productImg} className="w-full h-full object-cover" />
                  <button
                    onClick={resetDiscovery}
                    className="absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full hover:bg-black backdrop-blur-md"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                  <Camera
                    size={32}
                    className="text-slate-300 mb-3 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Visual Input
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={onImageUpload}
                  />
                </label>
              )}
            </div>
          )}

          {mode === 'discovery' ? (
            <textarea
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder={t.product_desc}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs focus:border-indigo-500 outline-none h-24 resize-none shadow-inner"
            />
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.url_label}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs outline-none"
              />
              <textarea
                value={brandProfile}
                onChange={(e) => setBrandProfile(e.target.value)}
                placeholder={t.brand_label}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs outline-none h-24 resize-none shadow-inner"
              />
            </div>
          )}

          <button
            onClick={mode === 'discovery' ? analyzeProduct : runAudit}
            disabled={loading || (mode === 'discovery' && !productImg)}
            aria-disabled={mode === 'audit' && auditActionLocked ? true : undefined}
            className={`w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 ${
              mode === 'audit' && auditActionLocked ? 'opacity-60 cursor-not-allowed hover:bg-slate-900' : 'hover:bg-indigo-700'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
            {mode === 'discovery' ? t.btn_analyze : auditActionLabel || t.btn_start}
          </button>
        </div>
      </section>
    </div>
  );
};
