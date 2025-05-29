"use client";
import React from "react";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { List, Pencil, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/auth.jsx";
import DataLoading from "@/components/DataLoading";

const csrf = () => axios.get("/sanctum/csrf-cookie");

const fetchChurchByName = async (churchName, setErrors) => {
  await csrf();
  try {
    const response = await axios.get(`/api/churches/name/${churchName}`);
    return response.data;
  } catch (error) {
    setErrors([
      error.response?.data?.error ||
        "Failed to fetch church data. Please ensure the church exists.",
    ]);
    throw error;
  }
};

const fetchRoles = async (churchId, setErrors) => {
  await csrf();
  try {
    const response = await axios.get(`/api/roles?church_id=${churchId}`);
    return response.data;
  } catch (error) {
    setErrors([error.response?.data?.error || "Failed to fetch roles."]);
    throw error;
  }
};

const fetchPermissions = async (setErrors) => {
  await csrf();
  try {
    const response = await axios.get("/api/permissions");
    return response.data;
  } catch (error) {
    setErrors([error.response?.data?.error || "Failed to fetch permissions."]);
    throw error;
  }
};

const fetchRoleById = async (roleId, churchId, setErrors) => {
  await csrf();
  try {
    const response = await axios.get(
      `/api/roles/${roleId}?church_id=${churchId}`
    );
    return response.data;
  } catch (error) {
    setErrors([error.response?.data?.error || "Failed to fetch role details."]);
    throw error;
  }
};

const saveRole = async ({ editRoleId, churchId, form, setErrors, mutate }) => {
  await csrf();
  try {
    const url = editRoleId ? `/api/roles/${editRoleId}` : "/api/roles";
    const method = editRoleId ? "put" : "post";
    const payload = { ChurchID: churchId, ...form };
    const response = await axios({ method, url, data: payload });
    mutate();
    toast.success(
      editRoleId ? "Role updated successfully" : "Role created successfully"
    );
  } catch (error) {
    if (error.response?.status === 422) {
      setErrors(error.response.data.errors || ["Validation failed."]);
    } else {
      setErrors([
        error.response?.data?.error || `Failed to save role: ${error.message}`,
      ]);
    }
    throw error;
  }
};

const RolePermissionPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  const [churchId, setChurchId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionMap, setPermissionMap] = useState(new Map());
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Unified loading state for initial fetch
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ RoleName: "", permissions: [] });
  const [editRoleId, setEditRoleId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const loadChurchAndRoles = async () => {
      if (!churchname) {
        toast.error("No church name provided in URL.");
        setIsInitialLoading(false);
        return;
      }

      try {
        const churchData = await fetchChurchByName(churchname, setErrors);
        setChurchId(churchData.ChurchID);

        const rolesData = await fetchRoles(churchData.ChurchID, setErrors);
        setRoles(rolesData);
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error("Please log in to view roles.");
          router.push("/login");
        } else {
          toast.error(err.message || "Failed to load data.");
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    setIsInitialLoading(true); // Start loading
    loadChurchAndRoles();
  }, [churchname, router]);

  useEffect(() => {
    setLoadingPermissions(true);
    fetchPermissions(setErrors)
      .then((data) => {
        setPermissions(data.map((p) => p.PermissionName));
        setPermissionMap(
          new Map(data.map((p) => [p.PermissionName, p.PermissionID]))
        );
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          toast.error("Please log in to view permissions.");
          router.push("/login");
        } else {
          toast.error(err.message || "Failed to load permissions.");
        }
      })
      .finally(() => setLoadingPermissions(false));
  }, [router]);

  const handleOpen = () => {
    setForm({ RoleName: "", permissions: [] });
    setEditRoleId(null);
    setErrors([]);
    setOpen(true);
  };

  const handleEdit = async (roleId) => {
    if (!churchId) {
      toast.error("Church ID not available. Please try again.");
      return;
    }
    try {
      const role = await fetchRoleById(roleId, churchId, setErrors);
      setForm({
        RoleName: role.RoleName,
        permissions: role.permissions.map((p) => p.PermissionName),
      });
      setEditRoleId(roleId);
      setErrors([]);
      setOpen(true);
    } catch (err) {
      toast.error(err.message || "Failed to fetch role details.");
    }
  };

  const handlePermissionChange = (permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!churchId || !form.RoleName.trim()) {
      toast.error("Church ID or Role Name is missing.");
      return;
    }
    setIsSubmitting(true);
    try {
      const permissionIds = form.permissions.map((p) => permissionMap.get(p));
      await saveRole({
        editRoleId,
        churchId,
        form: { ...form, permissions: permissionIds },
        setErrors,
        mutate: () => fetchRoles(churchId, setErrors).then(setRoles),
      });
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setErrors([]);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && open) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  const hasAccess =
    user?.profile?.system_role?.role_name === "ChurchOwner" ||
    user?.church_role?.permissions?.some(
      (perm) => perm.PermissionName === "role_list"
    );

  if (!hasAccess) {
    return (
      <div className="lg:ml-75 lg:py-12 mx-3 py-20">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-red-600">Unauthorized</h2>
            <p className="mt-2 text-gray-600">
              You do not have permission to access the Role page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:ml-75 lg:py-12 mx-3 py-20">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <List className="mr-2 h-6 w-6 text-gray-600" /> Church Roles
            </h1>
            <button
              onClick={handleOpen}
              className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
            >
              <Plus className="mr-2 h-5 w-5" /> Create Role
            </button>
          </div>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex justify-between items-center">
              <div>
                {errors.map((error, index) => (
                  <p key={index} className="text-sm">
                    {error}
                  </p>
                ))}
              </div>
              <button
                onClick={() => setErrors([])}
                className="text-red-700 hover:text-red-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-left">
                  <th className="p-3 text-sm font-semibold">Role Name</th>
                  <th className="p-3 text-sm font-semibold">Permissions</th>
                  <th className="p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody aria-live="polite">
                {isInitialLoading ? (
                  <tr>
                    <td colSpan={3} className="p-3 text-center">
                      <DataLoading message="Loading roles..." />
                    </td>
                  </tr>
                ) : roles.length ? (
                  roles.map((role, index) => (
                    <tr
                      key={role.RoleID}
                      className={`border-t border-gray-200 hover:bg-gray-50 transition-opacity duration-300 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-900">
                        {role.RoleName}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {role.permissions
                          .map((p) => p.PermissionName)
                          .join(", ") || "None"}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEdit(role.RoleID)}
                          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                        >
                          <Pencil className="mr-1 h-4 w-4" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="transition-opacity duration-300">
                    <td
                      colSpan={3}
                      className="p-3 text-center text-sm text-gray-600"
                    >
                      No roles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-labelledby="modal-title"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            <h2
              id="modal-title"
              className="text-xl font-bold text-gray-900 mb-4"
            >
              {editRoleId ? "Edit Role" : "Create Role"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="roleName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Role Name
                </label>
                <input
                  id="roleName"
                  type="text"
                  value={form.RoleName}
                  onChange={(e) =>
                    setForm({ ...form, RoleName: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Permissions
                </label>
                {loadingPermissions ? (
                  <DataLoading message="Loading permissions..." />
                ) : permissions.length === 0 ? (
                  <p className="text-red-600 text-sm mt-1">
                    No permissions available. Check API or login status.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {permissions.map((permission) => (
                      <label
                        key={permission}
                        className="flex items-center text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(permission)}
                          onChange={() => handlePermissionChange(permission)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2">
                          {permission.replace("_", " ").toUpperCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !form.RoleName.trim()}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editRoleId
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePermissionPage;
