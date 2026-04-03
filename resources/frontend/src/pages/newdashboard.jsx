import React, { useEffect, useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldAlert, 
  Target, 
  Plus, 
  FileUp, 
  LayoutDashboard, 
  History, 
  Settings, 
  Bell, 
  LogOut,
  ChevronRight,
  Info,
  Menu,
  X
} from 'lucide-react';

/**
 * MOCK DATA & CONSTANTS
 */
const START_BALANCE = 100000;
const PROFIT_TARGET = 110000;
const MAX_DRAWDOWN_RULE = 5; 
const CONSISTENCY_RULE = 40; 

const formatMoney = (val) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

const formatPct = (val) => `${(val || 0).toFixed(2)}%`;

const Dashboard = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTradeModal, setShowAddTradeModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load mock data with more points for a better equity curve
  useEffect(() => {
    setTimeout(() => {
      setTrades([
        { id: 1, symbol: 'XAUUSD', type: 'buy', pnl: 1200, close_time: '2024-05-15', strategy_tag: 'Silver Bullet' },
        { id: 2, symbol: 'EURUSD', type: 'sell', pnl: -850, close_time: '2024-05-16', strategy_tag: 'ICT' },
        { id: 3, symbol: 'NAS100', type: 'buy', pnl: 2800, close_time: '2024-05-17', strategy_tag: 'London Open' },
        { id: 4, symbol: 'XAUUSD', type: 'buy', pnl: -450, close_time: '2024-05-18', strategy_tag: 'Silver Bullet' },
        { id: 5, symbol: 'GBPUSD', type: 'buy', pnl: 1900, close_time: '2024-05-19', strategy_tag: 'ICT' },
        { id: 6, symbol: 'NAS100', type: 'sell', pnl: 3100, close_time: '2024-05-20', strategy_tag: 'London Open' },
        { id: 7, symbol: 'XAUUSD', type: 'buy', pnl: -1200, close_time: '2024-05-21', strategy_tag: 'Silver Bullet' },
        { id: 8, symbol: 'EURUSD', type: 'buy', pnl: 1500, close_time: '2024-05-22', strategy_tag: 'ICT' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const stats = useMemo(() => {
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const currentBalance = START_BALANCE + totalPnL;
    const winRate = (trades.filter(t => t.pnl > 0).length / (trades.length || 1)) * 100;
    
    // Consistency Calculation
    const dailyPnL = trades.reduce((acc, t) => {
      const day = t.close_time.split('T')[0];
      acc[day] = (acc[day] || 0) + Math.max(0, t.pnl);
      return acc;
    }, {});
    
    const bestDay = Math.max(...Object.values(dailyPnL), 0);
    const totalPositivePnL = Object.values(dailyPnL).reduce((a, b) => a + b, 0);
    const consistencyScore = totalPositivePnL > 0 ? (bestDay / totalPositivePnL) * 100 : 0;
    
    // Drawdown 
    const drawdownPct = totalPnL < 0 ? (Math.abs(totalPnL) / START_BALANCE) * 100 : 0;

    // Equity Curve Data Points
    let runningBalance = START_BALANCE;
    const equityHistory = trades.map(t => {
      runningBalance += t.pnl;
      return runningBalance;
    });
    
    return {
      totalPnL,
      currentBalance,
      winRate,
      consistencyScore,
      drawdownPct,
      targetProgress: ((currentBalance - START_BALANCE) / (PROFIT_TARGET - START_BALANCE)) * 100,
      equityHistory: [START_BALANCE, ...equityHistory]
    };
  }, [trades]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#020617] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sky-400 font-medium animate-pulse">Syncing Portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-sky-500/30">
      
      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="w-64 border-r border-slate-800/60 bg-[#020617]/50 backdrop-blur-xl flex flex-col hidden lg:flex">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Elite<span className="text-sky-500">Track</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<History size={20}/>} label="Trade Log" active={activeTab === 'log'} onClick={() => setActiveTab('log')} />
          <NavItem icon={<ShieldAlert size={20}/>} label="Risk Rules" active={activeTab === 'risk'} onClick={() => setActiveTab('risk')} />
          <NavItem icon={<Bell size={20}/>} label="Alerts" active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} badge="3" />
          <NavItem icon={<Settings size={20}/>} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 mt-auto">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500" />
              <div>
                <p className="text-sm font-semibold text-white">Alex Trader</p>
                <p className="text-xs text-slate-400">Pro Account</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* MOBILE HEADER */}
        <header className="lg:hidden h-16 border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-md flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-2">
            <Activity className="text-sky-500 w-6 h-6" />
            <span className="font-bold text-white">EliteTrack</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400">
            {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </header>

        {/* TOP NAV / HEADER */}
        <header className="h-20 border-b border-slate-800/60 bg-[#020617]/30 backdrop-blur-md hidden lg:flex items-center justify-between px-8 z-10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Trading Dashboard</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Market Feed Connected
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase">Balance:</span>
              <span className="text-sm font-mono font-bold text-emerald-400">{formatMoney(stats.currentBalance)}</span>
            </div>
            <button 
              onClick={() => setShowAddTradeModal(true)}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-600/20 transition-all active:scale-95"
            >
              <Plus size={18} /> New Trade
            </button>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          
          {/* STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <StatCard 
              label="Account Balance" 
              value={formatMoney(stats.currentBalance)} 
              subValue={`${stats.totalPnL >= 0 ? '+' : ''}${formatMoney(stats.totalPnL)}`}
              trend={stats.totalPnL >= 0 ? 'up' : 'down'}
              icon={<TrendingUp className="text-sky-400"/>}
            />
            <StatCard 
              label="Equity Drawdown" 
              value={formatPct(stats.drawdownPct)} 
              subValue="Max Limit: 5.00%"
              trend={stats.drawdownPct > 4 ? 'down' : 'neutral'}
              icon={<ShieldAlert className={stats.drawdownPct > 4 ? 'text-rose-500' : 'text-emerald-400'}/>}
            />
            <StatCard 
              label="Win Rate" 
              value={formatPct(stats.winRate)} 
              subValue={`${trades.length} Total Trades`}
              trend="neutral"
              icon={<Target className="text-violet-400"/>}
            />
            <StatCard 
              label="Daily Consistency" 
              value={formatPct(stats.consistencyScore)} 
              subValue="Rule: < 40%"
              trend={stats.consistencyScore > 40 ? 'down' : 'up'}
              icon={<Activity className={stats.consistencyScore > 40 ? 'text-amber-500' : 'text-sky-400'}/>}
            />
          </div>

          {/* CHALLENGE PROGRESS (WIDE) */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 lg:p-8 backdrop-blur-sm mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Challenge Progress</h2>
                <p className="text-sm text-slate-400">Phase 1 Target: $110,000.00</p>
              </div>
              <div className="text-left md:text-right">
                <span className="text-3xl font-black text-sky-400">{Math.max(0, Math.round(stats.targetProgress))}%</span>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Completion</p>
              </div>
            </div>
            
            <div className="relative h-5 bg-slate-800/50 rounded-full overflow-hidden mb-4 p-1 border border-slate-700/30">
              <div 
                className="absolute top-1 left-1 h-[calc(100%-8px)] bg-gradient-to-r from-sky-600 via-sky-400 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                style={{ width: `${Math.min(100, Math.max(0, stats.targetProgress))}%` }}
              />
            </div>
            
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Equity: {formatMoney(stats.currentBalance)}</span>
              <span>Target: {formatMoney(PROFIT_TARGET)}</span>
            </div>
          </div>

          {/* NEW ROW: EQUITY CURVE + CONSISTENCY METER */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            
            {/* Equity Curve Graph */}
            <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Equity Curve</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Performance over time</p>
                </div>
                <div className="flex gap-2">
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-400">EQUITY</span>
                   </div>
                </div>
              </div>
              
              <div className="h-64 w-full relative pt-4">
                <EquityChart data={stats.equityHistory} />
                {/* Horizontal Baseline */}
                <div className="absolute top-[50%] left-0 w-full h-[1px] border-t border-slate-800/50 border-dashed" />
              </div>
              
              <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-500 uppercase">
                <span>Start</span>
                <span>Last 8 Trades</span>
                <span>Current</span>
              </div>
            </div>

            {/* Radial Consistency Meter */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 backdrop-blur-sm flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2">Consistency Meter</h3>
              <p className="text-xs text-slate-500 font-medium mb-6 uppercase tracking-widest">Rule Limit: 40% Max Day</p>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <RadialGauge value={stats.consistencyScore} max={100} />
                
                <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                  <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-700/30 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</p>
                    <p className={`text-sm font-black ${stats.consistencyScore > 40 ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {stats.consistencyScore > 40 ? 'BREACHED' : 'HEALTHY'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-700/30 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Max Day</p>
                    <p className="text-sm font-black text-white">{formatPct(stats.consistencyScore)}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* LOWER GRID: RECENT TRADES */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800/60 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Execution Log</h3>
              <button className="text-sky-400 text-sm font-semibold hover:underline flex items-center gap-1">
                Explore All <ChevronRight size={14}/>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                    <th className="px-6 py-4">Symbol</th>
                    <th className="px-6 py-4">Position</th>
                    <th className="px-6 py-4">Closed At</th>
                    <th className="px-6 py-4 text-right">Profit / Loss</th>
                    <th className="px-6 py-4">System</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-white">{trade.symbol}</td>
                      <td className="px-6 py-4 uppercase text-[10px] font-black">
                        <span className={trade.type === 'buy' ? 'text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20'}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{trade.close_time}</td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{formatMoney(trade.pnl)}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{trade.strategy_tag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MOBILE OVERLAY MENU */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-3/4 bg-slate-900 shadow-2xl p-8 border-l border-slate-800">
              <div className="flex justify-between items-center mb-12">
                 <span className="font-bold text-white text-xl">Menu</span>
                 <button onClick={() => setIsMobileMenuOpen(false)}><X size={24}/></button>
              </div>
              <nav className="space-y-4">
                <MobileNavItem icon={<LayoutDashboard/>} label="Dashboard" active />
                <MobileNavItem icon={<History/>} label="Trade Log" />
                <MobileNavItem icon={<ShieldAlert/>} label="Risk Settings" />
                <MobileNavItem icon={<Bell/>} label="Alerts" />
                <div className="pt-8 border-t border-slate-800 mt-8">
                  <button className="flex items-center gap-3 text-rose-400 font-bold">
                    <LogOut size={20}/> Logout
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        .animate-draw {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

/* --- VISUAL COMPONENTS --- */

const EquityChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const viewWidth = 800;
  const viewHeight = 200;
  const padding = 12; // keep points away from exact edge to avoid clipping

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  // add tiny epsilon so range is never zero
  const range = Math.max(1e-6, maxVal - minVal);

  const pointsArr = data.map((val, i) => {
    const denom = Math.max(1, data.length - 1);
    const x = padding + (i / denom) * (viewWidth - padding * 2);
    const y = viewHeight - ((val - minVal) / range) * viewHeight;
    return `${x},${y}`;
  });

  const points = pointsArr.join(' ');
  const areaPoints = `${points} ${viewWidth - padding},${viewHeight} ${padding},${viewHeight}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#areaGradient)" />
      <polyline
        points={points}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-draw"
      />
      {/* Dynamic Points */}
      {pointsArr.map((pt, i) => {
        const [xStr, yStr] = pt.split(',');
        const x = Number(xStr);
        const y = Number(yStr);
        return (
          <circle key={i} cx={x} cy={y} r="4" fill="#020617" stroke="#0ea5e9" strokeWidth="2" className="hover:r-6 cursor-pointer" />
        );
      })}
    </svg>
  );
};

const RadialGauge = ({ value, max }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const strokeDashoffset = circumference - (percentage * circumference);
  
  // Color logic
  const color = value > 40 ? '#f43f5e' : value > 30 ? '#f59e0b' : '#0ea5e9';

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-48 h-48 rotate-[-90deg]">
        {/* Background track */}
        <circle 
          cx="96" cy="96" r={radius} 
          fill="transparent" 
          stroke="#1e293b" 
          strokeWidth="12" 
        />
        {/* Progress track */}
        <circle 
          cx="96" cy="96" r={radius} 
          fill="transparent" 
          stroke={color} 
          strokeWidth="12" 
          strokeDasharray={circumference} 
          style={{ 
            strokeDashoffset, 
            transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease' 
          }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-white">{Math.round(value)}%</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consistency</span>
      </div>
    </div>
  );
};

/* --- NAV COMPONENTS --- */

const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
      active ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-lg shadow-sky-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={`${active ? 'text-sky-400' : 'group-hover:text-sky-400'}`}>{icon}</span>
      <span className="font-semibold text-sm">{label}</span>
    </div>
    {badge && (
      <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[18px] text-center">
        {badge}
      </span>
    )}
  </button>
);

const MobileNavItem = ({ icon, label, active }) => (
  <button className={`w-full flex items-center gap-4 p-4 rounded-2xl ${active ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400'}`}>
    {icon}
    <span className="font-bold text-lg">{label}</span>
  </button>
);

const StatCard = ({ label, value, subValue, trend, icon }) => (
  <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 backdrop-blur-sm group hover:border-sky-500/30 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-800/50 rounded-2xl group-hover:bg-sky-500/10 transition-colors">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
        trend === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 
        trend === 'down' ? 'text-rose-400 bg-rose-500/10' : 
        'text-slate-400 bg-slate-800'
      }`}>
        {trend.toUpperCase()}
      </div>
    </div>
    <div>
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</h4>
      <p className="text-xl lg:text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{subValue}</p>
    </div>
  </div>
);

export default Dashboard;