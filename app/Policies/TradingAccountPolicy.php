<?php

namespace App\Policies;

use App\Models\TradingAccount;
use App\Models\User;

class TradingAccountPolicy
{
    public function view(User $user, TradingAccount $account): bool
    {
        return $user->id === $account->user_id;
    }

    public function update(User $user, TradingAccount $account): bool
    {
        return $user->id === $account->user_id;
    }
}
