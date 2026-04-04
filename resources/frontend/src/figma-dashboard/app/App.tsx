import { useEffect, useState } from 'react';
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

function Dashboard() {
  const { theme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const bgColor = theme === 'dark' ? '#101217' : '#F3F4F6';

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleMenuClick = () => {
    const onMobile = window.matchMedia('(max-width: 767px)').matches;
    if (onMobile) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }
    setIsDesktopSidebarExpanded((prev) => !prev);
  };

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
        <Header isMobile={isMobile} onMobileMenuClick={handleMenuClick} />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6" style={{ padding: isMobile ? '16px' : '32px' }}>
            {/* Filters Section */}
            <FilterBar />

            {/* Risk At A Glance Row */}
            <div className="dashboard-row-4">
              <StatCard
                title="Account Equity"
                value="$104,500.20"
                subtitle="Initial: $100,000"
              />
              <StatCard
                title="Daily Loss Remaining"
                value="$2,450.00"
                subtitle="5% Max Daily"
                dangerBar={{ percentage: 51 }}
              />
              <StatCard
                title="Profit Target Progress"
                value="$4,500 / $10,000"
                subtitle="45% Complete"
                progressBar={{
                  value: 4500,
                  max: 10000,
                  color: theme === 'dark' ? '#00F2FE' : '#0EA5E9',
                }}
              />
              <StatCard
                title="Consistency Score"
                value="Safe (18%)"
                subtitle="Max Day vs Total"
                statusIndicator={{
                  color: '#10B981',
                  label: 'Safe',
                }}
              />
            </div>

            {/* Trading Metrics Row */}
            <TradingMetrics />

            {/* Charts Row */}
            <div className="dashboard-row-3">
              {/* Left Column - Equity Curve (Wider) */}
              <div>
                <EquityCurveChart />
              </div>

              {/* Middle Column - Consistency Meter */}
              <div>
                <ConsistencyMeter percentage={18} />
              </div>

              {/* Right Column - Quick Stats */}
              <div>
                <QuickStats />
              </div>
            </div>

            {/* Performance Analysis Row */}
            <div className="dashboard-row-2">
              <WinLossDistribution />
              <PerformanceBySymbol />
            </div>

            {/* Calendar and Trades Row */}
            <div className="dashboard-row-2-1">
              <div className="recent-trades-slot">
                <RecentTrades />
              </div>
              <div className="calendar-slot">
                <TradingCalendar />
              </div>
            </div>
          </div>
        </div>
      </div>
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
