<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('account_alerts', function (Blueprint $table) {
            $table->index(['account_id', 'alert_type', 'created_at'], 'account_alerts_account_type_created_idx');
        });

        Schema::table('cached_account_metrics', function (Blueprint $table) {
            $table->index(['account_id', 'computed_at'], 'cached_account_metrics_account_computed_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('account_alerts', function (Blueprint $table) {
            $table->dropIndex('account_alerts_account_type_created_idx');
        });

        Schema::table('cached_account_metrics', function (Blueprint $table) {
            $table->dropIndex('cached_account_metrics_account_computed_idx');
        });
    }
};

