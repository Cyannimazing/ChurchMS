<?php

namespace App\Http\Controllers;

use App\Models\Church;
use App\Models\User;
use App\Models\UserChurchRole;
use App\Models\UserContact;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ChurchStaffController extends Controller
{
    public function index(Request $request)
    {
        $churchId = $request->query('church_id');
        $userChurchRoles = UserChurchRole::where('ChurchID', $churchId)
            ->with(['user.profile', 'role'])
            ->get();
        
        return response()->json($userChurchRoles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ChurchID' => 'required|exists:Church,ChurchID',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'role_id' => 'nullable|exists:ChurchRole,RoleID,ChurchID,' . $request->ChurchID,
        ]);

        $user = User::create([
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'],
            'last_name' => $validated['last_name'],
            'system_role_id' => 3, // Assuming 3 is the role ID for staff
        ]);

        if ($validated['contact_number'] || $validated['address']) {
            UserContact::create([
                'user_id' => $user->id,
                'contact_number' => $validated['contact_number'],
                'address' => $validated['address'],
            ]);
        }

        $userChurchRole = null;
        if (!empty($validated['role_id'])) {
            $userChurchRole = UserChurchRole::create([
                'user_id' => $user->id,
                'ChurchID' => $validated['ChurchID'],
                'RoleID' => $validated['role_id'],
            ]);
        }

        return response()->json([
            'message' => 'User and role created successfully',
            'userChurchRole' => $userChurchRole ? $userChurchRole->load(['user.profile', 'church', 'role']) : null
        ], 201);
    }

    public function show(Request $request, $userChurchRoleId)
    {
        $churchId = $request->query('church_id');
        $userChurchRole = UserChurchRole::where('ChurchID', $churchId)
            ->with(['user.profile', 'user.contact', 'church', 'role'])
            ->findOrFail($userChurchRoleId);
        
        return response()->json($userChurchRole);
    }

    public function update(Request $request, $userChurchRoleId)
    {
        $validated = $request->validate([
            'ChurchID' => 'required|exists:Church,ChurchID',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'role_id' => 'nullable|exists:ChurchRole,RoleID,ChurchID,' . $request->ChurchID,
        ]);

        $userChurchRole = UserChurchRole::where('ChurchID', $validated['ChurchID'])
            ->findOrFail($userChurchRoleId);

        $profile = $userChurchRole->user->profile;
        $profile->update([
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'],
            'last_name' => $validated['last_name'],
        ]);

        $contact = $userChurchRole->user->contact;
        if ($contact) {
            $contact->update([
                'contact_number' => $validated['contact_number'],
                'address' => $validated['address'],
            ]);
        } elseif ($validated['contact_number'] || $validated['address']) {
            UserContact::create([
                'user_id' => $userChurchRole->user_id,
                'contact_number' => $validated['contact_number'],
                'address' => $validated['address'],
            ]);
        }

        if (!empty($validated['role_id']) && $validated['role_id'] != $userChurchRole->RoleID) {
            $userChurchRole->update(['RoleID' => $validated['role_id']]);
        } elseif (empty($validated['role_id'])) {
            $userChurchRole->delete();
            return response()->json(['message' => 'User role removed successfully']);
        }

        return response()->json([
            'message' => 'User role updated successfully',
            'userChurchRole' => $userChurchRole->load(['user.profile', 'church', 'role'])
        ]);
    }
}