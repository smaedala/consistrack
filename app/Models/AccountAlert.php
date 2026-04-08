<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'alert_type',
        'payload',
        'level',
        'acknowledged_at',
        'snoozed_until',
    ];

    protected $casts = [
        'payload' => 'array',
        'acknowledged_at' => 'datetime',
        'snoozed_until' => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }
}
