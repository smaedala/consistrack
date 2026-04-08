<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trade_import_batches', function (Blueprint $table) {
            $table->string('idempotency_key', 120)->nullable()->after('file_name');
            $table->unique(['account_id', 'idempotency_key'], 'trade_import_batches_account_idem_unique');
        });
    }

    public function down(): void
    {
        Schema::table('trade_import_batches', function (Blueprint $table) {
            $table->dropUnique('trade_import_batches_account_idem_unique');
            $table->dropColumn('idempotency_key');
        });
    }
};

