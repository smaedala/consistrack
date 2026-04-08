<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('trading_accounts', function (Blueprint $table): void {
            $table->string('default_strategy_tag', 120)->nullable()->after('status');
            $table->string('trader_full_name', 120)->nullable()->after('default_strategy_tag');
            $table->string('trader_country', 80)->nullable()->after('trader_full_name');
            $table->string('trader_experience_level', 40)->nullable()->after('trader_country');
            $table->boolean('consistency_rule_enabled')->default(true)->after('consistency_rule_percent');
        });
    }

    public function down(): void
    {
        Schema::table('trading_accounts', function (Blueprint $table): void {
            $table->dropColumn([
                'default_strategy_tag',
                'trader_full_name',
                'trader_country',
                'trader_experience_level',
                'consistency_rule_enabled',
            ]);
        });
    }
};
