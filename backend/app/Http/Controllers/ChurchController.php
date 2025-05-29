<?php

namespace App\Http\Controllers;

use App\Models\Church;
use App\Models\ChurchOwnerDocument;
use App\Models\ChurchProfile;
use App\Models\ChurchSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ChurchController extends Controller
{
    public function getByName($churchName)
    {
        $name = str_replace('-', ' ', ucwords($churchName, '-'));
        $church = Church::whereRaw('LOWER(ChurchName) = ?', [strtolower($name)])->first();
        
        if (!$church) {
            return response()->json(['error' => 'Church not found'], 404);
        }
        
        return response()->json(['ChurchID' => $church->ChurchID]);
    }

    public function store(Request $request)
    {
    $validated = $request->validate([
        'ChurchName' => 'required|string|max:255',
        'Latitude' => 'required|numeric|between:-90,90',
        'Longitude' => 'required|numeric|between:-180,180',
        'Description' => 'nullable|string',
        'ParishDetails' => 'nullable|string',
        'ProfilePicture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        'SEC' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        'BIR' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        'BarangayPermit' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        'AuthorizationLetter' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        'RepresentativeID' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
    ]);

    $user = Auth::user();
    if (!$user) {
        return response()->json(['error' => 'User not authenticated'], 401);
    }

    $activeSubscription = ChurchSubscription::where('UserID', $user->id)
        ->where('Status', 'Active')
        ->where('EndDate', '>=', now())
        ->first();

    if (!$activeSubscription) {
        return response()->json(['error' => 'No active subscription'], 403);
    }

    $plan = $activeSubscription->plan;
    $churchCount = $user->churches()->count();

    if ($churchCount >= $plan->MaxChurchesAllowed) {
        return response()->json(['error' => 'Maximum churches reached for your plan'], 403);
    }

    return DB::transaction(function () use ($request, $validated, $user) {
        $church = Church::create([
            'ChurchName' => $validated['ChurchName'],
            'IsPublic' => false,
            'Latitude' => $validated['Latitude'],
            'Longitude' => $validated['Longitude'],
            'ChurchStatus' => Church::STATUS_PENDING,
            'user_id' => $user->id,
        ]);

        if ($validated['Description'] || $validated['ParishDetails'] || $request->hasFile('ProfilePicture')) {
            $profileData = [
                'ChurchID' => $church->ChurchID,
                'Description' => $validated['Description'] ?? null,
                'ParishDetails' => $validated['ParishDetails'] ?? null,
            ];

            if ($request->hasFile('ProfilePicture')) {
                $file = $request->file('ProfilePicture');
                $filename = $file->hashName(); // Generates a unique filename
                Storage::disk('church_documents')->put($filename, file_get_contents($file->path()));
                $profileData['ProfilePicturePath'] = $filename; // Store filename only
            }

            ChurchProfile::create($profileData);
        }

        $documentTypes = [
            'SEC' => 'SEC',
            'BIR' => 'BIR',
            'BarangayPermit' => 'Barangay Permit',
            'AuthorizationLetter' => 'Authorization Letter',
            'RepresentativeID' => 'Representative Government ID',
        ];

        foreach ($documentTypes as $inputName => $documentType) {
            if ($request->hasFile($inputName)) {
                $file = $request->file($inputName);
                $filename = $file->hashName(); // Generates a unique filename
                Storage::disk('church_documents')->put($filename, file_get_contents($file->path()));
                ChurchOwnerDocument::create([
                    'ChurchID' => $church->ChurchID,
                    'DocumentType' => $documentType,
                    'DocumentPath' => $filename, // Store filename only
                    'SubmissionDate' => now(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Church created. Awaiting admin approval.',
            'church' => $church,
        ], 201);
    });
}

    public function showOwnedChurches(Request $request)
    {
        $user = Auth::user();
        $churches = $user->churches()->with(['profile', 'documents'])->get();

        return response()->json([
            'churches' => $churches->map(function ($church) {
                return [
                    'ChurchID' => $church->ChurchID,
                    'ChurchName' => $church->ChurchName,
                    'ChurchStatus' => $church->ChurchStatus,
                    'IsPublic' => $church->IsPublic,
                    'Latitude' => $church->Latitude,
                    'Longitude' => $church->Longitude,
                    'Description' => $church->profile ? $church->profile->Description : null,
                    'ParishDetails' => $church->profile ? $church->profile->ParishDetails : null,
                    'DocumentCount' => $church->documents->count(),
                ];
            }),
        ]);
    }

    public function index(Request $request)
    {
        $churches = Church::with(['owner', 'profile', 'documents'])->get();

        return response()->json([
            'churches' => $churches->map(function ($church) {
                return [
                    'ChurchID' => $church->ChurchID,
                    'ChurchName' => $church->ChurchName,
                    'ChurchStatus' => $church->ChurchStatus,
                    'Owner' => $church->owner ? $church->owner->email : 'N/A',
                    'Description' => $church->profile ? $church->profile->Description : null,
                    'DocumentCount' => $church->documents->count(),
                ];
            }),
        ]);
    }

    public function updateStatus(Request $request, $churchId)
    {
        $validated = $request->validate([
            'ChurchStatus' => 'required|in:' . implode(',', Church::$validStatuses),
        ]);

        $church = Church::findOrFail($churchId);
        $church->update(['ChurchStatus' => $validated['ChurchStatus']]);

        return response()->json([
            'message' => 'Church status updated.',
            'church' => $church,
        ]);
    }

    public function reviewDocuments(Request $request, $churchId)
    {
        try {
            // Find church
            $church = Church::find($churchId);
            if (!$church) {
                return response()->json(['error' => 'Church not found'], 404);
            }

            // Get documents
            $documents = ChurchOwnerDocument::where('ChurchID', $churchId)->get();

            $documentData = $documents->map(function ($document) {
                $filePath = $document->DocumentPath ?? '';
                $fileExists = $filePath && Storage::disk('church_documents')->exists($filePath);

                return [
                    'DocumentID' => $document->DocumentID,
                    'DocumentType' => $document->DocumentType,
                    'SubmissionDate' => $document->SubmissionDate,
                    'FileExists' => $fileExists,
                ];
            })->toArray();

            return response()->json([
                'church' => [
                    'ChurchID' => $church->ChurchID,
                    'ChurchName' => $church->ChurchName,
                    'ChurchStatus' => $church->ChurchStatus,
                ],
                'documents' => $documentData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Server error while fetching documents',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function downloadDocument(Request $request, $documentId)
    {
        try {
            $document = ChurchOwnerDocument::find($documentId);
            if (!$document) {
                return response()->json(['error' => 'Document not found'], 404);
            }

            $filePath = $document->DocumentPath ?? '';
            if (!$filePath || !Storage::disk('church_documents')->exists($filePath)) {
                return response()->json(['error' => 'Document file not found'], 404);
            }

            $fullPath = Storage::disk('church_documents')->path($filePath);
            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mimeType = match ($extension) {
                'pdf' => 'application/pdf',
                'jpg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                default => 'application/octet-stream',
            };

            $fileName = rawurlencode($document->DocumentType . '.' . $extension);

            return response()->file($fullPath, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $fileName . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Server error while processing document',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
     
}