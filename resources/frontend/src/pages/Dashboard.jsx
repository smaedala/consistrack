import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  User,
  ChevronDown,
  Bell,
  Search,
  Download,
  LogOut,
} from 'lucide-react';

const START_BALANCE = 100000;
const DEFAULT_PROFIT_TARGET = 10000;

const MOCK_TRADES = [
  { id: 1, symbol: 'EUR/USD', type: 'BUY', lotSize: 0.5, pnl: 450.25, close_time: '2026-03-10T10:00:00Z', strategy_tag: 'Silver Bullet' },
  { id: 2, symbol: 'GBP/USD', type: 'SELL', lotSize: 0.3, pnl: -120.5, close_time: '2026-03-11T11:20:00Z', strategy_tag: 'Judas Swing' },
  { id: 3, symbol: 'USD/JPY', type: 'BUY', lotSize: 1.0, pnl: 680, close_time: '2026-03-12T13:15:00Z', strategy_tag: 'London Open' },
  { id: 4, symbol: 'AUD/USD', type: 'SELL', lotSize: 0.2, pnl: 215.75, close_time: '2026-03-13T08:00:00Z', strategy_tag: 'ICT Core' },
  { id: 5, symbol: 'EUR/GBP', type: 'BUY', lotSize: 0.4, pnl: -95.3, close_time: '2026-03-14T09:40:00Z', strategy_tag: 'Silver Bullet' },
  { id: 6, symbol: 'USD/CHF', type: 'BUY', lotSize: 0.6, pnl: 340.6, close_time: '2026-03-15T16:35:00Z', strategy_tag: 'London Open' },
  { id: 7, symbol: 'NZD/USD', type: 'SELL', lotSize: 0.3, pnl: 185.2, close_time: '2026-03-16T12:10:00Z', strategy_tag: 'Judas Swing' },
  { id: 8, symbol: 'EUR/JPY', type: 'BUY', lotSize: 0.5, pnl: 520.4, close_time: '2026-03-17T14:55:00Z', strategy_tag: 'ICT Core' },
];

const formatMoney = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(val || 0));

const clamp = (num, min, max) => Math.min(max, Math.max(min, num));

function normalizeTrades(items) {
  if (!Array.isArray(items)) return [];
  return items.map((t, idx) => ({
    id: t.id ?? idx + 1,
    symbol: t.symbol || 'N/A',
    type: String(t.type || 'BUY').toUpperCase(),
    lotSize: Number(t.lot_size ?? t.lotSize ?? 0.1),
    pnl: Number(t.pnl || 0),
    close_time: t.close_time || new Date().toISOString(),
    strategy_tag: t.strategy_tag || 'General',
  }));
}

function buildCalendarDays() {
  const days = [];
  const monthPnL = [450, -120, 680, 215, -95, 340, 185, 520, 280, -75, 410, 195, -165, 525, 310, 445, -88, 390, 265, 510, -145, 375, 420, 485, -92, 355, 490, 0, 0, 0];

  for (let i = 0; i < 4; i += 1) {
    days.push({ day: 28 + i, pnl: 0, trades: 0, current: false });
  }

  for (let i = 1; i <= 30; i += 1) {
    const pnl = monthPnL[i - 1];
    days.push({
      day: i,
      pnl,
      trades: pnl === 0 ? 0 : (i % 6) + 2,
      current: true,
    });
  }

  return days;
}

