<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TradingRule extends Model
{
    protected $fillable = [
        'user_id',
        'trading_account_id',
        'starting_balance',
        'profit_target_percent',
        'max_daily_loss_percent',
        'consistency_rule_type',
        'consistency_threshold_percent',
        'max_single_trade_percent',
        'is_active',
        'activated_at',
        'deactivated_at',
    ];

    protected $casts = [
        'starting_balance' => 'decimal:2',
        'profit_target_percent' => 'decimal:2',
        'max_daily_loss_percent' => 'decimal:2',
        'consistency_threshold_percent' => 'decimal:2',
        'max_single_trade_percent' => 'decimal:2',
        'is_active' => 'boolean',
        'activated_at' => 'datetime',
        'deactivated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tradingAccount(): BelongsTo
    {
        return $this->belongsTo(TradingAccount::class);
    }

    public function getMaxDailyLossAmount(): float
    {
        return (float) ($this->starting_balance * ($this->max_daily_loss_percent / 100));
    }

    public function getProfitTargetAmount(): float
    {
        return (float) ($this->starting_balance * ($this->profit_target_percent / 100));
    }

    public function getMaxConsistencyAmount(float $totalProfit): float
    {
        return (float) ($totalProfit * ($this->consistency_threshold_percent / 100));
    }
}
