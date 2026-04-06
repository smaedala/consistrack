<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trade extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'import_batch_id',
        'symbol',
        'type',
        'lot_size',
        'entry_price',
        'exit_price',
        'pnl',
        'close_time',
        'strategy_tag',
        'external_id',
    ];

    protected $casts = [
        'close_time' => 'datetime',
        'pnl' => 'decimal:2',
    ];

    public function account()
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }

    public function importBatch()
    {
        return $this->belongsTo(TradeImportBatch::class, 'import_batch_id');
    }
}
