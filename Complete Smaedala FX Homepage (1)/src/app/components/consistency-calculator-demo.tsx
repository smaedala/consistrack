import { useState } from "react";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export function ConsistencyCalculatorDemo() {
  const [currentProfit, setCurrentProfit] = useState(5000);
  const [newTradeProfit, setNewTradeProfit] = useState(2000);
  
  const accountSize = 10000;
  const totalAfterTrade = currentProfit + newTradeProfit;
  const consistencyThreshold = accountSize * 0.4; // 40% rule
  const percentageOfTotal = (newTradeProfit / totalAfterTrade) * 100;
  const willBreach = percentageOfTotal > 40;
  const warningZone = percentageOfTotal > 35 && percentageOfTotal <= 40;

  return (
    <div
      className="rounded-xl border border-gray-700 p-8"
      style={{ backgroundColor: "#1E2025" }}
    >
      <div className="mb-6">
        <h3 className="mb-2 text-2xl text-white">The Consistency Buffer™ Calculator</h3>
        <p className="text-sm text-gray-400">
          See if your next trade will breach the 40% consistency rule in real-time
        </p>
      </div>

      {/* Input Controls */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm text-gray-400">
            Current Total Profit: ${currentProfit.toLocaleString()}
          </label>
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={currentProfit}
            onChange={(e) => setCurrentProfit(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
            style={{
              background: `linear-gradient(to right, #00F2FE ${(currentProfit / 10000) * 100}%, #374151 ${(currentProfit / 10000) * 100}%)`,
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-400">
            Potential New Trade Profit: ${newTradeProfit.toLocaleString()}
          </label>
          <input
            type="range"
            min="0"
            max="5000"
            step="50"
            value={newTradeProfit}
            onChange={(e) => setNewTradeProfit(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
            style={{
              background: `linear-gradient(to right, #10B981 ${(newTradeProfit / 5000) * 100}%, #374151 ${(newTradeProfit / 5000) * 100}%)`,
            }}
          />
        </div>
      </div>

      {/* Results Display */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-800/50 p-4">
            <p className="text-xs text-gray-500">Total After Trade</p>
            <p className="text-2xl text-white">${totalAfterTrade.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-gray-800/50 p-4">
            <p className="text-xs text-gray-500">Trade % of Total</p>
            <p className={`text-2xl ${willBreach ? 'text-red-500' : warningZone ? 'text-orange-400' : 'text-[#10B981]'}`}>
              {percentageOfTotal.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Status Alert */}
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 ${
            willBreach
              ? 'border-red-500/30 bg-red-500/10'
              : warningZone
              ? 'border-orange-500/30 bg-orange-500/10'
              : 'border-[#10B981]/30 bg-[#10B981]/10'
          }`}
        >
          {willBreach ? (
            <>
              <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-500" />
              <div>
                <h4 className="mb-1 text-red-400">⚠️ BREACH ALERT</h4>
                <p className="text-sm text-red-300">
                  This trade would put you over the 40% consistency threshold. Consider taking partial profits.
                </p>
              </div>
            </>
          ) : warningZone ? (
            <>
              <TrendingUp className="mt-0.5 h-6 w-6 flex-shrink-0 text-orange-400" />
              <div>
                <h4 className="mb-1 text-orange-400">⚡ Warning Zone</h4>
                <p className="text-sm text-orange-300">
                  You're approaching the limit. Consider your risk carefully.
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#10B981]" />
              <div>
                <h4 className="mb-1 text-[#10B981]">✓ Safe Trade</h4>
                <p className="text-sm text-green-300">
                  This trade is within safe limits. You have room to let it run.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
