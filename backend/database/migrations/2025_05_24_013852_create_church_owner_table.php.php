<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ChurchOwner', function (Blueprint $table) {
            $table->id('ChurchOwnerID');
            $table->foreignId('ChurchID')
                  ->constrained('Church', 'ChurchID')
                  ->onDelete('cascade')
                  ->unique(); // Each church has one owner
            $table->foreignId('UserID')
                  ->constrained('User', 'id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ChurchOwner');
    }
};