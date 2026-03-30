import React, {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function StatCard({title, value}){
  return (<div className="p-4 border rounded"><div className="text-sm text-gray-500">{title}</div><div className="text-xl font-bold">{value}</div></div>)
}

function ConsistencyMeter({percent, limit}){
  const pct = percent
  const color = pct >= limit ? 'text-red-600' : (pct >= limit*0.7 ? 'text-yellow-600' : 'text-green-600')
  return (<div className="p-4"><div className="text-sm">Top Day % of Target</div><div className={`text-2xl font-bold ${color}`}>{pct}%</div></div>)
}

export default function Dashboard(){
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState(null)
  const [trades, setTrades] = useState([])

  useEffect(()=>{
    async function load(){
      try{
        // get first account for demo
        const accounts = await axios.get('/accounts')
        const acct = accounts.data.data[0]
        if(!acct) return
        const m = await axios.get(`/accounts/${acct.id}/metrics`)
        setMetrics(m.data.data)
        const t = await axios.get(`/accounts/${acct.id}/trades`)
        setTrades(t.data.data.data || t.data.data)
      }catch(err){
        console.error(err)
        if (err.response && err.response.status === 401) {
          // not authenticated, redirect to login
          navigate('/login')
        }
      }
    }
    load()
  },[])

  return (
    <div className="container">
      <h1 className="text-2xl mb-4">Dashboard</h1>
      {metrics ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard title="Current Balance" value={`${metrics.currentBalance}`} />
          <StatCard title="Profit Target" value={`${metrics.profitTarget}`} />
          <StatCard title="Max Loss %" value={`${metrics.maxLossPercent}%`} />
        </div>
      ) : <div>Loading metrics...</div>}

      {metrics && <ConsistencyMeter percent={metrics.topDailyPercentOfTarget} limit={/* assume account */ 40} />}

      <div className="mt-6">
        <h2 className="text-lg mb-2">Recent Trades</h2>
        <div className="space-y-2">
          {trades.map(t=> (
            <div key={t.id} className="p-3 border rounded flex justify-between">
              <div>{t.symbol} • {t.strategy_tag}</div>
              <div>{t.pnl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
