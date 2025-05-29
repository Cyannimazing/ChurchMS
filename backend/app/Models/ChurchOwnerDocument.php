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
        'DocumentPath', // Changed from DocumentData to DocumentPath
        'SubmissionDate',
    ];
    protected $casts = [
        'SubmissionDate' => 'datetime',
        // Removed DocumentData binary cast
    ];

    /**
     * Get the church associated with this document.
     */
    public function church()
    {
        return $this->belongsTo(Church::class, 'ChurchID', 'ChurchID'); // Changed to belongsTo
    }

    /**
     * Get the full URL to the document.
     *
     * @return string|null
     */
    public function getDocumentUrlAttribute()
    {
        return $this->DocumentPath ? asset('storage/' . $this->DocumentPath) : null;
    }
}
?>