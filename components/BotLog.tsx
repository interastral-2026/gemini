
import React from 'react';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'AI';
}

export const BotLog: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'text-emerald-400';
      case 'WARNING': return 'text-amber-400';
      case 'ERROR': return 'text-rose-400';
      case 'AI': return 'text-violet-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="glass rounded-xl h-64 flex flex-col overflow-hidden">
      <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">System Terminal</span>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 mono text-[13px]">
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-3">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className={getColor(log.type)}>
              {log.type === 'AI' && '✨ '}
              {log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && <div className="text-slate-700 italic">Initializing core systems...</div>}
      </div>
    </div>
  );
};
