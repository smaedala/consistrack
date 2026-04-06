<?php

namespace App\Services;

use App\Models\AccountActivityLog;
use App\Models\TradingAccount;
use App\Models\User;

class ActivityLogService
{
    public function log(
        TradingAccount $account,
        User $user,
        string $eventType,
        string $description,
        array $meta = []
    ): AccountActivityLog {
        return AccountActivityLog::create([
            'account_id' => $account->id,
            'user_id' => $user->id,
            'event_type' => $eventType,
            'description' => $description,
            'meta' => $meta,
        ]);
    }
}