function equitySeries(initialBalance, trades) {
  const base = initialBalance || START_BALANCE;
  const points = [{ label: 'Day 1', value: base }];
  let running = base;

  const active = trades.length > 0 ? trades.slice(-30) : MOCK_TRADES;
  active.forEach((trade, index) => {
    running += Number(trade.pnl || 0);
    points.push({ label: `Day ${index + 2}`, value: running, trade });
  });

  while (points.length < 30) {
    running += (Math.random() - 0.35) * 180;
    points.push({ label: `Day ${points.length + 1}`, value: running });
  }

  return points;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState(null);
  const [trades, setTrades] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [symbolFilter, setSymbolFilter] = useState('All Symbols');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const accountsRes = await axios.get('/accounts');
        const account = accountsRes.data?.data?.[0] || null;
        setActiveAccount(account);

        if (!account) {
          setTrades(normalizeTrades(MOCK_TRADES));
          setMetrics(null);
          return;
        }

        const [tradesRes, metricsRes] = await Promise.all([
          axios.get(`/accounts/${account.id}/trades`),
          axios.get(`/accounts/${account.id}/metrics`),
        ]);

        const incomingTrades = tradesRes.data?.data?.data || tradesRes.data?.data || [];
        setTrades(normalizeTrades(incomingTrades));
        setMetrics(metricsRes.data?.data || null);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
          return;
        }
        setError(err.response?.data?.message || 'Live data unavailable. Showing dashboard preview data.');
        setActiveAccount(null);
        setTrades(normalizeTrades(MOCK_TRADES));
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const data = useMemo(() => {
    const initialBalance = Number(activeAccount?.initial_balance || START_BALANCE);
    const target = Number(activeAccount?.profit_target || DEFAULT_PROFIT_TARGET);
    const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
    const currentBalance = Number(metrics?.currentBalance || initialBalance + totalPnl);

    const dailyLossRemaining = Number(metrics?.dailyLossRemaining || Math.max(initialBalance * 0.05 - Math.max(0, -totalPnl), 0));
    const dailyDrawdownPct = Number(metrics?.dailyDrawdownPercent || (totalPnl < 0 ? (Math.abs(totalPnl) / initialBalance) * 100 : 0.01));

    const positiveDays = {};
    trades.forEach((t) => {
      const day = String(t.close_time).slice(0, 10);
      positiveDays[day] = (positiveDays[day] || 0) + Math.max(0, Number(t.pnl || 0));
    });

    const bestDay = Math.max(...Object.values(positiveDays), 0);
    const totalPositive = Object.values(positiveDays).reduce((a, b) => a + b, 0);
    const consistencyPct = Number(metrics?.topDailyPercentOfTarget || (totalPositive ? (bestDay / totalPositive) * 100 : 18));

    const targetProgressValue = currentBalance - initialBalance;
    const targetProgressPct = clamp((targetProgressValue / Math.max(target, 1)) * 100, 0, 100);

    const wins = trades.filter((t) => t.pnl > 0).length;
    const winRate = clamp((wins / Math.max(trades.length, 1)) * 100, 0, 100);

    return {
      initialBalance,
      target,
      totalPnl,
      currentBalance,
      dailyLossRemaining,
      dailyDrawdownPct,
      consistencyPct,
      targetProgressValue,
      targetProgressPct,
      winRate,
      equity: equitySeries(initialBalance, trades),
    };
  }, [activeAccount, trades, metrics]);

  const filteredTrades = useMemo(() => {
    if (symbolFilter === 'All Symbols') return trades;
    return trades.filter((t) => t.symbol === symbolFilter);
  }, [symbolFilter, trades]);

  const symbols = useMemo(() => ['All Symbols', ...new Set(trades.map((t) => t.symbol))], [trades]);

  const accountLabel = activeAccount?.account_name || 'FTMO 100k - Active';
  const userName = activeAccount?.user?.name || 'Alex';

  const consistencyStatus = data.consistencyPct < 30 ? 'Safe' : data.consistencyPct < 40 ? 'Warning' : 'Danger';

  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', action: () => navigate('/dashboard') },
    { key: 'trade', icon: FileText, label: 'Trade Log', action: () => navigate('/trade-log') },
    { key: 'analytics', icon: BarChart3, label: 'Analytics', action: () => navigate('/dashboard') },
    { key: 'risk', icon: Settings, label: 'Risk Settings', action: () => navigate('/risk-settings') },
  ];

  const signOut = () => {
    localStorage.removeItem('api_token');
    delete axios.defaults.headers.common.Authorization;
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="ctdash-loading">
        <div className="ctdash-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="ctdash-shell">
      <aside className={`ctdash-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="ctdash-brand">CT</div>
        <div className="ctdash-nav">
          {navItems.map((item, idx) => (
            <button key={item.key} className={`ctdash-nav-btn ${idx === 0 ? 'active' : ''}`} onClick={item.action} title={item.label}>
              <item.icon size={18} />
            </button>
          ))}
        </div>
        <button className="ctdash-nav-btn ctdash-user-btn" title="User">
          <User size={18} />
        </button>
      </aside>

      <main className="ctdash-main">
        <header className="ctdash-header">
          <div className="ctdash-header-left">
            <button className="ctdash-menu-btn" onClick={() => setMobileOpen((v) => !v)}>☰</button>
            <h1>Welcome back, {userName}</h1>
          </div>
          <div className="ctdash-header-right">
            <button className="ctdash-pill">{accountLabel} <ChevronDown size={14} /></button>
            <span className="ctdash-pill ctdash-pill-live">Daily Loss Remaining: {formatMoney(data.dailyLossRemaining)}</span>
            <span className="ctdash-pill">Days Remaining: 29d 0h</span>
            <button className="ctdash-pill ctdash-pill-danger" onClick={signOut}>Logout</button>
          </div>
        </header>

        <section className="ctdash-content">
          {error ? <div className="ctdash-alert">{error}</div> : null}

          <div className="ctdash-filters">
            <div>
              <h2>Trading Dashboard</h2>
              <p>Monitor your trading performance and risk metrics</p>
            </div>
            <div className="ctdash-filter-actions">
              <div className="ctdash-input-wrap">
                <Search size={15} />
                <input placeholder="Search symbol..." />
              </div>
              <select value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)}>
                {symbols.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button className="ctdash-export-btn"><Download size={15} /> Export</button>
            </div>
          </div>

          <div className="ctdash-grid ctdash-grid-4">
            <StatCard title="Account Equity" value={formatMoney(data.currentBalance)} subtitle={`Initial: ${formatMoney(data.initialBalance)}`} />
            <StatCard
              title="Daily Loss Remaining"
              value={formatMoney(data.dailyLossRemaining)}
              subtitle="5% Max Daily"
              progress={{ pct: clamp((data.dailyLossRemaining / Math.max(data.initialBalance * 0.05, 1)) * 100, 0, 100), color: '#ef4444' }}
            />
            <StatCard
              title="Profit Target Progress"
              value={`${formatMoney(data.targetProgressValue)} / ${formatMoney(data.target)}`}
              subtitle={`${Math.round(data.targetProgressPct)}% Complete`}
              progress={{ pct: data.targetProgressPct, color: '#00F2FE' }}
            />
            <StatCard
              title="Consistency Score"
              value={`${consistencyStatus} (${data.consistencyPct.toFixed(1)}%)`}
              subtitle="Max Day vs Total"
              status={{
                label: consistencyStatus,
                color: consistencyStatus === 'Safe' ? '#10B981' : consistencyStatus === 'Warning' ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>

          <div className="ctdash-grid ctdash-grid-4 mini">
            <MiniMetric label="Win Rate" value={`${data.winRate.toFixed(1)}%`} change="+2.3%" positive />
            <MiniMetric label="Risk/Reward" value="1:2.4" change="+0.2" positive />
            <MiniMetric label="Profit Factor" value="2.18" change="+0.15" positive />
            <MiniMetric label="Total Trades" value={String(trades.length)} change={`+${Math.max(trades.length - 5, 0)}`} positive />
          </div>

          <div className="ctdash-grid ctdash-main-row">
            <section className="ctdash-card ctdash-chart-card">
              <div className="ctdash-card-head">
                <h3>Equity Curve</h3>
                <span>Last 30 days</span>
              </div>
              <EquitySvgChart points={data.equity} />
            </section>

            <section className="ctdash-card">
              <h3>Consistency Meter</h3>
              <p className="muted">Max Day vs Total Profit (40% Rule)</p>
              <div className="ctdash-ring-wrap">
                <div className="ctdash-ring" style={{ '--value': `${clamp(data.consistencyPct, 0, 100)}` }}>
                  <div>
                    <strong>{data.consistencyPct.toFixed(1)}%</strong>
                    <span>of Total</span>
                  </div>
                </div>
              </div>
              <div className="ctdash-status-line">
                <span className={`dot ${consistencyStatus.toLowerCase()}`} />
                <span>{consistencyStatus}</span>
              </div>
              <div className="ctdash-threshold">
                <span>Danger Threshold</span>
                <strong>40%</strong>
              </div>
            </section>

            <section className="ctdash-card">
              <h3>Quick Statistics</h3>
              <QuickStat label="Average Win" value="$125.40" trend="+8.2%" good />
              <QuickStat label="Average Loss" value="$88.20" trend="-3.1%" bad />
              <QuickStat label="Largest Win" value="$680.00" trend="EUR/USD" good />
              <QuickStat label="Largest Loss" value="$120.50" trend="GBP/USD" bad />
              <QuickStat label="Best Day" value="$1,245.80" trend="Monday" good />
              <QuickStat label="Max Drawdown" value="$850.00" trend="-0.85%" bad />
            </section>
          </div>

          <div className="ctdash-grid ctdash-grid-2">
            <section className="ctdash-card">
              <h3>Win/Loss Distribution</h3>
              <SimpleBarChart
                rows={[
                  { label: 'Mon', wins: 12, losses: 3 },
                  { label: 'Tue', wins: 8, losses: 5 },
                  { label: 'Wed', wins: 15, losses: 2 },
                  { label: 'Thu', wins: 10, losses: 6 },
                  { label: 'Fri', wins: 14, losses: 4 },
                ]}
              />
            </section>
            <section className="ctdash-card">
              <h3>Performance by Symbol</h3>
              <PerformanceRows />
            </section>
          </div>

          <div className="ctdash-grid ctdash-grid-3">
            <section className="ctdash-card span-2">
              <h3>Recent Trades</h3>
              <div className="ctdash-table-wrap">
                <table className="ctdash-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Lot Size</th>
                      <th>P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.slice(0, 8).map((trade) => (
                      <tr key={trade.id}>
                        <td>{trade.symbol}</td>
                        <td>
                          <span className={`tag ${trade.type === 'BUY' ? 'buy' : 'sell'}`}>{trade.type}</span>
                        </td>
                        <td>{Number(trade.lotSize || 0).toFixed(2)}</td>
                        <td className={trade.pnl >= 0 ? 'good' : 'bad'}>
                          {trade.pnl >= 0 ? '+' : ''}{formatMoney(trade.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="ctdash-card">
              <h3>Trading Activity Calendar</h3>
              <CalendarHeatmap days={buildCalendarDays()} />
            </section>
          </div>
        </section>
      </main>

      <style>{`
        .ctdash-shell { min-height: 100vh; display: grid; grid-template-columns: 64px 1fr; background: #101217; color: #f4f7fb; }
        .ctdash-sidebar { background: #0d0f14; border-right: 1px solid #1e2025; display: flex; flex-direction: column; align-items: center; padding: 16px 8px; gap: 12px; }
        .ctdash-brand { width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(0,242,254,0.35); color: #00f2fe; display: grid; place-items: center; font-weight: 800; }
        .ctdash-nav { display: flex; flex-direction: column; gap: 10px; width: 100%; align-items: center; }
        .ctdash-nav-btn { width: 42px; height: 42px; border-radius: 12px; border: 1px solid #2a2d35; background: #151923; color: #9ca3af; display: grid; place-items: center; cursor: pointer; transition: all .2s; }
        .ctdash-nav-btn:hover, .ctdash-nav-btn.active { color: #00f2fe; border-color: rgba(0,242,254,.45); background: rgba(0,242,254,.1); }
        .ctdash-user-btn { margin-top: auto; }

        .ctdash-main { background: radial-gradient(800px 420px at 10% -10%, rgba(0,242,254,.12), transparent 55%), radial-gradient(660px 340px at 95% 0, rgba(16,185,129,.10), transparent 52%), #101217; }
        .ctdash-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px solid #1e2025; padding: 10px 18px; background: rgba(13,15,20,.85); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 40; }
        .ctdash-header-left { display: flex; align-items: center; gap: 12px; }
        .ctdash-header-left h1 { margin: 0; font-size: 38px; font-weight: 700; letter-spacing: -0.02em; }
        .ctdash-menu-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #2a2d35; background: #1e2025; color: #d9dee9; display: none; }
        .ctdash-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
        .ctdash-pill { height: 36px; border-radius: 999px; border: 1px solid #2a2d35; background: #1e2025; color: #f4f7fb; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
        .ctdash-pill-live { color: #10b981; border-color: rgba(16,185,129,.35); background: rgba(16,185,129,.08); }
        .ctdash-pill-danger { color: #ef4444; border-color: rgba(239,68,68,.35); background: rgba(239,68,68,.08); cursor: pointer; }

        .ctdash-content { padding: 18px; display: grid; gap: 14px; }
        .ctdash-alert { border: 1px solid rgba(245,158,11,.5); background: rgba(245,158,11,.1); color: #fcd34d; padding: 10px 12px; border-radius: 10px; }

        .ctdash-filters { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: end; }
        .ctdash-filters h2 { margin: 0; font-size: 24px; }
        .ctdash-filters p { margin: 4px 0 0; color: #9ca3af; font-size: 14px; }
        .ctdash-filter-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .ctdash-input-wrap { height: 36px; min-width: 220px; border-radius: 10px; border: 1px solid #2a2d35; background: #1e2025; display: flex; align-items: center; gap: 8px; padding: 0 10px; color: #9ca3af; }
        .ctdash-input-wrap input { border: 0; outline: 0; background: transparent; color: #f4f7fb; width: 100%; }
        .ctdash-filter-actions select { height: 36px; border-radius: 10px; border: 1px solid #2a2d35; background: #1e2025; color: #f4f7fb; padding: 0 10px; }
        .ctdash-export-btn { height: 36px; border-radius: 10px; border: 1px solid #00f2fe; background: #00f2fe; color: #001118; display: inline-flex; gap: 8px; align-items: center; padding: 0 12px; font-weight: 600; }

        .ctdash-grid { display: grid; gap: 14px; }
        .ctdash-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .ctdash-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .ctdash-grid-3 { grid-template-columns: 2fr 1fr 1fr; }
        .ctdash-main-row { grid-template-columns: 2fr 1fr 1fr; }
        .ctdash-grid.mini .ctdash-card { padding: 14px; }

        .ctdash-card { background: #1e2025; border: 1px solid #2a2d35; border-radius: 14px; padding: 18px; }
        .ctdash-card h3 { margin: 0 0 10px; font-size: 28px; }
        .ctdash-card .muted { color: #9ca3af; margin: 0 0 12px; font-size: 14px; }
        .ctdash-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .ctdash-card-head span { color: #9ca3af; font-size: 12px; }

        .stat-title { color: #9ca3af; font-size: 14px; margin-bottom: 8px; }
        .stat-value { display: flex; align-items: center; gap: 10px; font-size: 44px; font-weight: 700; margin-bottom: 8px; line-height: 1; }
        .stat-sub { color: #9ca3af; font-size: 13px; }
        .stat-progress { height: 8px; background: #0d0f14; border-radius: 999px; overflow: hidden; margin-top: 10px; }
        .stat-progress > span { display: block; height: 100%; border-radius: 999px; }
        .status-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
        .status-chip i { width: 8px; height: 8px; border-radius: 999px; display: inline-block; }

        .mini .mini-label { color: #9ca3af; font-size: 13px; margin-bottom: 4px; }
        .mini .mini-value { font-size: 26px; font-weight: 700; }
        .mini .mini-change { font-size: 12px; margin-top: 2px; }

        .ctdash-chart-card svg { width: 100%; height: 320px; border-radius: 10px; background: #121722; }

        .ctdash-ring-wrap { display: flex; justify-content: center; margin: 8px 0 14px; }
        .ctdash-ring { --value: 0; width: 180px; height: 180px; border-radius: 50%; background: conic-gradient(#10b981 calc(var(--value) * 1%), #2a2d35 0); display: grid; place-items: center; }
        .ctdash-ring > div { width: 140px; height: 140px; border-radius: 50%; background: #151922; display: grid; place-items: center; text-align: center; }
        .ctdash-ring strong { font-size: 34px; display: block; }
        .ctdash-ring span { font-size: 12px; color: #9ca3af; }
        .ctdash-status-line { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px; }
        .ctdash-status-line .dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; }
        .ctdash-status-line .dot.safe { background: #10b981; }
        .ctdash-status-line .dot.warning { background: #f59e0b; }
        .ctdash-status-line .dot.danger { background: #ef4444; }
        .ctdash-threshold { border: 1px solid #2a2d35; background: #10151f; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; }
        .ctdash-threshold span { color: #9ca3af; font-size: 13px; }
        .ctdash-threshold strong { color: #ef4444; }

        .quick-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid #2a2d35; }
        .quick-row:last-child { border-bottom: 0; }
        .quick-row .left { color: #9ca3af; font-size: 13px; }
        .quick-row .right { display: flex; gap: 8px; align-items: center; }
        .quick-row .val { font-size: 13px; font-weight: 600; }
        .good { color: #10b981; }
        .bad { color: #ef4444; }

        .wl-row { display: grid; grid-template-columns: 56px 1fr; gap: 10px; align-items: center; margin: 10px 0; }
        .wl-bars { display: grid; gap: 6px; }
        .wl-bar { height: 10px; border-radius: 999px; background: #111722; overflow: hidden; }
        .wl-bar > span { display: block; height: 100%; border-radius: 999px; }

        .symbol-row { border: 1px solid #2a2d35; border-radius: 10px; padding: 10px; margin-bottom: 10px; background: #151922; }
        .symbol-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .symbol-badge { font-size: 11px; border-radius: 999px; padding: 3px 8px; background: rgba(16,185,129,.2); color: #10b981; }
        .symbol-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .symbol-grid p { margin: 0; font-size: 11px; color: #9ca3af; }
        .symbol-grid strong { font-size: 13px; }

        .ctdash-table-wrap { overflow: auto; }
        .ctdash-table { width: 100%; border-collapse: collapse; }
        .ctdash-table th, .ctdash-table td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #2a2d35; font-size: 14px; }
        .ctdash-table th { color: #9ca3af; font-weight: 500; font-size: 13px; }
        .ctdash-table td:nth-child(3), .ctdash-table th:nth-child(3), .ctdash-table td:nth-child(4), .ctdash-table th:nth-child(4) { text-align: right; }
        .tag { font-size: 11px; padding: 4px 8px; border-radius: 8px; font-weight: 700; }
        .tag.buy { background: rgba(16,185,129,.16); color: #10b981; }
        .tag.sell { background: rgba(239,68,68,.16); color: #ef4444; }

        .heat-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
        .heat-cell { aspect-ratio: 1; border-radius: 8px; font-size: 11px; display: grid; place-items: center; color: #fff; position: relative; }
        .heat-cell.inactive { background: #161b25; color: #64748b; }

        .ctdash-loading { min-height: 100vh; display: grid; place-items: center; background: #101217; color: #dce7f9; }
        .ctdash-loading > div, .ctdash-loading p { margin: 0; }
        .ctdash-spinner { width: 44px; height: 44px; border: 4px solid rgba(0,242,254,.2); border-top-color: #00f2fe; border-radius: 999px; animation: spin 1s linear infinite; margin: 0 auto 10px; }

        .span-2 { grid-column: span 2; }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1280px) {
          .ctdash-header-left h1 { font-size: 30px; }
          .ctdash-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ctdash-main-row { grid-template-columns: 1fr; }
          .ctdash-grid-3 { grid-template-columns: 1fr; }
          .span-2 { grid-column: auto; }
        }

        @media (max-width: 900px) {
          .ctdash-shell { grid-template-columns: 1fr; }
          .ctdash-sidebar { position: fixed; left: -84px; top: 0; bottom: 0; z-index: 60; transition: left .2s ease; }
          .ctdash-sidebar.open { left: 0; }
          .ctdash-menu-btn { display: inline-grid; place-items: center; }
          .ctdash-header { padding: 10px 12px; }
          .ctdash-header-left h1 { font-size: 22px; }
          .ctdash-header-right { gap: 6px; }
          .ctdash-pill { height: 32px; font-size: 12px; padding: 0 10px; }
          .ctdash-content { padding: 12px; }
          .ctdash-grid-4, .ctdash-grid-2 { grid-template-columns: 1fr; }
          .ctdash-filters { align-items: stretch; }
          .ctdash-filter-actions { width: 100%; }
          .ctdash-input-wrap { min-width: 0; flex: 1; }
          .ctdash-card h3 { font-size: 22px; }
          .stat-value { font-size: 32px; }
        }
      `}</style>
    </div>
  );
};

function StatCard({ title, value, subtitle, progress, status }) {
  return (
    <div className="ctdash-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">
        <span>{value}</span>
        {status ? (
          <span className="status-chip" style={{ color: status.color }}>
            <i style={{ backgroundColor: status.color }} />
            {status.label}
          </span>
        ) : null}
      </div>
      {subtitle ? <div className="stat-sub">{subtitle}</div> : null}
      {progress ? (
        <div className="stat-progress">
          <span style={{ width: `${clamp(progress.pct, 0, 100)}%`, backgroundColor: progress.color }} />
        </div>
      ) : null}
    </div>
  );
}

function MiniMetric({ label, value, change, positive }) {
  return (
    <div className="ctdash-card mini">
      <div className="mini-label">{label}</div>
      <div className="mini-value">{value}</div>
      <div className={`mini-change ${positive ? 'good' : 'bad'}`}>{change}</div>
    </div>
  );
}

function EquitySvgChart({ points }) {
  const w = 900;
  const h = 320;
  const p = 24;
  const min = Math.min(...points.map((d) => d.value));
  const max = Math.max(...points.map((d) => d.value));
  const range = Math.max(max - min, 1);

  const mapped = points.map((pt, i) => {
    const x = p + (i / Math.max(points.length - 1, 1)) * (w - p * 2);
    const y = h - p - ((pt.value - min) / range) * (h - p * 2);
    return { ...pt, x, y };
  });

  const line = mapped.map((pt) => `${pt.x},${pt.y}`).join(' ');
  const area = `${line} ${w - p},${h - p} ${p},${h - p}`;

  const axisTicks = [0, 1, 2, 3, 4].map((n) => {
    const ratio = n / 4;
    const y = h - p - ratio * (h - p * 2);
    const value = min + ratio * range;
    return { y, label: `$${Math.round(value / 1000)}k` };
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ctdash-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {axisTicks.map((tick, i) => (
        <g key={i}>
          <line x1={p} y1={tick.y} x2={w - p} y2={tick.y} stroke="#2a2d35" strokeDasharray="5 6" />
          <text x={5} y={tick.y + 4} fill="#7f8aa3" fontSize="12">{tick.label}</text>
        </g>
      ))}

      <polygon points={area} fill="url(#ctdash-area)" />
      <polyline points={line} fill="none" stroke="#00F2FE" strokeWidth="3" strokeLinecap="round" />
      {mapped.filter((_, i) => i % 4 === 0).map((pt, idx) => (
        <g key={idx}>
          <circle cx={pt.x} cy={pt.y} r="3.5" fill="#00F2FE" />
          <text x={pt.x - 10} y={h - 6} fill="#7f8aa3" fontSize="12">{`D${idx * 4 + 1}`}</text>
        </g>
      ))}
    </svg>
  );
}

function QuickStat({ label, value, trend, good, bad }) {
  return (
    <div className="quick-row">
      <div className="left">{label}</div>
      <div className="right">
        <span className="val">{value}</span>
        <span className={good ? 'good' : bad ? 'bad' : ''}>{trend}</span>
      </div>
    </div>
  );
}

function SimpleBarChart({ rows }) {
  const max = Math.max(...rows.map((r) => Math.max(r.wins, r.losses)), 1);
  return (
    <div>
      {rows.map((row) => (
        <div key={row.label} className="wl-row">
          <strong>{row.label}</strong>
          <div className="wl-bars">
            <div className="wl-bar"><span style={{ width: `${(row.wins / max) * 100}%`, background: '#10B981' }} /></div>
            <div className="wl-bar"><span style={{ width: `${(row.losses / max) * 100}%`, background: '#EF4444' }} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PerformanceRows() {
  const rows = [
    { symbol: 'EUR/USD', trades: 45, winRate: 68, pnl: 2450.5, avgWin: 125.5, avgLoss: -85.2 },
    { symbol: 'GBP/USD', trades: 32, winRate: 62, pnl: 1820.3, avgWin: 110.3, avgLoss: -92.1 },
    { symbol: 'USD/JPY', trades: 28, winRate: 71, pnl: 1650.8, avgWin: 140.2, avgLoss: -78.5 },
    { symbol: 'AUD/USD', trades: 24, winRate: 58, pnl: 980.4, avgWin: 95.8, avgLoss: -88.6 },
  ];

  return (
    <div>
      {rows.map((item) => (
        <div key={item.symbol} className="symbol-row">
          <div className="symbol-top">
            <strong>{item.symbol}</strong>
            <div className="good">+{formatMoney(item.pnl)}</div>
          </div>
          <div className="symbol-grid">
            <div><p>Win Rate</p><strong>{item.winRate}%</strong></div>
            <div><p>Avg Win</p><strong className="good">{formatMoney(item.avgWin)}</strong></div>
            <div><p>Avg Loss</p><strong className="bad">{formatMoney(item.avgLoss)}</strong></div>
          </div>
          <div className="stat-progress" style={{ marginTop: 8 }}>
            <span style={{ width: `${item.winRate}%`, backgroundColor: '#00F2FE' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarHeatmap({ days }) {
  const color = (pnl, current) => {
    if (!current) return 'inactive';
    if (pnl === 0) return '#1e2433';
    if (pnl > 400) return '#10B981';
    if (pnl > 200) return '#34D399';
    if (pnl > 0) return '#6EE7B7';
    if (pnl > -100) return '#FCA5A5';
    if (pnl > -200) return '#F87171';
    return '#EF4444';
  };

  return (
    <div>
      <div className="heat-grid">
        {days.map((d, i) => (
          <div
            key={`${d.day}-${i}`}
            className={`heat-cell ${!d.current ? 'inactive' : ''}`}
            style={!d.current ? undefined : { background: color(d.pnl, d.current) }}
            title={d.current ? `${d.trades} trades / ${d.pnl >= 0 ? '+' : ''}${formatMoney(d.pnl)}` : 'Other month'}
          >
            {d.day}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
