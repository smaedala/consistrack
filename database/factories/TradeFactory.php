<?php

namespace Database\Factories;

use App\Models\Trade;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TradeFactory extends Factory
{
    protected $model = Trade::class;

    public function definition()
    {
        return [
            'account_id' => 1,
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'lot_size' => 1.0,
            'entry_price' => 1.10000,
            'exit_price' => 1.11000,
            'pnl' => 100.00,
            'close_time' => now(),
            'strategy_tag' => 'test',
            'external_id' => Str::uuid()->toString(),
        ];
    }
}
