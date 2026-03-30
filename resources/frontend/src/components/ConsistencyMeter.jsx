import React from 'react'

export default function ConsistencyMeter({ value = 0, limit = 40 }){
  const pct = Math.min(100, (value / limit) * 100)
  const color = pct < 70 ? 'bg-green-400' : pct < 90 ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <div>
      <div className="text-sm text-slate-600">Top day % of target: {value}%</div>
      <div className="w-full bg-slate-200 rounded-full h-3 mt-2">
        <div className={`${color} h-3 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
