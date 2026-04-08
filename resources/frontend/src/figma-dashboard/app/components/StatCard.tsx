import { CircleHelp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  tooltip?: string;
  helpMode?: boolean;
  progressBar?: {
    value: number;
    max: number;
    color: string;
  };
  statusIndicator?: {
    color: string;
    label: string;
  };
  dangerBar?: {
    percentage: number;
  };
}

export function StatCard({ title, value, subtitle, tooltip, helpMode = false, progressBar, statusIndicator, dangerBar }: StatCardProps) {
  const { theme } = useTheme();

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
      subText: '#9CA3AF',
      progressBg: '#0D0F14',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
      progressBg: '#F3F4F6',
    },
  };

  const c = colors[theme];

  return (
    <div 
      className="rounded-lg p-6 border dash-hover-card dashboard-surface"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
        boxShadow: helpMode && tooltip ? (theme === 'dark' ? '0 0 0 1px rgba(0,242,254,0.35), 0 0 20px rgba(0,242,254,0.12)' : '0 0 0 1px rgba(14,165,233,0.30), 0 0 14px rgba(14,165,233,0.10)') : 'none',
      }}
    >
      <div className="flex flex-col gap-3">
        {/* Title */}
        <h3 className="text-sm inline-flex items-center gap-1" style={{ color: c.subText }}>
          {title}
          {tooltip ? (
            <span
              className="inline-flex items-center cursor-help"
              title={tooltip}
              aria-label={tooltip}
              style={{
                opacity: 0.85,
                color: helpMode ? (theme === 'dark' ? '#00F2FE' : '#0EA5E9') : c.subText,
                filter: helpMode ? 'drop-shadow(0 0 6px rgba(0,242,254,0.45))' : 'none',
              }}
            >
              <CircleHelp size={13} />
            </span>
          ) : null}
        </h3>

        {/* Main Value */}
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-2xl sm:text-3xl font-semibold leading-tight break-words" style={{ color: c.text }}>{value}</span>
          {statusIndicator && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: statusIndicator.color }}
              ></span>
              <span className="text-sm" style={{ color: statusIndicator.color }}>
                {statusIndicator.label}
              </span>
            </div>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && <p className="text-xs" style={{ color: c.subText }}>{subtitle}</p>}

        {/* Progress Bar */}
        {progressBar && (
          <div className="mt-2">
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: c.progressBg }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(progressBar.value / progressBar.max) * 100}%`,
                  backgroundColor: progressBar.color,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Danger Bar */}
        {dangerBar && (
          <div className="mt-2">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: c.progressBg }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${dangerBar.percentage}%`,
                  backgroundColor: '#EF4444',
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
