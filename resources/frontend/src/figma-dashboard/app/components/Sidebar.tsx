import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, FileText, BarChart3, Settings, User, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  variant?: 'desktop' | 'mobile';
  expanded?: boolean;
  onNavigateMobile?: () => void;
}

function SidebarLogo({ showText, textColor }: { showText: boolean; textColor: string }) {
  return (
    <div
      className="authv2-logo"
      style={{
        justifyContent: showText ? 'flex-start' : 'center',
        width: '100%',
        fontSize: showText ? '1.1rem' : '1rem',
        gap: showText ? '10px' : '0',
        color: textColor,
      }}
    >
      <div className="authv2-logo-icon" aria-hidden="true" style={{ width: '30px', height: '30px', borderRadius: '8px' }}>
        <svg viewBox="0 0 24 24">
          <path d="M4 18h16v2H2V4h2v14Zm4-3 3.5-3.5 2.8 2.8L20 8.6V12h2V5h-7v2h3.6l-4.3 4.3-2.8-2.8L6 13.6 8 15Z" />
        </svg>
      </div>
      {showText ? <span style={{ letterSpacing: '-0.01em', color: textColor }}>ConsisTracker</span> : null}
    </div>
  );
}

export function Sidebar({ variant = 'desktop', expanded = false, onNavigateMobile }: SidebarProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isMobile = variant === 'mobile';
  
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
  const showLabels = isMobile || expanded;

  return (
    <div 
      className={`h-full border-r flex flex-col py-6 transition-all duration-300 ${isMobile ? 'w-64 px-3' : showLabels ? 'w-56 px-3' : 'w-16 items-center'}`}
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      {/* Logo */}
      <div className={`${showLabels ? 'px-1 mb-6' : 'mb-6'}`} style={{ width: '100%' }}>
        <SidebarLogo showText={showLabels} textColor={theme === 'dark' ? '#FFFFFF' : '#0F172A'} />
      </div>

      {/* Navigation Items */}
      <div className={`flex-1 flex flex-col gap-4 ${showLabels ? '' : 'items-center'}`}>
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`rounded-lg flex items-center transition-colors ${showLabels ? 'w-full h-11 px-3 justify-start gap-3' : 'w-10 h-10 justify-center'}`}
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
            onClick={() => {
              item.onClick();
              onNavigateMobile?.();
            }}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            {showLabels ? <span className="text-sm">{item.label}</span> : null}
          </button>
        ))}
      </div>

      {/* User Profile at Bottom */}
      <div className="relative">
        <button
          className={`rounded-lg flex items-center transition-colors ${showLabels ? 'w-full h-11 px-3 justify-start gap-3' : 'w-10 h-10 justify-center'}`}
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
          {showLabels ? <span className="text-sm">Profile</span> : null}
        </button>

        {isProfileOpen ? (
          <div
            className={`absolute bottom-0 w-36 rounded-xl border p-2 shadow-2xl z-50 ${showLabels ? 'right-0' : 'left-12'}`}
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
                onNavigateMobile?.();
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
                onNavigateMobile?.();
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
