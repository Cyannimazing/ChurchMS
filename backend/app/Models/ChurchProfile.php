<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChurchProfile extends Model
{
    protected $table = 'ChurchProfile';
    protected $primaryKey = 'ChurchID';
    protected $fillable = [
        'Description',
        'ParishDetails',
        'ProfilePicturePath',
    ];

    /**
     * Get the church that this profile belongs to.
     */
    public function church()
    {
        return $this->hasOne(Church::class, 'ChurchID', 'ChurchID');
    }
}