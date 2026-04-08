<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TradeImportBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'account_id',
        'source',
        'file_name',
        'idempotency_key',
        'status',
        'total_rows',
        'imported_count',
        'duplicate_count',
        'error_count',
        'error_message',
        'meta',
        'imported_at',
        'reverted_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'imported_at' => 'datetime',
        'reverted_at' => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }

    public function trades()
    {
        return $this->hasMany(Trade::class, 'import_batch_id');
    }
}
