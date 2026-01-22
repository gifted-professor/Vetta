/*
 * @Author: gifted-professor 1044396185@qq.com
 * @Date: 2026-01-20 12:43:32
 * @LastEditors: gifted-professor 1044396185@qq.com
 * @LastEditTime: 2026-01-20 12:43:33
 * @FilePath: /Vetta/components/LogViewer.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useRef, useEffect } from 'react';

interface LogViewerProps {
  logs: string[];
  canCancel?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, canCancel, onCancel, cancelLabel }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-[2rem] p-6 h-40 overflow-y-auto font-mono text-[9px] space-y-1.5 border border-white/5 shadow-2xl custom-scrollbar">
      {canCancel && onCancel && (
        <div className="sticky top-0 z-20 -mt-2 pb-2 flex justify-end bg-slate-900">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-200 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 active:scale-95"
          >
            {cancelLabel || 'Stop'}
          </button>
        </div>
      )}
      {logs.map((l, i) => (
        <div key={i} className="flex gap-2 text-slate-400">
          <span className="text-indigo-500/50 select-none">#{i}</span>
          <span className="text-slate-100/90">{l}</span>
        </div>
      ))}
      <div ref={logEndRef} />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};
