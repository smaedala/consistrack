<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TradingAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'account_name',
        'initial_balance',
        'current_balance',
        'profit_target',
        'consistency_rule_percent',
        'daily_drawdown_limit_percent',
        'max_loss_limit_percent',
        'timezone',
        'trading_day_reset_timezone',
        'trading_day_reset_time',
        'status',
    ];

    public function trades()
    {
        return $this->hasMany(Trade::class, 'account_id');
    }

    public function alerts()
    {
        return $this->hasMany(AccountAlert::class, 'account_id');
    }

    public function importBatches()
    {
        return $this->hasMany(TradeImportBatch::class, 'account_id');
    }

    public function dailyStats()
    {
        return $this->hasMany(DailyAccountStat::class, 'account_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(AccountActivityLog::class, 'account_id');
    }
}
