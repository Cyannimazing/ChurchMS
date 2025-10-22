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
        Schema::table('church_transactions', function (Blueprint $table) {
            // Drop index first (SQLite requirement)
            $table->dropIndex(['paymongo_session_id']);
            // Drop paymongo_session_id and metadata columns
            $table->dropColumn(['paymongo_session_id', 'metadata']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('church_transactions', function (Blueprint $table) {
            // Restore dropped columns
            $table->string('paymongo_session_id')->after('appointment_id');
            $table->json('metadata')->nullable()->after('notes');
        });
    }
};
