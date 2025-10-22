<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubServiceRequirement extends Model
{
    protected $table = 'sub_service_requirements';
    protected $primaryKey = 'RequirementID';
    
    protected $fillable = [
        'SubServiceID',
        'RequirementName',
        'SortOrder',
    ];
    
    protected $casts = [
        'SubServiceID' => 'integer',
        'SortOrder' => 'integer',
    ];
    
    /**
     * Get the sub-service that owns this requirement.
     */
    public function subService(): BelongsTo
    {
        return $this->belongsTo(SubService::class, 'SubServiceID', 'SubServiceID');
    }
}
