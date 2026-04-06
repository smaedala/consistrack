import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

type ActivityItem = {
  id: number;
  event_type: string;
  description: string;
  created_at: string;
  meta?: Record<string, any>;
};

type ActivityFeedProps = {
  accountId: number | null;
  refreshKey?: number;
};

export function ActivityFeed({ accountId, refreshKey = 0 }: ActivityFeedProps) {
  const { theme } = useTheme();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  const c =
    theme === 'dark'
      ? { bg: '#1E2025', border: '#2A2D35', text: '#FFFFFF', subText: '#9CA3AF', tagBg: '#111622' }
      : { bg: '#FFFFFF', border: '#E5E7EB', text: '#000000', subText: '#6B7280', tagBg: '#F8FAFC' };

  useEffect(() => {
    if (!accountId) {
      setItems([]);
      return;
    }

    let active = true;
    setLoading(true);

    axios
      .get(`/accounts/${accountId}/activity`, { params: { per_page: 8 } })
      .then((res) => {
        if (!active) return;
        const rows = Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
        setItems(rows);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accountId, refreshKey]);

  return (
    <div className="rounded-lg p-4 sm:p-6 border dash-hover-card" style={{ backgroundColor: c.bg, borderColor: c.border }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg" style={{ color: c.text }}>Activity Log</h3>
        <span className="text-xs" style={{ color: c.subText }}>Latest actions</span>
      </div>

      <div className="space-y-2">
        {loading ? <p className="text-sm" style={{ color: c.subText }}>Loading activity...</p> : null}
        {!loading && items.length === 0 ? (
          <p className="text-sm" style={{ color: c.subText }}>No activity yet for this account.</p>
        ) : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border px-3 py-2" style={{ borderColor: c.border, backgroundColor: c.tagBg }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm" style={{ color: c.text }}>{item.description}</p>
              <span className="text-xs uppercase" style={{ color: c.subText }}>{item.event_type.replaceAll('_', ' ')}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: c.subText }}>
              {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

