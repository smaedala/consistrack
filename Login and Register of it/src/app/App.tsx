import { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { EquityCurveChart } from './components/EquityCurveChart';
import { ConsistencyMeter } from './components/ConsistencyMeter';
import { RecentTrades } from './components/RecentTrades';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';

function Dashboard() {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'login' | 'register'>('login');

  const bgColor = theme === 'dark' ? '#101217' : '#F3F4F6';

  if (currentPage === 'login') {
    return <LoginPage onNavigateToRegister={() => setCurrentPage('register')} />;
  }

  if (currentPage === 'register') {
    return <RegisterPage onNavigateToLogin={() => setCurrentPage('login')} />;
  }

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
            {/* Risk At A Glance Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Main Content Area - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Equity Curve (Wider) */}
              <div className="lg:col-span-2">
                <EquityCurveChart />
              </div>

              {/* Right Column - Consistency Meter (Narrower) */}
              <div className="lg:col-span-1">
                <ConsistencyMeter percentage={18} />
              </div>
            </div>

            {/* Bottom Data Row - Recent Trades */}
            <RecentTrades />
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