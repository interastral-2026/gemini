
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, TrendingUp, AlertCircle, Binary, ShieldCheck, Zap, History, Activity, RefreshCcw, Percent, ArrowUpRight, ArrowDownRight, BrainCircuit, Wallet, Coins, Power, PowerOff, BadgeEuro, Banknote
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
      setSignals(signalsData.slice(0, 10));
      setIsStopped(statusData.isEmergencyStopped);
      setIsCloudLinked(true);
    } catch (err) {
      setIsCloudLinked(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyStop = async () => {
    setIsLoadingStop(true);
    const result = await toggleEmergencyStop(!isStopped);
    setIsStopped(result);
    setIsLoadingStop(false);
    addLog(result ? "EMERGENCY STOP PROTOCOL INITIATED" : "SPECTRAL CORE RE-ACTIVATED", result ? "ERROR" : "SUCCESS");
  };

  // --- محاسبات هوش مالی ---
  const totalBalanceEUR = portfolio.reduce((acc, asset) => acc + (asset.balance * asset.currentPrice), 0);
  const eurCashBalance = portfolio.find(a => a.symbol === 'EUR')?.balance || 0;
  
  const totalHoldingsPNL = portfolio.reduce((acc, asset) => {
    if (asset.type === 'CRYPTO' && asset.entryPrice > 0) {
      return acc + ((asset.currentPrice - asset.entryPrice) * asset.balance);
    }
    return acc;
  }, 0);

  const activeCrypto = portfolio.filter(a => a.type === 'CRYPTO' && a.roi !== 0);
  const avgROI = activeCrypto.length > 0
    ? activeCrypto.reduce((acc, a) => acc + a.roi, 0) / activeCrypto.length
    : 0;

  return (
    <div className="min-h-screen flex bg-[#010409] text-slate-300 font-sans selection:bg-emerald-500/30">
      {/* Sidebar */}
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

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 border-b border-slate-800/40 flex items-center justify-between px-10 bg-[#0d1117]/60 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-3 uppercase">
              Spectral Overlord
              <span className={`text-[10px] ${isStopped ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-400'} px-2 py-0.5 rounded-full border ${isStopped ? 'border-rose-500/20' : 'border-emerald-500/20'} animate-pulse`}>
                {isStopped ? 'HALTED' : 'Institutional AI'}
              </span>
            </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-[0.2em] mt-1 uppercase">Dynamic Liquidity Optimization</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
                onClick={handleEmergencyStop}
                disabled={isLoadingStop}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg ${
                    isStopped 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' 
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20'
                }`}
            >
                {isLoadingStop ? <RefreshCcw className="animate-spin" size={16} /> : (isStopped ? <Power size={16} /> : <PowerOff size={16} />)}
                {isStopped ? 'Re-Activate Core' : 'Kill Switch'}
            </button>

            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${isCloudLinked ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
               <div className={`w-2 h-2 rounded-full ${isCloudLinked ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
               <span className="text-[11px] font-bold uppercase tracking-widest font-mono">{isCloudLinked ? 'Live Engine' : 'Sync Error'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar relative">
          {/* بخش آمارهای اصلی */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-3xl border-slate-800/30 hover:border-emerald-500/20 transition-all relative overflow-hidden group">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Total Portfolio</p>
                <p className="text-2xl font-black mono text-white">€{totalBalanceEUR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <div className="absolute right-4 bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet size={48} /></div>
            </div>

            <div className="glass p-6 rounded-3xl border-cyan-500/30 bg-cyan-500/[0.05] hover:border-cyan-500/50 transition-all relative overflow-hidden group ring-1 ring-cyan-500/20">
                <p className="text-[10px] uppercase font-bold text-cyan-500 mb-2 tracking-widest flex items-center gap-2">
                   <BadgeEuro size={12} /> EUR Liquidity (Cash)
                </p>
                <p className="text-2xl font-black mono text-cyan-400">€{eurCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <div className="absolute right-4 bottom-4 opacity-10 group-hover:opacity-20 transition-opacity text-cyan-500"><Banknote size={48} /></div>
            </div>

            <div className="glass p-6 rounded-3xl border-slate-800/30 hover:border-emerald-500/20 transition-all relative overflow-hidden group">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Net P&L (Active Crypto)</p>
                <p className={`text-2xl font-black mono ${totalHoldingsPNL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalHoldingsPNL >= 0 ? '+' : ''}€{totalHoldingsPNL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="absolute right-4 bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={48} /></div>
            </div>

            <div className="glass p-6 rounded-3xl border-slate-800/30 hover:border-emerald-500/20 transition-all relative overflow-hidden group">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Aggregate ROI</p>
                <p className={`text-2xl font-black mono ${avgROI >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {avgROI >= 0 ? '+' : ''}{avgROI.toFixed(2)}%
                </p>
                <div className="absolute right-4 bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><Percent size={48} /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              {/* جدول دارایی‌های کریپتو */}
              <div className="glass rounded-[2rem] overflow-hidden border-slate-800/30">
                <div className="px-8 py-6 border-b border-slate-800/40 bg-[#0d1117]/40">
                    <h3 className="text-xs font-bold uppercase text-white tracking-[0.2em] flex items-center gap-3">
                        <Coins size={14} className="text-emerald-500" /> Active Crypto Assets
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-[#0d1117]/20">
                        <tr className="text-slate-500 text-[9px] uppercase font-bold tracking-[0.2em]">
                            <th className="px-8 py-5">Asset</th>
                            <th className="px-6 py-5 text-center">Entry / Current</th>
                            <th className="px-6 py-5 text-center text-emerald-400">Net P&L (€)</th>
                            <th className="px-6 py-5 text-center">Protocol Targets</th>
                            <th className="px-6 py-5 text-right">ROI (%)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/20">
                        {portfolio.filter(a => a.type === 'CRYPTO').map((a, i) => {
                          const assetPnl = (a.currentPrice - a.entryPrice) * a.balance;
                          return (
                            <tr key={i} className="hover:bg-emerald-500/[0.02] transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-emerald-400 border border-slate-700">{a.symbol[0]}</div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white uppercase">{a.symbol}</span>
                                            <span className="text-[9px] text-slate-500 uppercase">{a.balance.toFixed(6)} Units</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center font-mono text-[11px]">
                                    <div className="flex flex-col">
                                        <span className="text-slate-500">E: €{a.entryPrice.toLocaleString()}</span>
                                        <span className="text-white font-bold">C: €{a.currentPrice.toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className={`px-6 py-5 text-center font-mono text-xs font-bold ${assetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {assetPnl >= 0 ? '+' : ''}€{assetPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-5 text-center font-mono text-[10px]">
                                  <div className="flex flex-col gap-1 items-center">
                                    <span className="text-emerald-500/70 border border-emerald-500/20 px-1.5 rounded">TP: €{a.shadowTP?.toLocaleString()}</span>
                                    <span className="text-rose-500/70 border border-rose-500/20 px-1.5 rounded">SL: €{a.deadZoneSL?.toLocaleString()}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className={`flex items-center justify-end gap-1.5 font-black text-sm ${a.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {a.roi >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {a.roi.toFixed(2)}%
                                    </div>
                                </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    </table>
                </div>
              </div>
            </div>

            {/* سایدبار کنترل */}
            <div className="xl:col-span-4 space-y-8">
              <BotLog logs={logs} />
              <div className="glass p-8 rounded-[2rem] border-slate-800/30">
                <h3 className="text-xs font-bold uppercase text-white mb-6 flex items-center gap-2 tracking-[0.2em]">
                    <ShieldCheck size={14} className="text-violet-500" /> Security Protocol
                </h3>
                <div className="space-y-4 text-[10px] font-mono text-slate-500">
                    <div className="flex justify-between items-center p-2 border-b border-slate-800/40">
                        <span>[OK] Anti-Spoofing Scan</span>
                        <span className="text-emerald-500 font-bold tracking-widest">ON</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border-b border-slate-800/40">
                        <span>[OK] Institutional Wall Tracker</span>
                        <span className="text-emerald-500 font-bold tracking-widest">ON</span>
                    </div>
                    <div className="flex justify-between items-center p-2">
                        <span>[OK] Proxy Layer Sync</span>
                        <span className="text-emerald-500 font-bold tracking-widest">ON</span>
                    </div>
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
