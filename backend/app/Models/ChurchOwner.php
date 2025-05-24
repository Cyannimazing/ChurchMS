<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChurchOwner extends Model
{
    protected $table = 'ChurchOwner';
    protected $primaryKey = 'ChurchOwnerID';
    protected $fillable = [
        'ChurchID',
        'UserID',
    ];

    /**
     * Get the church associated with this ownership record.
     */
    public function church()
    {
        return $this->hasOne(Church::class, 'ChurchID', 'ChurchID');
    }

    /**
     * Get the user associated with this ownership record.
     */
    public function user()
    {
        return $this->hasOne(User::class, 'id', 'UserID');
    }
}