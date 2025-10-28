"use client";
import React from "react";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { List, Pencil, Plus, X, Search, Users, Loader2, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/auth.jsx";
import DataLoading from "@/components/DataLoading";
import { Button } from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import SearchAndPagination from "@/components/SearchAndPagination";
import ConfirmDialog from "@/components/ConfirmDialog";

const fetchChurchAndRoles = async (churchName, setErrors) => {
  try {
    const response = await axios.get(`/api/churches-and-roles/${churchName}`);
    console.log(response);
    return response.data;
  } catch (error) {
    setErrors([
      error.response?.data?.error ||
        "Failed to fetch church and roles data. Please ensure the church exists.",
    ]);
    throw error;
  }
};

const fetchPermissions = async (setErrors) => {
  try {
    const response = await axios.get("/api/permissions");
    return response.data;
  } catch (error) {
    setErrors([error.response?.data?.error || "Failed to fetch permissions."]);
    throw error;
  }
};

const fetchRoleById = async (roleId, churchId, setErrors) => {
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
  try {
    const url = editRoleId ? `/api/roles/${editRoleId}` : "/api/roles";
    const method = editRoleId ? "put" : "post";
    const payload = { ChurchID: churchId, ...form };
    const response = await axios({ method, url, data: payload });
    mutate();
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
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionMap, setPermissionMap] = useState(new Map());
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ RoleName: "", permissions: [] });
  const [editRoleId, setEditRoleId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadChurchAndRoles = async () => {
      if (!churchname) {
        setErrors(["No church name provided in URL."]);
        setIsInitialLoading(false);
        return;
      }

      try {
        const data = await fetchChurchAndRoles(churchname, setErrors);
        setChurchId(data.ChurchID);
        setRoles(data.roles);
        setFilteredRoles(data.roles);
      } catch (err) {
        if (err.response?.status === 401) {
          setErrors(["Please log in to view roles."]);
          router.push("/login");
        } else {
          setErrors([err.message || "Failed to load data."]);
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    setIsInitialLoading(true);
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
          setErrors(["Please log in to view permissions."]);
          router.push("/login");
        } else {
          setErrors([err.message || "Failed to load permissions."]);
        }
      })
      .finally(() => setLoadingPermissions(false));
  }, [router]);

  // Filter roles based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRoles(roles);
    } else {
      const filtered = roles.filter(role =>
        role.RoleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.permissions.some(perm => 
          perm.PermissionName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredRoles(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, roles]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRoles = filteredRoles.slice(startIndex, endIndex);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpen = () => {
    setForm({ RoleName: "", permissions: [] });
    setEditRoleId(null);
    setErrors([]);
    setOpen(true);
  };

  const handleEdit = async (roleId) => {
    if (!churchId) {
      setErrors(["Church ID not available. Please try again."]);
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
      setErrors([err.message || "Failed to fetch role details."]);
    }
  };

  const handlePermissionChange = (permission) => {
    setForm((prev) => {
      const isChecked = prev.permissions.includes(permission);
      const moduleName = permission.split('_')[0];
      const moduleListPerm = `${moduleName}_list`;

      if (isChecked) {
        // Remove the permission
        const next = prev.permissions.filter((p) => p !== permission);
        return { ...prev, permissions: next };
      } else {
        // Add the permission and ensure module list is also checked
        const next = [...prev.permissions, permission];
        if (permission !== moduleListPerm && !next.includes(moduleListPerm)) {
          next.push(moduleListPerm);
        }
        return { ...prev, permissions: next };
      }
    });
  };

  const toggleModuleList = (moduleName) => {
    const moduleListPerm = `${moduleName}_list`;
    setForm((prev) => {
      const isChecked = prev.permissions.includes(moduleListPerm);
      // Determine if any child permission (non-list) in this module is checked
      const hasChildChecked = prev.permissions.some((p) => p.startsWith(`${moduleName}_`) && p !== moduleListPerm);

      if (isChecked) {
        // If children are checked, do not allow unchecking
        if (hasChildChecked) return prev;
        // Otherwise, allow uncheck
        return { ...prev, permissions: prev.permissions.filter((p) => p !== moduleListPerm) };
      } else {
        // Check the list permission
        return { ...prev, permissions: [...prev.permissions, moduleListPerm] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!churchId || !form.RoleName.trim()) {
      setErrors(["Church ID or Role Name is missing."]);
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
          mutate: () =>
            fetchChurchAndRoles(churchname, setErrors).then((data) => {
              setChurchId(data.ChurchID);
              setRoles(data.roles);
              setFilteredRoles(data.roles);
            }),
      });
      setOpen(false);
      setAlertMessage(editRoleId ? "Role updated successfully!" : "Role created successfully!");
      setAlertType("success");
    } catch (err) {
      setErrors([err.response?.data?.error || "Failed to save role."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setErrors([]);
  };

  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`/api/roles/${roleToDelete.RoleID}`);
      
      // Refresh the roles list
      const data = await fetchChurchAndRoles(churchname, setErrors);
      setRoles(data.roles);
      setFilteredRoles(data.roles);
      
      setAlertMessage("Role deleted successfully!");
      setAlertType("success");
    } catch (error) {
      setAlertMessage(error.response?.data?.error || "Failed to delete role.");
      setAlertType("error");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setRoleToDelete(null);
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

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alertMessage) return;
    const timeout = setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 5000);
    return () => clearTimeout(timeout);
  }, [alertMessage]);

  const hasAccess =
    user?.profile?.system_role?.role_name === "ChurchOwner" ||
    user?.church_role?.permissions?.some(
      (perm) => perm.PermissionName === "role_list"
    );

  if (!hasAccess) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="w-full h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">
                Unauthorized
              </h2>
              <p className="mt-2 text-gray-600">
                You do not have permission to access the Role page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Manage Church Roles
            </h1>
            
            {alertMessage && (
              <div className="mb-6">
                <div className={`p-4 rounded-md flex justify-between items-center ${
                  alertType === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}>
                  <p className="text-sm font-medium">{alertMessage}</p>
                  <button
                    onClick={() => setAlertMessage("")}
                    className="inline-flex text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <div className="overflow-x-auto">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Church Roles</h3>
                        <p className="mt-1 text-sm text-gray-600">Manage roles and permissions for church members.</p>
                      </div>
                      <Button onClick={handleOpen} className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Role
                      </Button>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <SearchAndPagination
                      searchQuery={searchTerm}
                      onSearchChange={handleSearch}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      totalItems={filteredRoles.length}
                      itemsPerPage={itemsPerPage}
                      placeholder="Search roles..."
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isInitialLoading ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-8">
                              <DataLoading message="Loading roles..." />
                            </td>
                          </tr>
                        ) : currentRoles.length > 0 ? (
                          currentRoles.map((role) => (
                            <tr key={role.RoleID} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {role.RoleName}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {role.permissions.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {role.permissions.slice(0, 3).map((perm) => (
                                        <span
                                          key={perm.PermissionID}
                                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                          {perm.PermissionName.replace('_', ' ')}
                                        </span>
                                      ))}
                                      {role.permissions.length > 3 && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                          +{role.permissions.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">No permissions</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center items-center space-x-2">
                                  <Button
                                    onClick={() => handleEdit(role.RoleID)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 min-h-0 h-auto"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteClick(role)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                              {searchTerm ? 'No roles found matching your search.' : 'No roles available.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex justify-between items-center">
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


      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 p-6 relative max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-labelledby="modal-title"
          >
            <Button
              onClick={handleClose}
              variant="outline"
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1.5 min-h-0 h-auto border-none hover:bg-gray-100"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
            <h2
              id="modal-title"
              className="text-2xl font-bold text-gray-900 mb-6"
            >
              {editRoleId ? "Edit Role" : "Create Role"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label
                  htmlFor="roleName"
                  className="text-sm font-medium text-gray-700"
                >
                  Role Name
                </Label>
                <Input
                  id="roleName"
                  type="text"
                  value={form.RoleName}
                  onChange={(e) => setForm({ ...form, RoleName: e.target.value })}
                  required
                  className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                  placeholder="Enter role name"
                  autoFocus
                />
                <InputError
                  messages={errors.RoleName}
                  className="mt-2 text-xs text-red-600"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </Label>
                {loadingPermissions ? (
                  <div className="mt-2">
                    <DataLoading message="Loading permissions..." />
                  </div>
                ) : permissions.length === 0 ? (
                  <p className="mt-2 text-sm text-red-600">
                    No permissions available. Check API or login status.
                  </p>
                ) : (
                  <div className="max-h-[55vh] overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-3">
                    {(() => {
                      // Group permissions by module
                      const grouped = {};
                      permissions.forEach(permission => {
                        const moduleName = permission.split('_')[0];
                        if (!grouped[moduleName]) grouped[moduleName] = [];
                        grouped[moduleName].push(permission);
                      });

                      const sortedModules = Object.keys(grouped).sort();

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {sortedModules.map(module => {
                            const moduleListPerm = `${module}_list`;
                            const childPermissions = grouped[module].filter((p) => p !== moduleListPerm);
                            const hasChildChecked = childPermissions.some((p) => form.permissions.includes(p));
                            const isModuleListChecked = form.permissions.includes(moduleListPerm);

                            return (
                              <div key={module} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                                <div className="bg-gray-100 px-3 py-2 rounded-t-lg flex items-center justify-between">
                                  <span className="font-semibold text-sm text-gray-800 capitalize">{module.replace('-', ' ')}</span>
                                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                    <span>Menu</span>
                                    <input
                                      type="checkbox"
                                      checked={isModuleListChecked}
                                      onChange={() => toggleModuleList(module)}
                                      disabled={hasChildChecked && isModuleListChecked}
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                      title={hasChildChecked && isModuleListChecked ? 'Cannot uncheck while other permissions are selected' : ''}
                                    />
                                  </label>
                                </div>
                                <div className="p-3 space-y-2">
                                  {childPermissions.map((permission) => (
                                    <label key={permission} className="flex items-center cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={form.permissions.includes(permission)}
                                        onChange={() => handlePermissionChange(permission)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">
                                        {permission.split('_').slice(1).join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Select the permissions that should be granted to users with this role.
                </p>
              </div>
              <div className="flex justify-end items-center space-x-3">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium"
                  disabled={isSubmitting || !form.RoleName.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editRoleId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editRoleId ? "Update Role" : "Create Role"}</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${roleToDelete?.RoleName}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Role"}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default RolePermissionPage;
