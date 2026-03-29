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
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function account()
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }
}
