<?php

namespace App\Http\Controllers;

use App\Models\ChurchRole;
use App\Models\Permission;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    public function index(Request $request)
    {
        $churchId = $request->query('church_id');
        $roles = ChurchRole::where('ChurchID', $churchId)->with('permissions')->get();
        return response()->json($roles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ChurchID' => 'required|exists:Church,ChurchID',
            'RoleName' => 'required|string|max:100|unique:ChurchRole,RoleName,NULL,RoleID,ChurchID,' . $request->ChurchID,
            'permissions' => 'array',
            'permissions.*' => 'exists:Permission,PermissionID',
        ]);

        $role = ChurchRole::create([
            'ChurchID' => $validated['ChurchID'],
            'RoleName' => $validated['RoleName'],
        ]);

        if (!empty($validated['permissions'])) {
            $role->permissions()->attach($validated['permissions']);
        }

        return response()->json(['message' => 'Role created successfully', 'role' => $role->load('permissions')], 201);
    }

    public function show(Request $request, $roleId)
    {
        $churchId = $request->query('church_id');
        $role = ChurchRole::where('ChurchID', $churchId)->findOrFail($roleId);
        return response()->json($role->load('permissions'));
    }

    public function update(Request $request, $roleId)
    {
        $validated = $request->validate([
            'ChurchID' => 'required|exists:Church,ChurchID',
            'RoleName' => 'required|string|max:100|unique:ChurchRole,RoleName,' . $roleId . ',RoleID,ChurchID,' . $request->ChurchID,
            'permissions' => 'array',
            'permissions.*' => 'exists:Permission,PermissionID',
        ]);

        $role = ChurchRole::where('ChurchID', $validated['ChurchID'])->findOrFail($roleId);
        $role->update(['RoleName' => $validated['RoleName']]);
        $role->permissions()->sync($validated['permissions'] ?? []);

        return response()->json(['message' => 'Role updated successfully', 'role' => $role->load('permissions')]);
    }

    public function getPermissions()
    {
        $permissions = Permission::all(['PermissionID', 'PermissionName']);
        return response()->json($permissions);
    }
}