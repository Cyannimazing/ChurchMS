<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Church;
use App\Models\SacramentService;
use App\Models\ServiceSchedule;
use App\Models\ServiceInputField;
use App\Models\ServiceRequirement;

class AppointmentController extends Controller
{
    /**
     * Submit a new appointment application
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Parse form_data if it comes as JSON string (from multipart/form-data)
            $requestData = $request->all();
            if (isset($requestData['form_data']) && is_string($requestData['form_data'])) {
                $requestData['form_data'] = json_decode($requestData['form_data'], true);
            }

            // Basic validation
            $validator = Validator::make($requestData, [
                'church_id' => 'required|integer|exists:Church,ChurchID',
                'service_id' => 'required|integer|exists:sacrament_service,ServiceID',
                'schedule_id' => 'required|integer|exists:service_schedules,ScheduleID',
                'schedule_time_id' => 'required|integer|exists:schedule_times,ScheduleTimeID',
                'selected_date' => 'required|date|after_or_equal:today',
                'form_data' => 'required|array',
                'notes' => 'nullable|string|max:1000',
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
            $schedule = \App\Models\ServiceSchedule::where('ScheduleID', $request->schedule_id)
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

            // Check/create slot tracking record for this specific ScheduleTimeID and date
            $slotRecord = DB::table('schedule_time_date_slots')
                ->where('ScheduleTimeID', $request->schedule_time_id)
                ->where('SlotDate', $request->selected_date)
                ->first();

            // If no slot record exists, create one with full capacity
            if (!$slotRecord) {
                DB::table('schedule_time_date_slots')->insert([
                    'ScheduleTimeID' => $request->schedule_time_id,
                    'SlotDate' => $request->selected_date,
                    'RemainingSlots' => $schedule->SlotCapacity,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $remainingSlots = $schedule->SlotCapacity;
            } else {
                $remainingSlots = $slotRecord->RemainingSlots;
            }

            // Check if slots are available
            if ($remainingSlots <= 0) {
                return response()->json([
                    'error' => 'No slots available for the selected date and time.'
                ], 422);
            }

            // Get form fields for validation
            $inputFields = ServiceInputField::where('ServiceID', $request->service_id)
                                          ->orderBy('SortOrder')
                                          ->get();

            // Use parsed form data
            $formData = $requestData['form_data'];

            // Validate required form fields
            foreach ($inputFields as $field) {
                // Skip non-input field types
                if (in_array($field->InputType, ['heading', 'paragraph', 'label', 'container'])) {
                    continue;
                }
                
                $fieldKey = "field_{$field->InputFieldID}";
                $fieldValue = $formData[$fieldKey] ?? null;
                
                if ($field->IsRequired && empty($fieldValue)) {
                    return response()->json([
                        'error' => "Field '{$field->Label}' is required."
                    ], 422);
                }
            }

            // Combine the selected date with the schedule time's start time
            $appointmentDateTime = \Carbon\Carbon::parse($request->selected_date)
                ->setTimeFromTimeString($scheduleTime->StartTime)
                ->format('Y-m-d H:i:s');

            DB::beginTransaction();

            try {
                // Create appointment
                $appointmentData = [
                    'UserID' => $user->id,
                    'ChurchID' => $request->church_id,
                    'ServiceID' => $request->service_id,
                    'ScheduleID' => $request->schedule_id,
                    'ScheduleTimeID' => $request->schedule_time_id,
                    'AppointmentDate' => $appointmentDateTime,
                    'Status' => 'Pending',
                    'Notes' => $request->notes
                ];

                $appointmentId = DB::table('Appointment')->insertGetId($appointmentData);

                // Save form field answers
                foreach ($inputFields as $field) {
                    // Skip non-input field types
                    if (in_array($field->InputType, ['heading', 'paragraph', 'label', 'container'])) {
                        continue;
                    }
                    
                    $fieldKey = "field_{$field->InputFieldID}";
                    $fieldValue = $formData[$fieldKey] ?? null;
                    
                    if ($fieldValue !== null && $fieldValue !== '') {
                        DB::table('AppointmentInputAnswer')->insert([
                            'AppointmentID' => $appointmentId,
                            'InputFieldID' => $field->InputFieldID,
                            'AnswerText' => is_array($fieldValue) ? json_encode($fieldValue) : (string)$fieldValue
                        ]);
                    }
                }

                // Handle file uploads if any
                $uploadedDocuments = $request->file('documents', []);
                $requirements = ServiceRequirement::where('ServiceID', $request->service_id)
                                                ->orderBy('SortOrder')
                                                ->get();

                foreach ($requirements as $index => $requirement) {
                    $fileKey = "document_{$index}";
                    
                    if (isset($uploadedDocuments[$fileKey])) {
                        $file = $uploadedDocuments[$fileKey];
                        
                        // Generate unique filename
                        $originalName = $file->getClientOriginalName();
                        $extension = $file->getClientOriginalExtension();
                        $storedName = Str::uuid() . '.' . $extension;
                        
                        // Store file
                        $filePath = $file->storeAs('appointments/documents', $storedName, 'public');
                        
                        // Save document record
                        DB::table('AppointmentDocument')->insert([
                            'AppointmentID' => $appointmentId,
                            'FilePath' => $filePath,
                            'OriginalFileName' => $originalName,
                            'StoredFileName' => $storedName,
                            'FileSize' => $file->getSize(),
                            'MimeType' => $file->getMimeType()
                        ]);
                    } elseif ($requirement->IsMandatory) {
                        throw new \Exception("Required document '{$requirement->Description}' is missing.");
                    }
                }

                // Decrement the remaining slots for this specific ScheduleTimeID and date
                DB::table('schedule_time_date_slots')
                    ->where('ScheduleTimeID', $request->schedule_time_id)
                    ->where('SlotDate', $request->selected_date)
                    ->decrement('RemainingSlots', 1);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Your appointment application has been submitted successfully.',
                    'appointment_id' => $appointmentId,
                    'appointment' => [
                        'id' => $appointmentId,
                        'church_name' => $church->ChurchName,
                        'service_name' => $service->ServiceName,
                        'appointment_date' => $appointmentDateTime,
                        'status' => 'Pending'
                    ]
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while submitting your appointment.',
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
                             ->where('a.UserID', $user->id)
                             ->orderBy('a.AppointmentDate', 'desc')
                             ->select([
                                 'a.AppointmentID',
                                 'a.AppointmentDate',
                                 'a.Status',
                                 'a.Notes',
                                 'c.ChurchName',
                                 's.ServiceName',
                                 's.Description as ServiceDescription'
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
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'error' => 'Authentication required.'
                ], 401);
            }

            // Get appointment with related data
            $appointment = DB::table('Appointment as a')
                            ->join('Church as c', 'a.ChurchID', '=', 'c.ChurchID')
                            ->join('sacrament_service as s', 'a.ServiceID', '=', 's.ServiceID')
                            ->where('a.AppointmentID', $appointmentId)
                            ->where('a.UserID', $user->id)
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

            // Get form answers
            $answers = DB::table('AppointmentInputAnswer as aia')
                        ->join('ServiceInputField as sif', 'aia.InputFieldID', '=', 'sif.InputFieldID')
                        ->where('aia.AppointmentID', $appointmentId)
                        ->select([
                            'sif.Label',
                            'sif.InputType',
                            'aia.AnswerText'
                        ])
                        ->get();

            // Get documents
            $documents = DB::table('AppointmentDocument')
                          ->where('AppointmentID', $appointmentId)
                          ->select([
                              'DocumentID',
                              'OriginalFileName',
                              'FileSize',
                              'MimeType'
                          ])
                          ->get();

            return response()->json([
                'appointment' => $appointment,
                'answers' => $answers,
                'documents' => $documents
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while fetching appointment details.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
