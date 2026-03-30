import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Strategy {
  name: string;
  trades: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  rating: "excellent" | "good" | "average" | "poor";
}

export function StrategyMatrixDemo() {
  const strategies: Strategy[] = [
    {
      name: "ICT Silver Bullet",
      trades: 47,
      winRate: 72.3,
      profitFactor: 2.8,
      avgWin: 450,
      avgLoss: 180,
      rating: "excellent",
    },
    {
      name: "London Open Breakout",
      trades: 35,
      winRate: 65.7,
      profitFactor: 2.1,
      avgWin: 380,
      avgLoss: 190,
      rating: "good",
    },
    {
      name: "Judas Swing",
      trades: 28,
      winRate: 57.1,
      profitFactor: 1.4,
      avgWin: 320,
      avgLoss: 240,
      rating: "average",
    },
    {
      name: "New York PM Session",
      trades: 22,
      winRate: 31.8,
      profitFactor: 0.7,
      avgWin: 280,
      avgLoss: 350,
      rating: "poor",
    },
  ];

  const getRatingColor = (rating: Strategy["rating"]) => {
    switch (rating) {
      case "excellent":
        return "text-[#10B981]";
      case "good":
        return "text-cyan-400";
      case "average":
        return "text-yellow-400";
      case "poor":
        return "text-red-400";
    }
  };

  const getRatingBg = (rating: Strategy["rating"]) => {
    switch (rating) {
      case "excellent":
        return "bg-[#10B981]/10 border-[#10B981]/30";
      case "good":
        return "bg-cyan-500/10 border-cyan-500/30";
      case "average":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "poor":
        return "bg-red-500/10 border-red-500/30";
    }
  };

  const getRatingIcon = (rating: Strategy["rating"]) => {
    switch (rating) {
      case "excellent":
        return <TrendingUp className="h-4 w-4" />;
      case "good":
        return <TrendingUp className="h-4 w-4" />;
      case "average":
        return <Minus className="h-4 w-4" />;
      case "poor":
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  return (
    <div
      className="rounded-xl border border-gray-700 p-8"
      style={{ backgroundColor: "#1E2025" }}
    >
      <div className="mb-6">
        <h3 className="mb-2 text-2xl text-white">Strategy Win-Rate Matrix</h3>
        <p className="text-sm text-gray-400">
          Real-time performance breakdown by trading strategy
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="pb-3 text-left text-xs text-gray-500">Strategy</th>
              <th className="pb-3 text-left text-xs text-gray-500">Trades</th>
              <th className="pb-3 text-left text-xs text-gray-500">Win Rate</th>
              <th className="pb-3 text-left text-xs text-gray-500">Profit Factor</th>
              <th className="pb-3 text-left text-xs text-gray-500">Avg Win/Loss</th>
              <th className="pb-3 text-left text-xs text-gray-500">Rating</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy, index) => (
              <tr key={index} className="border-b border-gray-800 last:border-0">
                <td className="py-4 text-white">{strategy.name}</td>
                <td className="py-4 text-gray-400">{strategy.trades}</td>
                <td className="py-4">
                  <span className={getRatingColor(strategy.rating)}>
                    {strategy.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-4">
                  <span className={strategy.profitFactor >= 2 ? "text-[#10B981]" : strategy.profitFactor >= 1.5 ? "text-cyan-400" : "text-red-400"}>
                    {strategy.profitFactor.toFixed(1)}
                  </span>
                </td>
                <td className="py-4 text-gray-400">
                  <span className="text-[#10B981]">${strategy.avgWin}</span> /{" "}
                  <span className="text-red-400">${strategy.avgLoss}</span>
                </td>
                <td className="py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${getRatingBg(
                      strategy.rating
                    )} ${getRatingColor(strategy.rating)}`}
                  >
                    {getRatingIcon(strategy.rating)}
                    {strategy.rating.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      <div className="mt-6 rounded-lg border border-[#00F2FE]/30 bg-[#00F2FE]/5 p-4">
        <h4 className="mb-2 text-[#00F2FE]">💡 AI Recommendation</h4>
        <p className="text-sm text-gray-300">
          Focus on <strong className="text-white">ICT Silver Bullet</strong> and{" "}
          <strong className="text-white">London Open</strong> strategies. Consider avoiding{" "}
          <strong className="text-red-400">New York PM sessions</strong> - your win rate is below 35%.
        </p>
      </div>
    </div>
  );
}
