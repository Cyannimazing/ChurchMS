<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Church', function (Blueprint $table) {
            $table->id('ChurchID');
            $table->string('ChurchName', 100)->nullable(false);
            $table->boolean('IsPublic')->default(false);
            $table->decimal('Latitude', 10, 8)->nullable();
            $table->decimal('Longitude', 11, 8)->nullable();
            $table->enum('ChurchStatus', ['Active', 'Pending'])->default('Pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Church');
    }
};
