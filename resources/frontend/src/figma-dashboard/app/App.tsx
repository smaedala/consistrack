import { useEffect, useState } from 'react';
import axios from 'axios';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { EquityCurveChart } from './components/EquityCurveChart';
import { ConsistencyMeter } from './components/ConsistencyMeter';
import { RecentTrades } from './components/RecentTrades';
import { FilterBar } from './components/FilterBar';
import { TradingMetrics } from './components/TradingMetrics';
import { WinLossDistribution } from './components/WinLossDistribution';
import { PerformanceBySymbol } from './components/PerformanceBySymbol';
import { QuickStats } from './components/QuickStats';
import { TradingCalendar } from './components/TradingCalendar';
import { AddTradeModal } from './components/AddTradeModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { ImportTradesModal } from './components/ImportTradesModal';
import { ToastStack } from './components/ToastStack';
import { ActivityFeed } from './components/ActivityFeed';

type DashboardMetrics = {
  currentBalance?: number;
  profitTarget?: number;
  totalPnL?: number;
  topDailyPercentOfTarget?: number;
  dailyDrawdownPercent?: number;
  status?: string;
};

type EquityPoint = {
  day: string;
  equity: number;
};

type SymbolRow = {
  symbol: string;
  trades: number;
  win_rate: number;
  pnl: number;
  avg_win: number;
  avg_loss: number;
};

type WinLossPoint = {
  day: string;
  wins: number;
  losses: number;
};

type AccountItem = {
  id: number;
  account_name: string;
  status?: string;
  initial_balance?: number;
  consistency_rule_percent?: number;
};

type LatestImport = {
  batchUuid: string;
  importedCount: number;
  importedAt: string | null;
  status: string;
} | null;

