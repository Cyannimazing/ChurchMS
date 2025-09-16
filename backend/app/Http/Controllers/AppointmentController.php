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

            // Get complete form configuration for this sacrament service
            $formFields = DB::table('service_input_field')
                            ->where('ServiceID', $appointment->ServiceID)
                            ->orderBy('SortOrder')
                            ->get();

            // Get service requirements
            $requirements = DB::table('service_requirement')
                            ->where('ServiceID', $appointment->ServiceID)
                            ->orderBy('SortOrder')
                            ->get();

            // Get saved answers for this appointment
            $savedAnswers = DB::table('AppointmentInputAnswer')
                            ->where('AppointmentID', $appointmentId)
                            ->get()
                            ->keyBy('InputFieldID'); // Key by InputFieldID for easy lookup

            // Format complete form configuration for the frontend
            $formElements = [];
            $containerElement = null;
            
            // First pass: identify container element
            foreach ($formFields as $field) {
                if ($field->InputType === 'container') {
                    $containerElement = $field;
                    break;
                }
            }
            
            foreach ($formFields as $field) {
                $inputType = $field->InputType;
                // Map backend types to frontend types
                if ($inputType === 'phone') {
                    $inputType = 'tel';
                }

                // Determine containerId - elements inside container should reference container
                $containerId = null;
                if ($containerElement && $field->InputFieldID !== $containerElement->InputFieldID) {
                    // Check if element is positioned inside the container bounds
                    $containerX = $containerElement->x_position ?? 0;
                    $containerY = $containerElement->y_position ?? 0;
                    $containerWidth = $containerElement->width ?? 600;
                    $containerHeight = $containerElement->height ?? 400;
                    $containerPadding = 30; // Default padding
                    
                    $elementX = $field->x_position ?? 0;
                    $elementY = $field->y_position ?? 0;
                    $elementWidth = $field->width ?? 300;
                    $elementHeight = $field->height ?? 40;
                    
                    // Check if element is inside container bounds (accounting for padding)
                    if ($elementX >= $containerX + $containerPadding &&
                        $elementY >= $containerY + $containerPadding &&
                        $elementX + $elementWidth <= $containerX + $containerWidth - $containerPadding &&
                        $elementY + $elementHeight <= $containerY + $containerHeight - $containerPadding) {
                        $containerId = $containerElement->InputFieldID;
                        // Convert absolute position to relative position within container
                        $field->x_position = $elementX - $containerX - $containerPadding;
                        $field->y_position = $elementY - $containerY - $containerPadding;
                    }
                }

                // Get previously saved answer for this field, or blank if none
                $savedAnswer = $savedAnswers->get($field->InputFieldID);
                $answerText = $savedAnswer ? $savedAnswer->AnswerText : '';

                $formElements[] = [
                    'id' => $field->InputFieldID,
                    'type' => $inputType,
                    'label' => $field->Label,
                    'placeholder' => $field->Placeholder,
                    'required' => $field->IsRequired,
                    'options' => $field->Options ? json_decode($field->Options, true) : [],
                    'x' => $field->x_position ?? 0,
                    'y' => $field->y_position ?? 0,
                    'width' => $field->width ?? 300,
                    'height' => $field->height ?? 40,
                    'content' => $field->text_content ?? '',
                    'headingSize' => $field->text_size ?? 'h2',
                    'textAlign' => $field->text_align ?? 'left',
                    'textColor' => $field->text_color ?? '#000000',
                    'rows' => $field->textarea_rows ?? 3,
                    'zIndex' => $field->z_index ?? 1,
                    'containerId' => $containerId,
                    'answer' => $answerText,
                    // Additional styling properties for container
                    'backgroundColor' => $inputType === 'container' ? '#ffffff' : null,
                    'borderColor' => $inputType === 'container' ? '#e5e7eb' : null,
                    'borderWidth' => $inputType === 'container' ? 2 : null,
                    'borderRadius' => $inputType === 'container' ? 8 : null,
                    'padding' => $inputType === 'container' ? 30 : null,
                ];
            }

            // Format requirements
            $formRequirements = [];
            foreach ($requirements as $req) {
                $formRequirements[] = [
                    'description' => $req->Description,
                    'mandatory' => $req->IsMandatory
                ];
            }

            return response()->json([
                'appointment' => $appointment,
                'formConfiguration' => [
                    'form_elements' => $formElements,
                    'requirements' => $formRequirements
                ]
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

    /**
     * Save form data for an appointment
     */
    public function saveFormData(Request $request, int $appointmentId): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'formData' => 'required|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Invalid form data provided.',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify appointment exists
            $appointment = DB::table('Appointment')
                ->where('AppointmentID', $appointmentId)
                ->first();

            if (!$appointment) {
                return response()->json([
                    'error' => 'Appointment not found.'
                ], 404);
            }

            $formData = $request->formData;
            $savedAnswers = [];

            // Start transaction for atomic operations
            DB::beginTransaction();

            try {
                foreach ($formData as $fieldName => $answerText) {
                    // Extract field ID from field name (assuming format like "field_123" or just "123")
                    $inputFieldId = $this->extractFieldId($fieldName);
                    
                    if (!$inputFieldId) {
                        continue; // Skip invalid field names
                    }

                    // Verify the field exists and belongs to this appointment's service
                    $fieldExists = DB::table('service_input_field')
                        ->where('InputFieldID', $inputFieldId)
                        ->where('ServiceID', $appointment->ServiceID)
                        ->exists();

                    if (!$fieldExists) {
                        continue; // Skip fields that don't exist or don't belong to this service
                    }

                    // Insert or update the answer
                    DB::table('AppointmentInputAnswer')->updateOrInsert(
                        [
                            'AppointmentID' => $appointmentId,
                            'InputFieldID' => $inputFieldId
                        ],
                        [
                            'AnswerText' => $answerText,
                            'updated_at' => now()
                        ]
                    );

                    $savedAnswers[] = [
                        'field_id' => $inputFieldId,
                        'field_name' => $fieldName,
                        'answer' => $answerText
                    ];
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Form data saved successfully.',
                    'appointment_id' => $appointmentId,
                    'saved_answers' => $savedAnswers,
                    'total_answers' => count($savedAnswers)
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while saving form data.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract field ID from field name
     */
    private function extractFieldId(string $fieldName): ?int
    {
        // Try to extract numeric ID from various field name formats
        if (is_numeric($fieldName)) {
            return (int) $fieldName;
        }
        
        // Handle "field_123" format
        if (preg_match('/field[_-]?(\d+)/', $fieldName, $matches)) {
            return (int) $matches[1];
        }
        
        // Handle other numeric patterns
        if (preg_match('/\d+/', $fieldName, $matches)) {
            return (int) $matches[0];
        }
        
        return null;
    }
}
