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

  const bgColor = theme === 'dark' ? '#101217' : '#F3F4F6';

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            {/* Filters Section */}
            <FilterBar />

            {/* Risk At A Glance Row */}
            <div className="dashboard-row-4">
              <StatCard
                title="Account Equity"
                value="€104,500.20"
                subtitle="Initial: €100,000"
              />
              <StatCard
                title="Daily Loss Remaining"
                value="€2,450.00"
                subtitle="5% Max Daily"
                dangerBar={{ percentage: 51 }}
              />
              <StatCard
                title="Profit Target Progress"
                value="€4,500 / €10,000"
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
              <div>
                <RecentTrades />
              </div>
              <div>
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
