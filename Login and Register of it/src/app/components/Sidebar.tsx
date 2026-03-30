import { LayoutDashboard, FileText, BarChart3, Settings, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Sidebar() {
  const { theme } = useTheme();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: FileText, label: 'Trade Log', active: false },
    { icon: BarChart3, label: 'Analytics', active: false },
    { icon: Settings, label: 'Risk Settings', active: false },
  ];

  const colors = {
    dark: {
      bg: '#15171C',
      border: '#1E2025',
      hover: '#1E2025',
      text: '#9CA3AF',
      activeText: '#00F2FE',
      activeBg: '#00F2FE',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      hover: '#F3F4F6',
      text: '#6B7280',
      activeText: '#0EA5E9',
      activeBg: '#0EA5E9',
    },
  };

  const c = colors[theme];

  return (
    <div 
      className="w-16 border-r flex flex-col items-center py-6"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      {/* Navigation Items */}
      <div className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => (
          <button
            key={item.label}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: item.active ? `${c.activeBg}10` : 'transparent',
              color: item.active ? c.activeText : c.text,
            }}
            onMouseEnter={(e) => {
              if (!item.active) {
                e.currentTarget.style.backgroundColor = c.hover;
                e.currentTarget.style.color = theme === 'dark' ? '#FFFFFF' : '#000000';
              }
            }}
            onMouseLeave={(e) => {
              if (!item.active) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = c.text;
              }
            }}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* User Profile at Bottom */}
      <button
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: c.text }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = c.hover;
          e.currentTarget.style.color = theme === 'dark' ? '#FFFFFF' : '#000000';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = c.text;
        }}
        title="User Profile"
      >
        <User className="w-5 h-5" />
      </button>
    </div>
  );
}