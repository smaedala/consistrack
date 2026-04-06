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
        Schema::table('trades', function (Blueprint $table) {
            $table->foreignId('import_batch_id')
                ->nullable()
                ->after('account_id')
                ->constrained('trade_import_batches')
                ->nullOnDelete();

            $table->index(['account_id', 'import_batch_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trades', function (Blueprint $table) {
            $table->dropIndex(['account_id', 'import_batch_id']);
            $table->dropConstrainedForeignId('import_batch_id');
        });
    }
};

