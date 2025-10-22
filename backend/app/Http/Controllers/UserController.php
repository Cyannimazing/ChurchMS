<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('profile.systemRole')->get()->map(function ($user) {
            if (!$user->profile) {
                return [
                    'full_name' => 'N/A',
                    'system_role_name' => 'N/A',
                    'is_active' => $user->is_active,
                    'id' => $user->id,
                ];
        }

        $middleInitial = $user->profile->middle_name ? strtoupper($user->profile->middle_name) . '.' : '';
        $fullName = sprintf(
            "%s %s %s",
            ucfirst(strtolower($user->profile->first_name)),
            $middleInitial,
            ucfirst(strtolower($user->profile->last_name))
        );

        return [
            'full_name' => $fullName,
            'system_role_name' => $user->profile->systemRole->role_name ?? 'N/A',
            'is_active' => $user->is_active,
            'id' => $user->id,
        ];
    });

    return response()->json($users);
    }

    public function updateActiveStatus(Request $request, $id)
    {
        $request->validate([
            'is_active' => ['required', 'in:1,0,true,false'],
        ]);

        $user = User::findOrFail($id);
        $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $user->update(['is_active' => $isActive]);

        return response()->json([
            'message' => 'User status updated successfully.',
            'user' => $user,
        ], 200);
    }


    public function show($id)
    {
        $user = User::with(['profile.systemRole', 'contact', 'churches', 'church', 'churchRole'])->findOrFail($id);

        // If no profile or systemRole, or not ChurchStaff, remove church and churchRole
        if (!$user->profile || !$user->profile->systemRole || $user->profile->systemRole->role_name !== 'ChurchStaff') {
            unset($user->church);
            unset($user->churchRole);
        }

        // If no profile or systemRole, or not ChurchOwner, remove churches
        if (!$user->profile || !$user->profile->systemRole || $user->profile->systemRole->role_name !== 'ChurchOwner') {
            unset($user->churches);
        }

        return response()->json($user, 200);
    }
}