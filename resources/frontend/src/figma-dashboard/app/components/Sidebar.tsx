import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, FileText, BarChart3, Settings, User, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Sidebar() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true, onClick: () => navigate('/dashboard') },
    { icon: FileText, label: 'Trade Log', active: false, onClick: () => navigate('/trade-log') },
    { icon: BarChart3, label: 'Analytics', active: false, onClick: () => navigate('/dashboard') },
    { icon: Settings, label: 'Risk Settings', active: false, onClick: () => navigate('/risk-settings') },
  ];

  const colors = {
    dark: {
      bg: '#0D0F14',
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
            onClick={item.onClick}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* User Profile at Bottom */}
      <div className="relative">
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: c.text, backgroundColor: isProfileOpen ? c.hover : 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = c.hover;
            e.currentTarget.style.color = theme === 'dark' ? '#FFFFFF' : '#000000';
          }}
          onMouseLeave={(e) => {
            if (!isProfileOpen) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
            e.currentTarget.style.color = c.text;
          }}
          onClick={() => setIsProfileOpen((prev) => !prev)}
          title="User Profile"
        >
          <User className="w-5 h-5" />
        </button>

        {isProfileOpen ? (
          <div
            className="absolute bottom-0 left-12 w-36 rounded-xl border p-2 shadow-2xl z-50"
            style={{
              backgroundColor: theme === 'dark' ? '#111622' : '#FFFFFF',
              borderColor: c.border,
            }}
          >
            <button
              className="w-full h-9 rounded-lg text-sm font-medium transition-colors mb-1"
              style={{ color: c.text, backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.hover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => {
                setIsProfileOpen(false);
                navigate('/risk-settings');
              }}
            >
              Settings
            </button>
            <button
              className="w-full h-9 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
              style={{ color: '#EF4444', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => {
                setIsProfileOpen(false);
                localStorage.removeItem('api_token');
                delete axios.defaults.headers.common.Authorization;
                navigate('/login');
              }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
