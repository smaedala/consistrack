import { ChevronDown, Bell, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  isMobile?: boolean;
  onMobileMenuClick?: () => void;
}

export function Header({ isMobile = false, onMobileMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

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

  return (
    <div 
      className="h-16 border-b flex items-center justify-between"
      style={{ backgroundColor: c.bg, borderColor: c.border, padding: isMobile ? '0 16px' : '0 32px' }}
    >
      {/* Welcome Message */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: c.cardBg }}
          onClick={onMobileMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" style={{ color: c.subText }} />
        </button>
        <h1 className="text-xl" style={{ color: c.text }}>Welcome back, Alex</h1>
      </div>

      {/* Right Side: Account Selector, Theme Toggle & Notifications */}
      <div className="flex items-center gap-2" style={{ columnGap: isMobile ? '8px' : '16px' }}>
        {/* Account Selector */}
        {!isMobile ? (
          <button 
            className="flex items-center gap-2 transition-colors px-4 py-2 rounded-lg"
            style={{ backgroundColor: c.cardBg }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.cardHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.cardBg}
          >
            <span className="text-sm" style={{ color: c.text }}>FTMO 100k - Active</span>
            <ChevronDown className="w-4 h-4" style={{ color: c.subText }} />
          </button>
        ) : null}

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
