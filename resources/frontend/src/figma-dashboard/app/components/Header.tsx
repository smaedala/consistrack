import { useMemo, useState } from 'react';
import { ChevronDown, Bell, Sun, Moon, Menu, Plus, CircleCheck, Circle, CircleHelp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  isMobile?: boolean;
  onMobileMenuClick?: () => void;
  accountLabel?: string;
  accounts?: Array<{ id: number; label: string }>;
  activeAccountId?: number | null;
  onSelectAccount?: (id: number) => void;
  onAddAccount?: () => void;
  onOpenGuide?: () => void;
  onOpenAddTrade?: () => void;
  onOpenImport?: () => void;
  helpMode?: boolean;
  onToggleHelpMode?: () => void;
  guideProgress?: {
    accountCreated: boolean;
    rulesConfigured: boolean;
    firstTradeAdded: boolean;
    firstImportCompleted: boolean;
  };
}

export function Header({
  isMobile = false,
  onMobileMenuClick,
  accountLabel,
  accounts = [],
  activeAccountId = null,
  onSelectAccount,
  onAddAccount,
  onOpenGuide,
  onOpenAddTrade,
  onOpenImport,
  helpMode = false,
  onToggleHelpMode,
  guideProgress,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);

  const colors = {
    dark: {
      bg: '#0D0F14',
      border: '#1E2025',
      text: '#FFFFFF',
      subText: '#9CA3AF',
      cardBg: '#1E2025',
      cardHover: '#2A2D35',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
      cardBg: '#F9FAFB',
      cardHover: '#F3F4F6',
    },
  };

  const c = colors[theme];
  const progress = guideProgress ?? {
    accountCreated: false,
    rulesConfigured: false,
    firstTradeAdded: false,
    firstImportCompleted: false,
  };
  const checklist = [
    { key: 'account', label: 'Create account profile', done: progress.accountCreated },
    { key: 'rules', label: 'Configure risk rules', done: progress.rulesConfigured },
    { key: 'trade', label: 'Add first trade', done: progress.firstTradeAdded },
    { key: 'import', label: 'Complete first import', done: progress.firstImportCompleted },
  ];
  const completedCount = checklist.filter((item) => item.done).length;
  const activeLabel = useMemo(() => {
    if (activeAccountId !== null) {
      const found = accounts.find((a) => a.id === activeAccountId);
      if (found) return found.label;
    }
    return accountLabel || 'No Account Yet';
  }, [accounts, activeAccountId, accountLabel]);

  return (
    <div 
      className="h-16 border-b flex items-center justify-between"
      style={{ backgroundColor: c.bg, borderColor: c.border, padding: isMobile ? '0 16px' : '0 32px' }}
    >
      {/* Welcome Message */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="w-10 h-10 rounded-lg flex items-center justify-center dash-hover-control"
          style={{ backgroundColor: c.cardBg }}
          onClick={onMobileMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" style={{ color: c.subText }} />
        </button>
        <h1 className="text-lg sm:text-xl truncate" style={{ color: c.text }}>Welcome back</h1>
      </div>

      {/* Right Side: Account Selector, Theme Toggle & Notifications */}
      <div className="flex items-center gap-2" style={{ columnGap: isMobile ? '8px' : '16px' }}>
        {/* Account Selector */}
        {!isMobile ? (
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 transition-colors px-4 py-2 rounded-lg dash-hover-control max-w-[320px]"
              style={{ backgroundColor: c.cardBg }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.cardHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.cardBg}
              onClick={() => setIsAccountOpen((prev) => !prev)}
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#10B981' }}></span>
                <span className="text-sm truncate whitespace-nowrap" style={{ color: c.text }}>{activeLabel}</span>
              </span>
              <ChevronDown className="w-4 h-4" style={{ color: c.subText }} />
            </button>

            {isAccountOpen ? (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl z-40 overflow-hidden"
                style={{ backgroundColor: c.cardBg, borderColor: c.border }}
              >
                <div className="max-h-64 overflow-y-auto p-2">
                  {accounts.length > 0 ? accounts.map((account) => {
                    const active = account.id === activeAccountId;
                    return (
                      <button
                        type="button"
                        key={account.id}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                        style={{
                          color: c.text,
                          backgroundColor: 'transparent',
                        }}
                        onClick={() => {
                          onSelectAccount?.(account.id);
                          setIsAccountOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center gap-2 w-full min-w-0">
                          {active ? <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#10B981' }}></span> : <span className="w-2 h-2 shrink-0"></span>}
                          <span className="truncate whitespace-nowrap">{account.label}</span>
                        </span>
                      </button>
                    );
                  }) : (
                    <p className="px-3 py-2 text-sm" style={{ color: c.subText }}>No accounts yet</p>
                  )}
                </div>

                <div className="border-t p-2" style={{ borderColor: c.border }}>
                  <button
                    type="button"
                    className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                    style={{
                      color: theme === 'dark' ? '#00F2FE' : '#0EA5E9',
                      backgroundColor: theme === 'dark' ? 'rgba(0,242,254,0.10)' : 'rgba(14,165,233,0.10)',
                    }}
                    onClick={() => {
                      onAddAccount?.();
                      setIsAccountOpen(false);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Account
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Theme Toggle */}
        <button
          onClick={onToggleHelpMode}
          className="h-10 rounded-lg transition-colors flex items-center justify-center px-3 gap-1.5 dash-hover-control"
          style={{
            backgroundColor: helpMode ? (theme === 'dark' ? 'rgba(0,242,254,0.15)' : 'rgba(14,165,233,0.14)') : c.cardBg,
            border: `1px solid ${helpMode ? (theme === 'dark' ? '#00F2FE88' : '#0EA5E988') : c.border}`,
          }}
          title="Toggle Help Mode"
          aria-label="Toggle Help Mode"
        >
          <CircleHelp className="w-4 h-4" style={{ color: helpMode ? (theme === 'dark' ? '#00F2FE' : '#0EA5E9') : c.subText }} />
          {!isMobile ? <span className="text-xs" style={{ color: helpMode ? c.text : c.subText }}>{helpMode ? 'Help On' : 'Help'}</span> : null}
        </button>

        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-lg transition-colors flex items-center justify-center dash-hover-control"
          style={{ backgroundColor: c.cardBg }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.cardHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.cardBg}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" style={{ color: c.subText }} />
          ) : (
            <Moon className="w-5 h-5" style={{ color: c.subText }} />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            className="w-10 h-10 rounded-lg transition-colors flex items-center justify-center relative dash-hover-control"
            style={{ backgroundColor: c.cardBg }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.cardHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.cardBg}
            onClick={() => setIsNoticeOpen((prev) => !prev)}
          >
            <Bell className="w-5 h-5" style={{ color: c.subText }} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#10B981] rounded-full"></span>
          </button>

          {isNoticeOpen ? (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl border shadow-2xl z-40"
              style={{ backgroundColor: c.cardBg, borderColor: c.border }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: c.border }}>
                <p className="text-sm font-medium" style={{ color: c.text }}>Welcome & Guide</p>
                <p className="text-xs" style={{ color: c.subText }}>
                  Setup progress: {completedCount}/4 complete
                </p>
              </div>
              <div className="p-2 space-y-1">
                <div className="rounded-lg border p-2" style={{ borderColor: c.border, backgroundColor: theme === 'dark' ? '#111622' : '#F8FAFC' }}>
                  {checklist.map((item) => (
                    <div key={item.key} className="flex items-center gap-2 py-1">
                      {item.done ? (
                        <CircleCheck className="w-4 h-4" style={{ color: '#10B981' }} />
                      ) : (
                        <Circle className="w-4 h-4" style={{ color: c.subText }} />
                      )}
                      <span className="text-xs" style={{ color: item.done ? c.text : c.subText }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg text-sm"
                  style={{ color: c.text, backgroundColor: 'transparent' }}
                  onClick={() => {
                    onOpenGuide?.();
                    setIsNoticeOpen(false);
                  }}
                >
                  Open setup wizard
                </button>
                {!progress.firstTradeAdded ? (
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg text-sm"
                    style={{ color: theme === 'dark' ? '#00F2FE' : '#0EA5E9', backgroundColor: theme === 'dark' ? '#111622' : '#F8FAFC' }}
                    onClick={() => {
                      onOpenAddTrade?.();
                      setIsNoticeOpen(false);
                    }}
                  >
                    Quick action: Add your first trade
                  </button>
                ) : null}
                {!progress.firstImportCompleted ? (
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg text-sm"
                    style={{ color: theme === 'dark' ? '#00F2FE' : '#0EA5E9', backgroundColor: theme === 'dark' ? '#111622' : '#F8FAFC' }}
                    onClick={() => {
                      onOpenImport?.();
                      setIsNoticeOpen(false);
                    }}
                  >
                    Quick action: Import MT4/MT5 history
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
