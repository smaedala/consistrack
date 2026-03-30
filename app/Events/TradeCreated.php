<?php

namespace App\Events;

use App\Models\Trade;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TradeCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Trade $trade;

    public function __construct(Trade $trade)
    {
        $this->trade = $trade;
    }
}