function Dashboard() {
  const { theme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [accountName, setAccountName] = useState<string>('No Account Yet');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [consistencyLimit, setConsistencyLimit] = useState<number>(40);
  const [metrics, setMetrics] = useState<DashboardMetrics>({});
  const [equitySeries, setEquitySeries] = useState<EquityPoint[]>([]);
  const [symbolPerformance, setSymbolPerformance] = useState<SymbolRow[]>([]);
  const [winLossSeries, setWinLossSeries] = useState<WinLossPoint[]>([]);
  const [recentTradesRefreshKey, setRecentTradesRefreshKey] = useState(0);
  const [latestImport, setLatestImport] = useState<LatestImport>(null);
  const [undoingLatestImport, setUndoingLatestImport] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; type: 'success' | 'error' | 'info'; message: string }>>([]);

  const bgColor = theme === 'dark' ? '#101217' : '#F3F4F6';

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function bootstrapAccountAndDashboard() {
    try {
      const res = await axios.get('/accounts');
      const list = (Array.isArray(res.data?.data) ? res.data.data : []) as AccountItem[];
      setAccounts(list);
      if (list.length === 0) {
        setHasAccount(false);
        setAccountId(null);
        setAccountName('No Account Yet');
        setInitialBalance(0);
        setConsistencyLimit(40);
        setMetrics({});
        setEquitySeries([]);
        setSymbolPerformance([]);
        setWinLossSeries([]);
        setIsOnboardingOpen(true);
        return;
      }

      const first = list[0] as AccountItem;
      setHasAccount(true);
      setAccountId(first.id);
      setAccountName(first.account_name || 'Active Account');
      setInitialBalance(Number(first.initial_balance || 0));
      setConsistencyLimit(Number(first.consistency_rule_percent || 40));
      await refreshDashboard(first.id);
    } catch {
      setHasAccount(false);
      setAccountId(null);
      setIsOnboardingOpen(true);
    }
  }

  function switchAccount(nextAccountId: number) {
    const found = accounts.find((a) => a.id === nextAccountId);
    if (!found) return;
    setAccountId(found.id);
    setAccountName(found.account_name || 'Active Account');
    setInitialBalance(Number(found.initial_balance || 0));
    setConsistencyLimit(Number(found.consistency_rule_percent || 40));
    refreshDashboard(found.id);
  }

  async function refreshDashboard(id: number | null = accountId) {
    if (!id) {
      setMetrics({});
      setEquitySeries([]);
      setSymbolPerformance([]);
      setWinLossSeries([]);
      return;
    }

    const [summaryRes, equityRes, symbolRes, winLossRes, importRes] = await Promise.all([
      axios.get(`/accounts/${id}/dashboard/summary`),
      axios.get(`/accounts/${id}/dashboard/equity-curve`, { params: { days: 30 } }),
      axios.get(`/accounts/${id}/dashboard/performance-by-symbol`),
      axios.get(`/accounts/${id}/dashboard/win-loss-distribution`, { params: { days: 5 } }),
      axios.get(`/accounts/${id}/imports`, { params: { per_page: 1 } }),
    ]);

    const summaryMetrics = summaryRes.data?.data?.metrics ?? {};
    setMetrics(summaryMetrics);
    setEquitySeries(Array.isArray(equityRes.data?.data?.series) ? equityRes.data.data.series : []);
    setSymbolPerformance(Array.isArray(symbolRes.data?.data) ? symbolRes.data.data : []);
    setWinLossSeries(Array.isArray(winLossRes.data?.data?.series) ? winLossRes.data.data.series : []);
    const imports = Array.isArray(importRes.data?.data?.data) ? importRes.data.data.data : [];
    if (imports.length > 0) {
      const top = imports[0];
      setLatestImport({
        batchUuid: top.uuid,
        importedCount: Number(top.imported_count || 0),
        importedAt: top.imported_at || null,
        status: String(top.status || ''),
      });
    } else {
      setLatestImport(null);
    }
    setRecentTradesRefreshKey((k) => k + 1);
  }

  async function undoLastImport() {
    if (!accountId || !latestImport || latestImport.status !== 'completed') return;
    setUndoingLatestImport(true);
    try {
      await axios.delete(`/accounts/${accountId}/imports/${latestImport.batchUuid}`);
      await refreshDashboard(accountId);
      pushToast('success', 'Last import batch reverted.');
    } catch {
      pushToast('error', 'Failed to undo last import.');
    } finally {
      setUndoingLatestImport(false);
    }
  }

  function pushToast(type: 'success' | 'error' | 'info', message: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    bootstrapAccountAndDashboard();
  }, []);

  const handleMenuClick = () => {
    const onMobile = window.matchMedia('(max-width: 767px)').matches;
    if (onMobile) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }
    setIsDesktopSidebarExpanded((prev) => !prev);
  };

  const totalTrades = symbolPerformance.reduce((sum, row) => sum + Number(row.trades || 0), 0);
  const totalWins = winLossSeries.reduce((sum, row) => sum + Number(row.wins || 0), 0);
  const totalLosses = winLossSeries.reduce((sum, row) => sum + Number(row.losses || 0), 0);
  const winRate = totalWins + totalLosses > 0 ? (totalWins / (totalWins + totalLosses)) * 100 : 0;
  const avgWins = symbolPerformance.filter((r) => Number(r.avg_win) > 0).map((r) => Number(r.avg_win));
  const avgLosses = symbolPerformance.filter((r) => Number(r.avg_loss) < 0).map((r) => Number(r.avg_loss));
  const averageWin = avgWins.length > 0 ? avgWins.reduce((a, b) => a + b, 0) / avgWins.length : 0;
  const averageLoss = avgLosses.length > 0 ? avgLosses.reduce((a, b) => a + b, 0) / avgLosses.length : 0;
  const riskReward = Math.abs(averageLoss) > 0 ? averageWin / Math.abs(averageLoss) : 0;
  const totalProfit = symbolPerformance.reduce((sum, row) => sum + Math.max(0, Number(row.pnl || 0)), 0);
  const totalLossAbs = symbolPerformance.reduce((sum, row) => sum + Math.abs(Math.min(0, Number(row.pnl || 0))), 0);
  const profitFactor = totalLossAbs > 0 ? totalProfit / totalLossAbs : (totalProfit > 0 ? totalProfit : 0);
  const highestDayPct = Number(metrics.topDailyPercentOfTarget || 0);
  const dailyDrawdownPct = Number(metrics.dailyDrawdownPercent || 0);
  const profitTarget = Number(metrics.profitTarget || 0);
  const currentBalance = Number(metrics.currentBalance || 0);
  const totalPnl = Number(metrics.totalPnL || 0);
  const dailyLossRemainingUsd = Math.max(0, (initialBalance * 0.05) - ((dailyDrawdownPct / 100) * initialBalance));
  const profitProgressValue = Math.max(0, Math.min(profitTarget, totalPnl));
  const consistencyState = highestDayPct > consistencyLimit ? 'Breach' : highestDayPct >= Math.max(0, consistencyLimit - 2) ? 'Warning' : 'Safe';
  const consistencyStateColor = consistencyState === 'Breach' ? '#EF4444' : consistencyState === 'Warning' ? '#F59E0B' : '#10B981';

  const bestTradingDay = winLossSeries.reduce((best, row) => {
    const pnlApprox = Number(row.wins || 0) - Number(row.losses || 0);
    return pnlApprox > best ? pnlApprox : best;
  }, 0) * 100;
  const maxDrawdownUsd = (dailyDrawdownPct / 100) * initialBalance;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Desktop Sidebar (unchanged look) */}
      {!isMobile ? (
        <Sidebar expanded={isDesktopSidebarExpanded} />
      ) : null}

      {/* Mobile Sidebar Drawer */}
      {isMobile ? (
        <div
          className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <Sidebar variant="mobile" onNavigateMobile={() => setIsMobileSidebarOpen(false)} />
        </div>
      ) : null}

      {/* Mobile Overlay */}
      {isMobile && isMobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          isMobile={isMobile}
          onMobileMenuClick={handleMenuClick}
          accountLabel={hasAccount ? `${accountName} - Active` : 'No Account Yet'}
          accounts={accounts.map((a) => ({
            id: a.id,
            label: `${a.account_name}`,
          }))}
          activeAccountId={accountId}
          onSelectAccount={switchAccount}
          onAddAccount={() => setIsOnboardingOpen(true)}
          onOpenGuide={() => setIsOnboardingOpen(true)}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
            <div className="space-y-6" style={{ padding: isMobile ? '16px' : '32px' }}>
              {/* Filters Section */}
            <FilterBar
              onAddTradeClick={() => setIsAddTradeOpen(true)}
              onImportClick={() => setIsImportOpen(true)}
              lastImport={latestImport}
              onUndoLatestImport={undoLastImport}
              undoingLatestImport={undoingLatestImport}
            />

            {/* Risk At A Glance Row */}
            <div className="dashboard-row-4">
              <StatCard
                title="Account Equity"
                value={`$${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle={`Initial: $${initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <StatCard
                title="Daily Loss Remaining"
                value={`$${dailyLossRemainingUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="5% Max Daily"
                dangerBar={{ percentage: Math.max(0, Math.min(100, dailyDrawdownPct * 20)) }}
              />
              <StatCard
                title="Profit Target Progress"
                value={`$${profitProgressValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / $${profitTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle={`${profitTarget > 0 ? ((profitProgressValue / profitTarget) * 100).toFixed(1) : '0.0'}% Complete`}
                progressBar={{
                  value: profitProgressValue,
                  max: profitTarget || 1,
                  color: theme === 'dark' ? '#00F2FE' : '#0EA5E9',
                }}
              />
              <StatCard
                title="Consistency Score"
                value={`${consistencyState} (${highestDayPct.toFixed(1)}%)`}
                subtitle="Max Day vs Total"
                statusIndicator={{
                  color: consistencyStateColor,
                  label: consistencyState,
                }}
              />
            </div>

            {/* Trading Metrics Row */}
            <TradingMetrics
              data={{
                winRate,
                riskReward,
                profitFactor,
                totalTrades,
              }}
            />

            {/* Charts Row */}
            <div className="dashboard-row-3">
              {/* Left Column - Equity Curve (Wider) */}
              <div>
                <EquityCurveChart data={equitySeries} />
              </div>

              {/* Middle Column - Consistency Meter */}
              <div>
                <ConsistencyMeter percentage={highestDayPct} threshold={consistencyLimit} />
              </div>

              {/* Right Column - Quick Stats */}
              <div>
                <QuickStats
                  data={{
                    averageWin,
                    averageLoss,
                    largestWin: Math.max(0, ...symbolPerformance.map((row) => Number(row.pnl || 0))),
                    largestLoss: Math.min(0, ...symbolPerformance.map((row) => Number(row.pnl || 0))),
                    bestTradingDay,
                    consecutiveWins: totalWins,
                    maxDrawdown: maxDrawdownUsd,
                  }}
                />
              </div>
            </div>

            {/* Performance Analysis Row */}
            <div className="dashboard-row-2">
              <WinLossDistribution data={winLossSeries} />
              <PerformanceBySymbol
                data={symbolPerformance.map((row) => ({
                  symbol: row.symbol,
                  trades: row.trades,
                  winRate: row.win_rate,
                  pnl: row.pnl,
                  avgWin: row.avg_win,
                  avgLoss: row.avg_loss,
                }))}
              />
            </div>

            {/* Calendar and Trades Row */}
            <div className="dashboard-row-2-1">
              <div className="recent-trades-slot">
                <RecentTrades accountId={accountId} refreshKey={recentTradesRefreshKey} />
              </div>
              <div className="calendar-slot">
                <TradingCalendar empty={!hasAccount || totalTrades === 0} />
              </div>
            </div>

            <ActivityFeed accountId={accountId} refreshKey={recentTradesRefreshKey} />
          </div>
        </div>
      </div>

      <AddTradeModal
        open={isAddTradeOpen}
        onClose={() => setIsAddTradeOpen(false)}
        onSaved={() => {
          refreshDashboard();
        }}
        onNotify={pushToast}
        theme={theme}
      />
      <ImportTradesModal
        open={isImportOpen}
        accountId={accountId}
        theme={theme}
        onClose={() => setIsImportOpen(false)}
        onImported={() => {
          refreshDashboard();
        }}
        onNotify={pushToast}
      />
      <OnboardingWizard
        open={isOnboardingOpen}
        theme={theme}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          setIsOnboardingOpen(false);
          bootstrapAccountAndDashboard();
        }}
        onManualAddTrade={() => {
          setIsOnboardingOpen(false);
          setIsAddTradeOpen(true);
        }}
        onImportCsv={() => {
          setIsOnboardingOpen(false);
          setIsImportOpen(true);
        }}
      />
      <ToastStack items={toasts} theme={theme} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}
