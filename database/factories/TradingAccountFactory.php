<?php

namespace Database\Factories;

use App\Models\TradingAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

class TradingAccountFactory extends Factory
{
    protected $model = TradingAccount::class;

    public function definition()
    {
        return [
            'user_id' => 1,
            'account_name' => 'Test Account',
            'initial_balance' => 10000.00,
            'current_balance' => 10000.00,
            'profit_target' => 4000.00,
            'consistency_rule_percent' => 40,
            'daily_drawdown_limit_percent' => 5,
            'max_loss_limit_percent' => 10,
            'timezone' => 'UTC',
            'trading_day_reset_timezone' => 'UTC',
            'trading_day_reset_time' => '00:00',
            'status' => 'active',
        ];
    }
}
