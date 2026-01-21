/*
 * @Author: gifted-professor 1044396185@qq.com
 * @Date: 2026-01-20 12:43:45
 * @LastEditors: gifted-professor 1044396185@qq.com
 * @LastEditTime: 2026-01-20 12:43:46
 * @FilePath: /Vetta/components/FilterPanel.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';
import { SlidersHorizontal, UserCheck } from 'lucide-react';
import { translations } from '../locales/translations';

interface FilterPanelProps {
  lang: 'zh' | 'en';
  minFollowers: number;
  setMinFollowers: (val: number) => void;
  creatorOnly: boolean;
  setCreatorOnly: (val: boolean) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  lang,
  minFollowers,
  setMinFollowers,
  creatorOnly,
  setCreatorOnly,
}) => {
  const t = translations[lang];

  return (
    <section className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-sm font-black flex items-center gap-3 uppercase tracking-widest">
          <SlidersHorizontal size={16} /> {t.filter_panel_title}
        </h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {t.filter_min_followers}
            </label>
            <span className="text-xs font-black bg-indigo-600 px-2 py-0.5 rounded shadow-sm">
              {minFollowers >= 1000 ? `${(minFollowers / 1000).toFixed(0)}k` : minFollowers}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100000"
            step="5000"
            value={minFollowers}
            onChange={(e) => setMinFollowers(parseInt(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>

        <label className="flex items-center justify-between cursor-pointer p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10">
          <div className="flex items-center gap-3">
            <UserCheck size={16} className="text-indigo-400" />
            <span className="text-xs font-black">{t.filter_creator_only}</span>
          </div>
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              checked={creatorOnly}
              onChange={() => setCreatorOnly(!creatorOnly)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
          </div>
        </label>
      </div>
    </section>
  );
};
