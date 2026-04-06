<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyAccountStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'trading_day',
        'metrics',
        'computed_at',
    ];

    protected $casts = [
        'trading_day' => 'date',
        'metrics' => 'array',
        'computed_at' => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }
}

