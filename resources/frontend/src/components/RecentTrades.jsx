import React from 'react'

export default function RecentTrades({ trades = [] }){
  return (
    <div className="mt-4">
      <div className="text-sm font-medium mb-2">Recent trades</div>
      <div className="space-y-2 max-h-40 overflow-auto">
        {trades.length === 0 && <div className="text-slate-400">No recent trades</div>}
        {trades.map(t => (
          <div key={t.id} className="p-2 border rounded bg-white">
            <div className="text-sm font-semibold">{t.symbol} <span className="text-slate-500 text-xs">{t.type}</span></div>
            <div className="text-sm text-slate-600">PnL: {t.pnl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
