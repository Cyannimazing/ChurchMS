<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\CertificateConfiguration;
use App\Models\Church;
use Illuminate\Support\Facades\Validator;

class CertificateConfigurationController extends Controller
{
    /**
     * Get certificate configuration for a church
     */
    public function getConfiguration(string $churchName, string $certificateType = 'marriage'): JsonResponse
    {
        try {
            // Find the church by name (using same logic as other controllers)
            $churchName = preg_replace('/:\d+$/', '', $churchName);
            $name = str_replace('-', ' ', ucwords($churchName, '-'));
            $church = Church::whereRaw('LOWER(ChurchName) = ?', [strtolower($name)])
                           ->where('ChurchStatus', Church::STATUS_ACTIVE)
                           ->first();

            if (!$church) {
                return response()->json([
                    'error' => 'Church not found or is not active.'
                ], 404);
            }

            // Get certificate configuration
            $config = CertificateConfiguration::where('ChurchID', $church->ChurchID)
                                            ->where('CertificateType', $certificateType)
                                            ->first();

            return response()->json([
                'church' => [
                    'ChurchID' => $church->ChurchID,
                    'ChurchName' => $church->ChurchName,
                ],
                'configuration' => $config ? [
                    'CertificateConfigID' => $config->CertificateConfigID,
                    'CertificateType' => $config->CertificateType,
                    'sacrament_service_id' => $config->SacramentServiceID,
                    'field_mappings' => $config->field_mappings,
                    'form_data' => $config->form_data,
                ] : null
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while fetching certificate configuration.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save certificate configuration for a church
     */
    public function saveConfiguration(Request $request, string $churchName): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'certificate_type' => 'required|string|in:marriage,baptism,confirmation,first-communion',
                'sacrament_service_id' => 'nullable|integer|exists:sacrament_service,ServiceID',
                'field_mappings' => 'nullable|array',
                'form_data' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed.',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find the church by name
            $churchName = preg_replace('/:\d+$/', '', $churchName);
            $name = str_replace('-', ' ', ucwords($churchName, '-'));
            $church = Church::whereRaw('LOWER(ChurchName) = ?', [strtolower($name)])
                           ->where('ChurchStatus', Church::STATUS_ACTIVE)
                           ->first();

            if (!$church) {
                return response()->json([
                    'error' => 'Church not found or is not active.'
                ], 404);
            }

            // Update or create certificate configuration
            $config = CertificateConfiguration::updateOrCreate(
                [
                    'ChurchID' => $church->ChurchID,
                    'CertificateType' => $request->certificate_type,
                ],
                [
                    'SacramentServiceID' => $request->sacrament_service_id,
                    'field_mappings' => $request->field_mappings,
                    'form_data' => $request->form_data,
                ]
            );

            return response()->json([
                'message' => 'Certificate configuration saved successfully.',
                'configuration' => [
                    'CertificateConfigID' => $config->CertificateConfigID,
                    'CertificateType' => $config->CertificateType,
                    'sacrament_service_id' => $config->SacramentServiceID,
                    'field_mappings' => $config->field_mappings,
                    'form_data' => $config->form_data,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while saving certificate configuration.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}