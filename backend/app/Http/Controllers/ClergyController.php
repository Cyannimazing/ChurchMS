<?php

namespace App\Http\Controllers;

use App\Models\Clergy;
use App\Models\Church;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClergyController extends Controller
{
    public function index(Request $request)
    {
        $churchName = $request->query('church_name');
        
        if (!$churchName) {
            return response()->json(['error' => 'Church name is required'], 400);
        }

        // Sanitize church name by removing any unexpected suffix (e.g., ":1")
        $churchName = preg_replace('/:\d+$/', '', $churchName);
        // Convert URL-friendly church name to proper case (e.g., "holy-church" to "Holy Church")
        $name = str_replace('-', ' ', ucwords($churchName, '-'));

        // Find the church by name (case-insensitive)
        $church = Church::whereRaw('LOWER(ChurchName) = ?', [strtolower($name)])->first();
        
        if (!$church) {
            return response()->json(['error' => 'Church not found'], 404);
        }

        $clergy = Clergy::where('ChurchID', $church->ChurchID)
            ->orderBy('Active', 'desc')
            ->orderBy('FirstName')
            ->get();

        return response()->json($clergy);
    }

    public function store(Request $request)
    {
        $request->validate([
            'ChurchID' => 'required|exists:Church,ChurchID',
            'FirstName' => 'required|string|max:100',
            'LastName' => 'required|string|max:100',
            'MiddleName' => 'nullable|string|max:100',
            'Position' => 'required|string|max:100',
        ]);

        $clergy = Clergy::create($request->all());

        return response()->json($clergy, 201);
    }

    public function show($id)
    {
        $clergy = Clergy::find($id);

        if (!$clergy) {
            return response()->json(['error' => 'Clergy member not found'], 404);
        }

        return response()->json($clergy);
    }

    public function update(Request $request, $id)
    {
        $clergy = Clergy::find($id);

        if (!$clergy) {
            return response()->json(['error' => 'Clergy member not found'], 404);
        }

        $request->validate([
            'FirstName' => 'required|string|max:100',
            'LastName' => 'required|string|max:100',
            'MiddleName' => 'nullable|string|max:100',
            'Position' => 'required|string|max:100',
        ]);

        $clergy->update($request->only([
            'FirstName',
            'LastName',
            'MiddleName',
            'Position'
        ]));

        return response()->json($clergy);
    }

    public function destroy($id)
    {
        $clergy = Clergy::find($id);

        if (!$clergy) {
            return response()->json(['error' => 'Clergy member not found'], 404);
        }

        $clergy->update(['Active' => false]);

        return response()->json(['message' => 'Clergy member deactivated successfully']);
    }

    public function toggleStatus($id)
    {
        $clergy = Clergy::find($id);

        if (!$clergy) {
            return response()->json(['error' => 'Clergy member not found'], 404);
        }

        $clergy->update(['Active' => !$clergy->Active]);

        return response()->json([
            'message' => 'Clergy status updated successfully',
            'clergy' => $clergy
        ]);
    }
}
