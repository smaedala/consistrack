<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CachedAccountMetric extends Model
{
    use HasFactory;

    protected $fillable = ['account_id', 'metrics', 'computed_at'];

    protected $casts = [
        'metrics' => 'array',
        'computed_at' => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }
}
