<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Church extends Model
{
    protected $table = 'Church';
    protected $primaryKey = 'ChurchID';
    protected $fillable = [
        'ChurchName',
        'IsPublic',
        'Latitude',
        'Longitude',
        'ChurchStatus',
    ];
    protected $casts = [
        'IsPublic' => 'boolean',
        'ChurchStatus' => 'string',
        'Latitude' => 'decimal:8',
        'Longitude' => 'decimal:8',
    ];

    /**
     * Get the user who owns this church via the ChurchOwner table.
     */
    public function owner()
    {
        return $this->hasOneThrough(
            User::class,
            ChurchOwner::class,
            'ChurchID', // Foreign key on ChurchOwner pointing to Church
            'id', // Foreign key on User
            'ChurchID', // Local key on Church
            'UserID' // Local key on ChurchOwner
        );
    }

    /**
     * Get the church's profile.
     */
    public function profile()
    {
        return $this->hasOne(ChurchProfile::class, 'ChurchID', 'ChurchID');
    }

    /**
     * Get all documents submitted for this church.
     */
    public function documents()
    {
        return $this->hasMany(ChurchOwnerDocument::class, 'ChurchID', 'ChurchID');
    }
}