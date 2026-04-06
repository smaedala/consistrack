<?php

namespace Database\Seeders;

use App\Jobs\EvaluateAccountMetricsJob;
use App\Models\Trade;
use App\Models\TradeImportBatch;
use App\Models\TradingAccount;
use App\Models\TradingRule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoTradingDataSeeder extends Seeder
{
    /**
     * Seed realistic demo trading data for local development.
     */
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'demo@consistracker.com'],
            [
                'name' => 'Demo Trader',
                'password' => Hash::make('password123'),
            ]
        );

        $account = TradingAccount::updateOrCreate(
            [
                'user_id' => $user->id,
                'account_name' => 'FTMO 100K - Active',
            ],
            [
                'initial_balance' => 100000,
                'current_balance' => 100000,
                'profit_target' => 10000,
                'consistency_rule_percent' => 40,
                'daily_drawdown_limit_percent' => 5,
                'max_loss_limit_percent' => 10,
                'timezone' => 'UTC',
                'trading_day_reset_timezone' => 'America/New_York',
                'trading_day_reset_time' => '17:00',
                'status' => 'active',
            ]
        );

        TradingRule::updateOrCreate(
            [
                'user_id' => $user->id,
                'trading_account_id' => $account->id,
            ],
            [
                'starting_balance' => 100000,
                'profit_target_percent' => 10,
                'max_daily_loss_percent' => 5,
                'consistency_rule_type' => '40',
                'consistency_threshold_percent' => 40,
                'max_single_trade_percent' => 2,
                'is_active' => true,
                'activated_at' => now(),
            ]
        );

        // Prevent duplicate trade data on reseed.
        Trade::where('account_id', $account->id)->delete();
        TradeImportBatch::where('account_id', $account->id)->delete();

        $batch = TradeImportBatch::create([
            'uuid' => (string) Str::uuid(),
            'account_id' => $account->id,
            'source' => 'csv',
            'file_name' => 'demo-import.csv',
            'status' => 'completed',
            'total_rows' => 30,
            'imported_count' => 30,
            'duplicate_count' => 0,
            'error_count' => 0,
            'imported_at' => now(),
        ]);

        $symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'AUDUSD'];
        $setups = ['Silver Bullet', 'Judas Swing', 'London Open', 'Breaker Trade'];
        $types = ['buy', 'sell'];
        $base = Carbon::now()->subDays(30)->startOfDay()->addHours(18); // aligned with 17:00 reset style

        for ($i = 0; $i < 30; $i++) {
            $pnl = match (true) {
                $i % 7 === 0 => -120.50,
                $i % 6 === 0 => -75.20,
                $i % 5 === 0 => 320.40,
                default => 180.00 + ($i * 6.25),
            };

            Trade::create([
                'account_id' => $account->id,
                'import_batch_id' => $batch->id,
                'symbol' => $symbols[$i % count($symbols)],
                'type' => $types[$i % 2],
                'lot_size' => 0.20 + (($i % 3) * 0.10),
                'entry_price' => 1.10000 + (($i % 5) * 0.00120),
                'exit_price' => 1.10120 + (($i % 5) * 0.00110),
                'pnl' => round($pnl, 2),
                'close_time' => $base->copy()->addDays($i)->addMinutes($i * 7),
                'strategy_tag' => $setups[$i % count($setups)],
                'external_id' => 'DEMO-' . str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
            ]);
        }

        // Build cache/snapshot/alerts via the same backend job logic.
        EvaluateAccountMetricsJob::dispatchSync($account->id);
    }
}

