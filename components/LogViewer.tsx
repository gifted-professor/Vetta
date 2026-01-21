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
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-[2rem] p-6 h-40 overflow-y-auto font-mono text-[9px] space-y-1.5 border border-white/5 shadow-2xl custom-scrollbar">
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
