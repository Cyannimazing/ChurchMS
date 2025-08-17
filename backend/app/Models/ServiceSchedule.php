<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceSchedule extends Model
{
    use HasFactory;

    protected $table = 'service_schedules';
    protected $primaryKey = 'ScheduleID';

    protected $fillable = [
        'ServiceID',
        'StartDate',
        'EndDate',
        'SlotCapacity',
        'RemainingSlot',
    ];

    protected $casts = [
        'StartDate' => 'date',
        'EndDate' => 'date',
        'SlotCapacity' => 'integer',
        'RemainingSlot' => 'integer',
    ];

    /**
     * Get the sacrament service that owns this schedule
     */
    public function sacramentService()
    {
        return $this->belongsTo(SacramentService::class, 'ServiceID', 'ServiceID');
    }

    /**
     * Get the recurrence patterns for this schedule
     */
    public function recurrences()
    {
        return $this->hasMany(ScheduleRecurrence::class, 'ScheduleID', 'ScheduleID');
    }

    /**
     * Get the time slots for this schedule
     */
    public function times()
    {
        return $this->hasMany(ScheduleTime::class, 'ScheduleID', 'ScheduleID');
    }

    /**
     * Get the fees for this schedule
     */
    public function fees()
    {
        return $this->hasMany(ScheduleFee::class, 'ScheduleID', 'ScheduleID');
    }

    /**
     * Check if schedule is active (within date range)
     */
    public function isActive()
    {
        $today = now()->toDateString();
        
        if ($this->StartDate > $today) {
            return false; // Schedule hasn't started yet
        }
        
        if ($this->EndDate && $this->EndDate < $today) {
            return false; // Schedule has ended
        }
        
        return true;
    }

    /**
     * Check if there are available slots
     */
    public function hasAvailableSlots()
    {
        return $this->RemainingSlot > 0;
    }
}
