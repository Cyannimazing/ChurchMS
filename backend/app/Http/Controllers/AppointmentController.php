<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Church;
use App\Models\SacramentService;
use App\Models\ServiceSchedule;

class AppointmentController extends Controller
{
    /**
     * Submit a simplified sacrament application (no form data required)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Basic validation
            $validator = Validator::make($request->all(), [
                'church_id' => 'required|integer|exists:Church,ChurchID',
                'service_id' => 'required|integer|exists:sacrament_service,ServiceID',
                'schedule_id' => 'required|integer|exists:service_schedules,ScheduleID',
                'schedule_time_id' => 'required|integer|exists:schedule_times,ScheduleTimeID',
                'selected_date' => 'required|date|after_or_equal:today',
                'status' => 'sometimes|in:pending,accepted,rejected'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed.',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify user is authenticated
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'error' => 'Authentication required.'
                ], 401);
            }

            // Verify church is active and public
            $church = Church::where('ChurchID', $request->church_id)
                          ->where('ChurchStatus', Church::STATUS_ACTIVE)
                          ->where('IsPublic', true)
                          ->first();

            if (!$church) {
                return response()->json([
                    'error' => 'Church not found or not available.'
                ], 404);
            }

            // Verify service belongs to church
            $service = SacramentService::where('ServiceID', $request->service_id)
                                     ->where('ChurchID', $request->church_id)
                                     ->first();

            if (!$service) {
                return response()->json([
                    'error' => 'Service not found or not available.'
                ], 404);
            }

            // Verify schedule belongs to service
            $schedule = ServiceSchedule::where('ScheduleID', $request->schedule_id)
                                     ->where('ServiceID', $request->service_id)
                                     ->first();

            if (!$schedule) {
                return response()->json([
                    'error' => 'Schedule not found.'
                ], 404);
            }

            // Verify schedule time belongs to schedule
            $scheduleTime = DB::table('schedule_times')
                ->where('ScheduleTimeID', $request->schedule_time_id)
                ->where('ScheduleID', $request->schedule_id)
                ->first();

            if (!$scheduleTime) {
                return response()->json([
                    'error' => 'Schedule time not found.'
                ], 404);
            }

            // Check for duplicate application
            $existingAppointment = DB::table('Appointment')
                ->where('UserID', $user->id)
                ->where('ServiceID', $request->service_id)
                ->where('ScheduleID', $request->schedule_id)
                ->where('ScheduleTimeID', $request->schedule_time_id)
                ->whereDate('AppointmentDate', $request->selected_date)
                ->whereIn('Status', ['Pending', 'Approved'])
                ->first();

            if ($existingAppointment) {
                return response()->json([
                    'error' => 'You already have an application for this service, date, and time slot.'
                ], 409);
            }

            // Combine the selected date with the schedule time's start time
            $appointmentDateTime = \Carbon\Carbon::parse($request->selected_date)
                ->setTimeFromTimeString($scheduleTime->StartTime)
                ->format('Y-m-d H:i:s');

            // Create appointment
            $appointmentData = [
                'UserID' => $user->id,
                'ChurchID' => $request->church_id,
                'ServiceID' => $request->service_id,
                'ScheduleID' => $request->schedule_id,
                'ScheduleTimeID' => $request->schedule_time_id,
                'AppointmentDate' => $appointmentDateTime,
                'Status' => ucfirst($request->get('status', 'pending')),
                'Notes' => 'Simple application submission - no form data provided',
                'created_at' => now(),
                'updated_at' => now()
            ];

            $appointmentId = DB::table('Appointment')->insertGetId($appointmentData);

            return response()->json([
                'success' => true,
                'message' => 'Your sacrament application has been submitted successfully.',
                'application' => [
                    'id' => $appointmentId,
                    'church_name' => $church->ChurchName,
                    'service_name' => $service->ServiceName,
                    'appointment_date' => $appointmentDateTime,
                    'status' => ucfirst($request->get('status', 'pending'))
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while submitting your application.',
                'details' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Get user's appointments
     */
    public function getUserAppointments(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'error' => 'Authentication required.'
                ], 401);
            }

            $appointments = DB::table('Appointment as a')
                             ->join('Church as c', 'a.ChurchID', '=', 'c.ChurchID')
                             ->join('sacrament_service as s', 'a.ServiceID', '=', 's.ServiceID')
                             ->join('schedule_times as st', 'a.ScheduleTimeID', '=', 'st.ScheduleTimeID')
                             ->where('a.UserID', $user->id)
                             ->orderBy('a.AppointmentDate', 'desc')
                             ->select([
                                 'a.AppointmentID',
                                 'a.AppointmentDate',
                                 'a.Status',
                                 'a.Notes',
                                 'c.ChurchName',
                                 's.ServiceName',
                                 's.Description as ServiceDescription',
                                 'st.StartTime',
                                 'st.EndTime'
                             ])
                             ->get();

            return response()->json([
                'appointments' => $appointments
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while fetching appointments.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get appointment details
     */
    public function show(Request $request, int $appointmentId): JsonResponse
    {
        try {
            // Get appointment with related data (no user restriction for church staff)
            $appointment = DB::table('Appointment as a')
                            ->join('Church as c', 'a.ChurchID', '=', 'c.ChurchID')
                            ->join('sacrament_service as s', 'a.ServiceID', '=', 's.ServiceID')
                            ->where('a.AppointmentID', $appointmentId)
                            ->select([
                                'a.AppointmentID',
                                'a.AppointmentDate',
                                'a.Status',
                                'a.Notes',
                                'c.ChurchName',
                                'c.ChurchID',
                                's.ServiceName',
                                's.ServiceID',
                                's.Description as ServiceDescription'
                            ])
                            ->first();

            if (!$appointment) {
                return response()->json([
                    'error' => 'Appointment not found.'
                ], 404);
            }

            // Skip form answers for now

            return response()->json([
                'appointment' => $appointment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while fetching appointment details.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get appointments for a specific church (for church staff)
     */
    public function getChurchAppointments(Request $request, $churchName): JsonResponse
    {
        try {
            // Convert URL-friendly church name to proper case (e.g., "humble" to "Humble")
            $name = str_replace('-', ' ', ucwords($churchName, '-'));

            // Find the church by name (case-insensitive)
            $church = DB::table('Church')
                ->whereRaw('LOWER(ChurchName) = ?', [strtolower($name)])
                ->first();

            if (!$church) {
                return response()->json(['error' => 'Church not found'], 404);
            }

            // Get appointments for the church with user and service information
            $appointments = DB::table('Appointment as a')
                ->join('users as u', 'a.UserID', '=', 'u.id')
                ->join('user_profiles as p', 'u.id', '=', 'p.user_id')
                ->join('sacrament_service as s', 'a.ServiceID', '=', 's.ServiceID')
                ->join('schedule_times as st', 'a.ScheduleTimeID', '=', 'st.ScheduleTimeID')
                ->where('a.ChurchID', $church->ChurchID)
                ->orderBy('a.AppointmentDate', 'desc')
                ->select([
                    'a.AppointmentID',
                    'a.AppointmentDate',
                    'a.Status',
                    'a.Notes',
                    'u.email as UserEmail',
                    DB::raw("p.first_name || ' ' || COALESCE(p.middle_name || '. ', '') || p.last_name as UserName"),
                    's.ServiceName',
                    's.Description as ServiceDescription',
                    'st.StartTime',
                    'st.EndTime'
                ])
                ->get();

            return response()->json([
                'ChurchID' => $church->ChurchID,
                'ChurchName' => $church->ChurchName,
                'appointments' => $appointments
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while fetching church appointments.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update appointment status with slot management
     */
    public function updateStatus(Request $request, int $appointmentId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|string|in:Pending,Approved,Rejected,Cancelled,Completed'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Invalid status provided.',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get current appointment details before updating
            $appointment = DB::table('Appointment')
                ->where('AppointmentID', $appointmentId)
                ->first();

            if (!$appointment) {
                return response()->json([
                    'error' => 'Appointment not found.'
                ], 404);
            }

            $newStatus = $request->status;
            $oldStatus = $appointment->Status;

            // Start database transaction for atomic operations
            DB::beginTransaction();

            try {
                // Update appointment status
                $updated = DB::table('Appointment')
                    ->where('AppointmentID', $appointmentId)
                    ->update([
                        'Status' => $newStatus,
                        'updated_at' => now()
                    ]);

                if (!$updated) {
                    throw new \Exception('Failed to update appointment status.');
                }

                // Handle slot management based on status changes
                $this->updateSlotAvailability($appointment, $oldStatus, $newStatus);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Appointment status updated successfully.',
                    'status' => $newStatus,
                    'previous_status' => $oldStatus
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while updating appointment status.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update slot availability based on appointment status changes
     */
    private function updateSlotAvailability($appointment, string $oldStatus, string $newStatus): void
    {
        // Get the appointment date (just the date part)
        $appointmentDate = \Carbon\Carbon::parse($appointment->AppointmentDate)->format('Y-m-d');
        $scheduleTimeId = $appointment->ScheduleTimeID;
        $scheduleId = $appointment->ScheduleID;

        // Get schedule capacity to initialize slots if needed
        $schedule = DB::table('service_schedules')
            ->where('ScheduleID', $scheduleId)
            ->first();

        if (!$schedule) {
            throw new \Exception('Schedule not found.');
        }

        $slotCapacity = $schedule->SlotCapacity;

        // Ensure date slot exists for this schedule time and date
        $this->ensureDateSlotExists($scheduleTimeId, $appointmentDate, $slotCapacity);

        // Determine slot adjustment based on status transition
        $slotAdjustment = $this->calculateSlotAdjustment($oldStatus, $newStatus);

        if ($slotAdjustment !== 0) {
            // Update remaining slots
            $this->adjustRemainingSlots($scheduleTimeId, $appointmentDate, $slotAdjustment, $slotCapacity);
        }
    }

    /**
     * Calculate how many slots to adjust based on status change
     */
    private function calculateSlotAdjustment(string $oldStatus, string $newStatus): int
    {
        // Define which statuses "consume" a slot (reduce availability)
        $slotConsumingStatuses = ['Approved', 'Completed'];
        
        $oldConsumesSlot = in_array($oldStatus, $slotConsumingStatuses);
        $newConsumesSlot = in_array($newStatus, $slotConsumingStatuses);

        if (!$oldConsumesSlot && $newConsumesSlot) {
            // Transitioning to a slot-consuming status: decrease available slots
            return -1;
        } elseif ($oldConsumesSlot && !$newConsumesSlot) {
            // Transitioning from a slot-consuming status: increase available slots
            return 1;
        }
        
        // No slot adjustment needed
        return 0;
    }

    /**
     * Ensure a date slot record exists for the given schedule time and date
     */
    private function ensureDateSlotExists(int $scheduleTimeId, string $date, int $slotCapacity): void
    {
        $existingSlot = DB::table('schedule_time_date_slots')
            ->where('ScheduleTimeID', $scheduleTimeId)
            ->where('SlotDate', $date)
            ->first();

        if (!$existingSlot) {
            // Create new date slot record with full capacity
            DB::table('schedule_time_date_slots')->insert([
                'ScheduleTimeID' => $scheduleTimeId,
                'SlotDate' => $date,
                'RemainingSlots' => $slotCapacity,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    /**
     * Adjust remaining slots for a specific schedule time and date
     */
    private function adjustRemainingSlots(int $scheduleTimeId, string $date, int $adjustment, int $maxCapacity): void
    {
        // Get current slot info
        $currentSlot = DB::table('schedule_time_date_slots')
            ->where('ScheduleTimeID', $scheduleTimeId)
            ->where('SlotDate', $date)
            ->first();

        if (!$currentSlot) {
            throw new \Exception('Date slot record not found.');
        }

        $newRemainingSlots = $currentSlot->RemainingSlots + $adjustment;

        // Ensure remaining slots don't go below 0 or above capacity
        if ($newRemainingSlots < 0) {
            throw new \Exception('Cannot approve appointment: No slots remaining for this date and time.');
        }
        
        if ($newRemainingSlots > $maxCapacity) {
            $newRemainingSlots = $maxCapacity;
        }

        // Update the remaining slots
        $updated = DB::table('schedule_time_date_slots')
            ->where('ScheduleTimeID', $scheduleTimeId)
            ->where('SlotDate', $date)
            ->update([
                'RemainingSlots' => $newRemainingSlots,
                'updated_at' => now()
            ]);

        if (!$updated) {
            throw new \Exception('Failed to update slot availability.');
        }
    }
}
