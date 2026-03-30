import { TrendingUp } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'dark' | 'light';
}

export function Logo({ size = 'md', showText = true, variant = 'dark' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-5 h-5', text: 'text-lg' },
    md: { icon: 'w-6 h-6', text: 'text-xl' },
    lg: { icon: 'w-8 h-8', text: 'text-3xl' },
  };

  const colors = {
    dark: {
      text: '#FFFFFF',
      accent: '#00F2FE',
    },
    light: {
      text: '#000000',
      accent: '#0EA5E9',
    },
  };

  const s = sizes[size];
  const c = colors[variant];

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`${s.icon} rounded flex items-center justify-center`}
        style={{ backgroundColor: c.accent }}
      >
        <TrendingUp className={s.icon} style={{ color: '#FFFFFF' }} />
      </div>
      {showText && (
        <span 
          className={`${s.text} font-semibold`} 
          style={{ color: c.text, fontFamily: 'Inter, sans-serif' }}
        >
          Smaedala FX
        </span>
      )}
    </div>
  );
}
