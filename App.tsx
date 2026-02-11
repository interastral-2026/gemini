
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, TrendingUp, AlertCircle, Binary, ShieldCheck, Zap, History, Activity, RefreshCcw, Percent, ArrowUpRight, ArrowDownRight, BrainCircuit, Wallet, Coins, Power, PowerOff, BadgeEuro, Banknote, Target
} from 'lucide-react';
import { Asset, Trade, BotConfig } from './types';
import { fetchPortfolio, fetchTrades, fetchSignals, fetchBotStatus, toggleEmergencyStop } from './services/coinbaseService';
import { BotLog } from './components/BotLog';

const App: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Asset[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isCloudLinked, setIsCloudLinked] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [isLoadingStop, setIsLoadingStop] = useState(false);

  const addLog = useCallback((message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'AI' = 'INFO') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }].slice(-50));
  }, []);

  const refreshData = async () => {
    try {
      const config: BotConfig = { apiKey: '', privateKey: '', riskPercentage: 90, tradingMode: 'AGGRESSIVE', baseCurrency: 'EUR' };
      const [portfolioData, tradesData, signalsData, statusData] = await Promise.all([
        fetchPortfolio(config),
        fetchTrades(),
        fetchSignals(),
        fetchBotStatus()
      ]);
      setPortfolio(portfolioData);
      setTrades(tradesData);
      setSignals(signalsData);
      setIsStopped(statusData.isEmergencyStopped);
      setIsCloudLinked(true);
    } catch (err) {
      setIsCloudLinked(false);
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyStop = async () => {
    setIsLoadingStop(true);
    const result = await toggleEmergencyStop(!isStopped);
    setIsStopped(result);
    setIsLoadingStop(false);
    addLog(result ? "EMERGENCY STOP PROTOCOL INITIATED" : "SPECTRAL CORE RE-ACTIVATED", result ? "ERROR" : "SUCCESS");
  };

  const totalBalanceEUR = portfolio.reduce((acc, asset) => acc + (asset.balance * asset.currentPrice), 0);
  const eurCashBalance = portfolio.find(a => a.symbol === 'EUR')?.balance || 0;
  const totalHoldingsPNL = portfolio.reduce((acc, asset) => {
    if (asset.type === 'CRYPTO' && asset.entryPrice > 0) {
      return acc + ((asset.currentPrice - asset.entryPrice) * asset.balance);
    }
    return acc;
  }, 0);

  return (
    <div className="min-h-screen flex bg-[#010409] text-slate-300 font-sans selection:bg-emerald-500/30">
      <aside className="w-20 border-r border-slate-800/40 flex flex-col items-center py-8 bg-[#0d1117]/80 backdrop-blur-xl shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-12 ring-1 ring-white/10">
          <Binary className="text-white w-7 h-7" />
        </div>
        <nav className="flex flex-col gap-8">
          <button className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl ring-1 ring-emerald-500/20"><LayoutDashboard size={22} /></button>
          <button className="p-3 text-slate-600 hover:text-slate-300 transition-colors"><Activity size={22} /></button>
          <button className="p-3 text-slate-600 hover:text-slate-300 transition-colors"><History size={22} /></button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-slate-800/40 flex items-center justify-between px-10 bg-[#0d1117]/60 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-3 uppercase">
              Spectral Overlord
              <span className={`text-[10px] ${isStopped ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-400'} px-2 py-0.5 rounded-full border ${isStopped ? 'border-rose-500/20' : 'border-emerald-500/20'} animate-pulse`}>
                {isStopped ? 'HALTED' : 'Institutional AI'}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={handleEmergencyStop} disabled={isLoadingStop} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${isStopped ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
                {isLoadingStop ? <RefreshCcw className="animate-spin" size={16} /> : (isStopped ? <Power size={16} /> : <PowerOff size={16} />)}
                {isStopped ? 'Re-Activate' : 'Kill Switch'}
            </button>
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${isCloudLinked ? 'border-emerald-500/20 text-emerald-400' : 'border-rose-500/20 text-rose-400'}`}>
               <span className="text-[11px] font-bold uppercase tracking-widest">{isCloudLinked ? 'Connected' : 'Sync Error'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-3xl border-slate-800/30">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Total Balance</p>
                <p className="text-2xl font-black mono text-white">€{totalBalanceEUR.toLocaleString()}</p>
            </div>
            <div className="glass p-6 rounded-3xl border-cyan-500/30 bg-cyan-500/[0.05]">
                <p className="text-[10px] uppercase font-bold text-cyan-500 mb-2 tracking-widest">Cash (EUR)</p>
                <p className="text-2xl font-black mono text-cyan-400">€{eurCashBalance.toLocaleString()}</p>
            </div>
            <div className="glass p-6 rounded-3xl border-slate-800/30">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Net P&L</p>
                <p className={`text-2xl font-black mono ${totalHoldingsPNL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    €{totalHoldingsPNL.toFixed(2)}
                </p>
            </div>
            <div className="glass p-6 rounded-3xl border-slate-800/30">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Active Signals</p>
                <p className="text-2xl font-black mono text-violet-400">{signals.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <div className="glass rounded-[2rem] overflow-hidden border-slate-800/30">
                <div className="px-8 py-6 border-b border-slate-800/40 bg-[#0d1117]/40">
                    <h3 className="text-xs font-bold uppercase text-white tracking-[0.2em] flex items-center gap-3">
                        <Target size={14} className="text-violet-500" /> AI Market Signals
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {signals.map((sig, idx) => (
                    <div key={idx} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 hover:border-violet-500/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-lg font-black text-white">{sig.symbol}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sig.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {sig.action}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-3">{sig.reasoning}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500" style={{ width: `${sig.confidence}%` }}></div>
                        </div>
                        <span className="text-[10px] mono text-violet-400 font-bold">{sig.confidence}%</span>
                      </div>
                    </div>
                  ))}
                  {signals.length === 0 && <div className="col-span-3 text-center py-10 text-slate-600 italic">No signals detected by Gemini...</div>}
                </div>
              </div>

              <div className="glass rounded-[2rem] overflow-hidden border-slate-800/30">
                <div className="px-8 py-6 border-b border-slate-800/40 bg-[#0d1117]/40 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase text-white tracking-[0.2em] flex items-center gap-3">
                        <Coins size={14} className="text-emerald-500" /> Live Assets
                    </h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-[#0d1117]/20">
                      <tr className="text-slate-500 text-[9px] uppercase font-bold tracking-[0.2em]">
                          <th className="px-8 py-5">Asset</th>
                          <th className="px-6 py-5 text-center">Price</th>
                          <th className="px-6 py-5 text-right">Balance</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/20">
                      {portfolio.map((a, i) => (
                        <tr key={i} className="hover:bg-emerald-500/[0.02] transition-colors">
                            <td className="px-8 py-5">
                                <span className="text-sm font-bold text-white uppercase">{a.symbol}</span>
                            </td>
                            <td className="px-6 py-5 text-center font-mono text-[11px] text-slate-400">
                                €{a.currentPrice.toLocaleString()}
                            </td>
                            <td className="px-6 py-5 text-right font-mono text-sm text-emerald-400 font-bold">
                                {a.balance.toFixed(6)}
                            </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="xl:col-span-4 space-y-8">
              <BotLog logs={logs} />
              <div className="glass p-8 rounded-[2rem] border-slate-800/30">
                <h3 className="text-xs font-bold uppercase text-white mb-6 flex items-center gap-2 tracking-[0.2em]">
                    <History size={14} className="text-amber-500" /> Recent Activity
                </h3>
                <div className="space-y-4">
                  {trades.length > 0 ? trades.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-mono p-2 border-b border-slate-800/30">
                      <span className={t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{t.side}</span>
                      <span className="text-white">{t.amount} {t.symbol}</span>
                      <span className="text-slate-500">{t.status}</span>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-slate-600 italic text-[10px]">No recent transfers/trades found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
