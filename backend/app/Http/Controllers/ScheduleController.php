<?php

namespace App\Http\Controllers;

use App\Models\ServiceSchedule;
use App\Models\ScheduleRecurrence;
use App\Models\ScheduleTime;
use App\Models\ScheduleFee;
use App\Models\SacramentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ScheduleController extends Controller
{
    /**
     * Get all schedules for a specific service
     */
    public function getServiceSchedules($serviceId)
    {
        try {
            $service = SacramentService::findOrFail($serviceId);
            
            $schedules = ServiceSchedule::with(['recurrences', 'times', 'fees'])
                ->where('ServiceID', $serviceId)
                ->orderBy('StartDate', 'asc')
                ->get();
            
            return response()->json([
                'success' => true,
                'service' => $service,
                'schedules' => $schedules
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch schedules: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific schedule with all its details
     */
    public function getSchedule($scheduleId)
    {
        try {
            $schedule = ServiceSchedule::with(['recurrences', 'times', 'fees', 'sacramentService'])
                ->findOrFail($scheduleId);
            
            return response()->json([
                'success' => true,
                'schedule' => $schedule
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Schedule not found'
            ], 404);
        }
    }

    /**
     * Create a new service schedule
     */
    public function store(Request $request, $serviceId)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'slot_capacity' => 'required|integer|min:1',
            
            // Recurrence rules
            'recurrences' => 'required|array|min:1',
            'recurrences.*.recurrence_type' => 'required|string',
            'recurrences.*.day_of_week' => 'nullable|integer',
            'recurrences.*.week_of_month' => 'nullable|integer',
            'recurrences.*.specific_date' => 'nullable|date',
            
            // Time slots
            'times' => 'required|array|min:1',
            'times.*.start_time' => 'required|string',
            'times.*.end_time' => 'required|string',
            
            // Fees (optional)
            'fees' => 'nullable|array',
            'fees.*.fee_type' => 'nullable|in:Fee,Donation',
            'fees.*.fee' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Create the main schedule
            $schedule = ServiceSchedule::create([
                'ServiceID' => $serviceId,
                'StartDate' => $request->start_date,
                'EndDate' => $request->end_date,
                'SlotCapacity' => $request->slot_capacity,
            ]);

            // Create recurrence patterns
            foreach ($request->recurrences as $recurrenceData) {
                $data = [
                    'ScheduleID' => $schedule->ScheduleID,
                    'RecurrenceType' => $recurrenceData['recurrence_type'],
                ];

                switch ($recurrenceData['recurrence_type']) {
                    case 'Weekly':
                        $data['DayOfWeek'] = $recurrenceData['day_of_week'];
                        break;
                    case 'MonthlyNth':
                        $data['DayOfWeek'] = $recurrenceData['day_of_week'];
                        $data['WeekOfMonth'] = $recurrenceData['week_of_month'];
                        break;
                    case 'OneTime':
                        $data['SpecificDate'] = $recurrenceData['specific_date'];
                        break;
                }

                ScheduleRecurrence::create($data);
            }

            // Create time slots
            foreach ($request->times as $timeSlot) {
                ScheduleTime::create([
                    'ScheduleID' => $schedule->ScheduleID,
                    'StartTime' => $timeSlot['start_time'],
                    'EndTime' => $timeSlot['end_time'],
                ]);
            }

            // Create fees if provided
            if ($request->has('fees') && is_array($request->fees) && count($request->fees) > 0) {
                foreach ($request->fees as $fee) {
                    if (isset($fee['fee_type']) && isset($fee['fee']) && !empty($fee['fee_type'])) {
                        ScheduleFee::create([
                            'ScheduleID' => $schedule->ScheduleID,
                            'FeeType' => $fee['fee_type'],
                            'Fee' => floatval($fee['fee']),
                        ]);
                    }
                }
            }

            DB::commit();

            // Load the created schedule with relationships
            $schedule->load(['recurrences', 'times', 'fees']);

            return response()->json([
                'success' => true,
                'message' => 'Schedule created successfully',
                'schedule' => $schedule
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create schedule: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing schedule
     */
    public function update(Request $request, $scheduleId)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'slot_capacity' => 'required|integer|min:1|max:1000',
            
            // Recurrence rules
            'recurrences' => 'required|array|min:1',
            'recurrences.*.recurrence_type' => 'required|in:Weekly,MonthlyNth,OneTime',
            'recurrences.*.day_of_week' => 'nullable|integer|between:0,6',
            'recurrences.*.week_of_month' => 'nullable|integer|between:1,5',
            'recurrences.*.specific_date' => 'nullable|date',
            
            // Time slots
            'times' => 'required|array|min:1',
            'times.*.start_time' => 'required|date_format:H:i',
            'times.*.end_time' => 'required|date_format:H:i|after:times.*.start_time',
            
            // Fees (optional)
            'fees' => 'nullable|array',
            'fees.*.fee_type' => 'required_with:fees|string',
            'fees.*.fee' => 'required_with:fees|numeric|min:0|max:9999.99',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            $schedule = ServiceSchedule::findOrFail($scheduleId);
            
            // Update the main schedule
            $schedule->update([
                'StartDate' => $request->start_date,
                'EndDate' => $request->end_date,
                'SlotCapacity' => $request->slot_capacity,
            ]);

            // Delete existing related records
            $schedule->recurrences()->delete();
            $schedule->times()->delete();
            $schedule->fees()->delete();

            // Recreate recurrence patterns
            foreach ($request->recurrences as $recurrenceData) {
                $data = [
                    'ScheduleID' => $schedule->ScheduleID,
                    'RecurrenceType' => $recurrenceData['recurrence_type'],
                ];

                switch ($recurrenceData['recurrence_type']) {
                    case 'Weekly':
                        $data['DayOfWeek'] = $recurrenceData['day_of_week'];
                        break;
                    case 'MonthlyNth':
                        $data['DayOfWeek'] = $recurrenceData['day_of_week'];
                        $data['WeekOfMonth'] = $recurrenceData['week_of_month'];
                        break;
                    case 'OneTime':
                        $data['SpecificDate'] = $recurrenceData['specific_date'];
                        break;
                }

                ScheduleRecurrence::create($data);
            }

            // Recreate time slots
            foreach ($request->times as $timeSlot) {
                ScheduleTime::create([
                    'ScheduleID' => $schedule->ScheduleID,
                    'StartTime' => $timeSlot['start_time'],
                    'EndTime' => $timeSlot['end_time'],
                ]);
            }

            // Recreate fees if provided
            if ($request->has('fees') && is_array($request->fees) && count($request->fees) > 0) {
                foreach ($request->fees as $fee) {
                    ScheduleFee::create([
                        'ScheduleID' => $schedule->ScheduleID,
                        'FeeType' => $fee['fee_type'],
                        'Fee' => $fee['fee'],
                    ]);
                }
            }

            DB::commit();

            // Load the updated schedule with relationships
            $schedule->load(['recurrences', 'times', 'fees']);

            return response()->json([
                'success' => true,
                'message' => 'Schedule updated successfully',
                'schedule' => $schedule
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update schedule: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a schedule
     */
    public function destroy($scheduleId)
    {
        try {
            $schedule = ServiceSchedule::findOrFail($scheduleId);
            
            // Check if schedule has any bookings (you'll need to implement this based on your booking system)
            // For now, we'll assume it's safe to delete
            
            $schedule->delete(); // This will cascade delete related records due to foreign key constraints
            
            return response()->json([
                'success' => true,
                'message' => 'Schedule deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete schedule: ' . $e->getMessage()
            ], 500);
        }
    }
}
