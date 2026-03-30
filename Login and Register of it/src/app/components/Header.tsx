import { ChevronDown, Bell, Sun, Moon, TrendingDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  const colors = {
    dark: {
      bg: '#15171C',
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

  return (
    <div 
      className="h-16 border-b flex items-center justify-between px-8"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      {/* Welcome Message */}
      <div>
        <h1 className="text-xl font-medium" style={{ color: c.text, fontFamily: 'Inter, sans-serif' }}>Welcome back, Alex</h1>
      </div>

      {/* Right Side: Daily Loss Counter, Account Selector, Theme Toggle & Notifications */}
      <div className="flex items-center gap-4">
        {/* Daily Loss Remaining Counter */}
        <div 
          className="flex items-center gap-3 px-4 py-2 rounded-lg border"
          style={{ backgroundColor: c.cardBg, borderColor: '#EF4444' }}
        >
          <TrendingDown className="w-4 h-4 text-[#EF4444]" />
          <div className="flex flex-col">
            <span className="text-xs" style={{ color: c.subText }}>Daily Loss Remaining</span>
            <span className="text-sm font-semibold text-[#EF4444]">€2,450.00</span>
          </div>
        </div>

        {/* Account Selector */}
        <button 
          className="flex items-center gap-2 transition-colors px-4 py-2 rounded-lg"
          style={{ backgroundColor: c.cardBg }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.cardHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.cardBg}
        >
          <span className="text-sm font-medium" style={{ color: c.text, fontFamily: 'Inter, sans-serif' }}>FunderPro 10k</span>
          <ChevronDown className="w-4 h-4" style={{ color: c.subText }} />
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-lg transition-colors flex items-center justify-center"
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
        <button 
          className="w-10 h-10 rounded-lg transition-colors flex items-center justify-center relative"
          style={{ backgroundColor: c.cardBg }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.cardHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.cardBg}
        >
          <Bell className="w-5 h-5" style={{ color: c.subText }} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full"></span>
        </button>
      </div>
    </div>
  );
}