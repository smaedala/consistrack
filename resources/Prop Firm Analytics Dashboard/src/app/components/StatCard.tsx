import { LucideIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
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

export function StatCard({ title, value, subtitle, progressBar, statusIndicator, dangerBar }: StatCardProps) {
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
      className="rounded-lg p-6 border"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <div className="flex flex-col gap-3">
        {/* Title */}
        <h3 className="text-sm" style={{ color: c.subText }}>{title}</h3>

        {/* Main Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold" style={{ color: c.text }}>{value}</span>
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