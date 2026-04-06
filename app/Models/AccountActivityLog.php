<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'user_id',
        'event_type',
        'description',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function account()
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

