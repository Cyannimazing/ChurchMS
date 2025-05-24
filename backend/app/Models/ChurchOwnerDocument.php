<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChurchOwnerDocument extends Model
{
    protected $table = 'ChurchOwnerDocument';
    protected $primaryKey = 'DocumentID';
    protected $fillable = [
        'ChurchID',
        'DocumentType',
        'DocumentData',
    ];
    protected $casts = [
        'SubmissionDate' => 'datetime',
        'DocumentData' => 'binary',
    ];

    /**
     * Get the church associated with this document.
     */
    public function church()
    {
        return $this->hasOne(Church::class, 'ChurchID', 'ChurchID');
    }
}