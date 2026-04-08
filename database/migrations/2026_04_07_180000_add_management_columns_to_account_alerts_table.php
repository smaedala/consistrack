<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('account_alerts', function (Blueprint $table) {
            $table->timestamp('acknowledged_at')->nullable()->after('level');
            $table->timestamp('snoozed_until')->nullable()->after('acknowledged_at');
        });
    }

    public function down(): void
    {
        Schema::table('account_alerts', function (Blueprint $table) {
            $table->dropColumn(['acknowledged_at', 'snoozed_until']);
        });
    }
};
