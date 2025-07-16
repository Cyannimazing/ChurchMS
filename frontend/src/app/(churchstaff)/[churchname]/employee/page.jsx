"use client";
import React from "react";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { List, Pencil, Plus, X, Search, Users, Loader2, Edit } from "lucide-react";
import Alert from "@/components/Alert";
import { useAuth } from "@/hooks/auth.jsx";
import DataLoading from "@/components/DataLoading";
import { Button } from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import SearchAndPagination from "@/components/SearchAndPagination";

const fetchChurchStaffAndRoles = async (churchName, setErrors) => {
  try {
    const sanitizedChurchName = churchName.replace(/:\d+$/, "");
    const response = await axios.get(
      `/api/churches-and-roles/${sanitizedChurchName}`
    );
    return response.data;
  } catch (error) {
    setErrors([
      error.response?.data?.error ||
        "Failed to fetch church, staff, and roles data. Please ensure the church exists.",
    ]);
    throw error;
  }
};

const fetchStaffById = async (staffId, churchId, setErrors) => {
  try {
    const response = await axios.get(
      `/api/staff/${staffId}?church_id=${churchId}`
    );
    return response.data;
  } catch (error) {
    setErrors([
      error.response?.data?.error || "Failed to fetch staff details.",
    ]);
    throw error;
  }
};

const saveStaff = async ({
  editStaffId,
  churchId,
  form,
  setErrors,
  mutate,
}) => {
  try {
    const url = editStaffId ? `/api/staff/${editStaffId}` : "/api/staff";
    const method = editStaffId ? "put" : "post";
    const response = await axios({
      method,
      url,
      data: { ChurchID: churchId, ...form },
    });
    mutate();
    // Success handled by caller
  } catch (error) {
    setErrors(
      error.response?.data?.errors || [
        error.response?.data?.error || "Failed to save staff.",
      ]
    );
    throw error;
  }
};

const validateForm = (form, editStaffId, roles) => {
  const errors = {};
  
  // Email validation
  if (!form.email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Valid email is required.";
  } else if (form.email.length > 255) {
    errors.email = "Email must not exceed 255 characters.";
  }
  
  // Password validation (only for new staff)
  if (!editStaffId) {
    if (!form.password) {
      errors.password = "Password is required.";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (!form.password_confirmation) {
      errors.password_confirmation = "Password confirmation is required.";
    } else if (form.password !== form.password_confirmation) {
      errors.password_confirmation = "Passwords must match.";
    }
  }
  
  // Name validation
  if (!form.first_name || !form.first_name.trim()) {
    errors.first_name = "First name is required.";
  } else if (form.first_name.length > 255) {
    errors.first_name = "First name must not exceed 255 characters.";
  }
  
  if (!form.last_name || !form.last_name.trim()) {
    errors.last_name = "Last name is required.";
  } else if (form.last_name.length > 255) {
    errors.last_name = "Last name must not exceed 255 characters.";
  }
  
  if (form.middle_name && form.middle_name.length > 1) {
    errors.middle_name = "Middle initial must be a single character.";
  }
  
  // Contact validation
  if (form.contact_number && form.contact_number.length > 20) {
    errors.contact_number = "Contact number must not exceed 20 characters.";
  } else if (
    form.contact_number &&
    !/^\+?\d{0,20}$/.test(form.contact_number)
  ) {
    errors.contact_number = "Contact number must be a valid phone number.";
  }
  
  if (form.address && form.address.length > 255) {
    errors.address = "Address must not exceed 255 characters.";
  }
  
  // Role validation
  if (!editStaffId && !form.role_id) {
    errors.role_id = "A role is required for new staff.";
  } else if (
    form.role_id &&
    !roles.some((role) => role.RoleID === Number(form.role_id))
  ) {
    errors.role_id = "Selected role is invalid.";
  }
  
  return errors;
};

const EmployeePage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  const [churchId, setChurchId] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    contact_number: "",
    address: "",
    role_id: "",
  });
  const [editStaffId, setEditStaffId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [pageErrors, setPageErrors] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const itemsPerPage = 5;

  useEffect(() => {
    const loadChurchStaffAndRoles = async () => {
      if (!churchname) {
        setPageErrors(["No church name provided in URL."]);
        setIsInitialLoading(false);
        return;
      }

      try {
        const data = await fetchChurchStaffAndRoles(churchname, setPageErrors);
        setChurchId(data.ChurchID);
        setStaffList(data.staff);
        setFilteredStaff(data.staff);
        setRoles(data.roles);
      } catch (err) {
        if (err.response?.status === 401) {
          setPageErrors(["Please log in to view staff."]);
          router.push("/login");
        } else {
          setPageErrors([err.message || "Failed to load data."]);
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    setIsInitialLoading(true);
    loadChurchStaffAndRoles();
  }, [churchname, router]);

  // Filter staff based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStaff(staffList);
    } else {
      const filtered = staffList.filter(staff => {
                        const fullName = `${staff.user.profile.first_name} ${staff.user.profile.middle_name ? staff.user.profile.middle_name.charAt(0) + '.' : ''} ${staff.user.profile.last_name}`.toLowerCase();
        const email = staff.user.email.toLowerCase();
        const roleName = staff.role?.RoleName?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        
        return fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               roleName.includes(searchLower);
      });
      setFilteredStaff(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, staffList]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = filteredStaff.slice(startIndex, endIndex);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpen = () => {
    setForm({
      email: "",
      password: "",
      password_confirmation: "",
      first_name: "",
      last_name: "",
      middle_name: "",
      contact_number: "",
      address: "",
      role_id: "",
    });
    setEditStaffId(null);
    setErrors({});
    setOpen(true);
  };

  const handleEdit = async (staffId) => {
    try {
      const staff = await fetchStaffById(staffId, churchId, setPageErrors);
      setForm({
        email: staff.user.email,
        password: "",
        password_confirmation: "",
        first_name: staff.user.profile.first_name,
        last_name: staff.user.profile.last_name,
        middle_name: staff.user.profile.middle_name || "",
        contact_number: staff.user.contact?.contact_number || "",
        address: staff.user.contact?.address || "",
        role_id: staff.role?.RoleID || "",
      });
      setEditStaffId(staffId);
      setErrors({});
      setOpen(true);
    } catch (err) {
      setPageErrors([err.message || "Failed to fetch staff details."]);
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    const formErrors = validateForm(form, editStaffId, roles);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await saveStaff({
        editStaffId,
        churchId,
        form: formData,
        setErrors: (backendErrors) => {
          setErrors(backendErrors);
        },
        mutate: () => {
          if (churchId) {
            setIsInitialLoading(true);
            fetchChurchStaffAndRoles(churchname, setPageErrors)
              .then((data) => {
                setChurchId(data.ChurchID);
                setStaffList(data.staff);
                setRoles(data.roles);
              })
              .finally(() => setIsInitialLoading(false));
          }
        },
      });
      setOpen(false);
      setAlertMessage(editStaffId ? "Staff member updated successfully!" : "Staff member created successfully!");
      setAlertType("success");
    } catch (err) {
      setPageErrors(["Failed to save staff."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
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
      (perm) => perm.PermissionName === "employee_list"
    );

  if (!hasAccess) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="max-w-7xl mx-auto h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">
                Unauthorized
              </h2>
              <p className="mt-2 text-gray-600">
                You do not have permission to access the Employee page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="max-w-7xl mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Manage Church Staff
            </h1>

            {alertMessage && (
              <div className="mb-6">
                <Alert
                  type={alertType}
                  message={alertMessage}
                  onClose={() => setAlertMessage("")}
                  autoClose={true}
                  autoCloseDelay={5000}
                />
              </div>
            )}

            <div className="mt-6">
              <div className="overflow-x-auto">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Church Staff</h3>
                        <p className="mt-1 text-sm text-gray-600">Manage staff members and their roles within the church.</p>
                      </div>
                      <Button onClick={handleOpen} className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Staff
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
                      totalItems={filteredStaff.length}
                      itemsPerPage={itemsPerPage}
                      placeholder="Search staff..."
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isInitialLoading ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8">
                              <DataLoading message="Loading staff..." />
                            </td>
                          </tr>
                        ) : currentStaff.length > 0 ? (
                          currentStaff.map((staff) => (
                            <tr key={staff.UserChurchRoleID} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {`${staff.user.profile.first_name?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') || ''}${staff.user.profile.middle_name ? ` ${staff.user.profile.middle_name.charAt(0).toUpperCase()}.` : ''} ${staff.user.profile.last_name?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') || ''}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {staff.user.email}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {staff.role?.RoleName ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {staff.role.RoleName}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">No role assigned</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center items-center space-x-2">
                                  <Button
                                    onClick={() => handleEdit(staff.UserChurchRoleID)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 min-h-0 h-auto"
                                  >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                              No staff members found.
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

      {pageErrors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex justify-between items-center">
          <div>
            {pageErrors.map((error, index) => (
              <p key={index} className="text-sm">
                {error}
              </p>
            ))}
          </div>
          <button
            onClick={() => setPageErrors([])}
            className="text-red-700 hover:text-red-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto relative"
            role="dialog"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="relative bg-gray-100 px-4 py-4 rounded-t-lg">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div>
                  <h2 id="modal-title" className="text-xl font-bold text-gray-800">
                    {editStaffId ? "Edit Staff Member" : "Add New Staff Member"}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {editStaffId ? "Update staff member information" : "Create a new staff member account"}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-8 py-6 max-h-[calc(95vh-140px)] overflow-y-auto">
              <form className="space-y-6">
                {/* Account Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg text-sm transition-colors duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white ${
                          errors.email ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                        }`}
                        disabled={editStaffId !== null}
                        required
                        autoFocus
                        placeholder="Enter email address"
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠</span> {errors.email}
                        </p>
                      )}
                    </div>
                    
                    {!editStaffId && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border-2 rounded-lg text-sm transition-colors duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white ${
                              errors.password ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                            }`}
                            required
                            placeholder="Create password"
                          />
                          {errors.password && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                              <span className="mr-1">⚠</span> {errors.password}
                            </p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="password_confirmation" className="block text-sm font-semibold text-gray-700 mb-2">
                            Confirm Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            value={form.password_confirmation}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border-2 rounded-lg text-sm transition-colors duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white ${
                              errors.password_confirmation ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                            }`}
                            required
                            placeholder="Confirm password"
                          />
                          {errors.password_confirmation && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                              <span className="mr-1">⚠</span> {errors.password_confirmation}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-1 w-8 bg-green-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                      <div className="md:col-span-5">
                        <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="first_name"
                          name="first_name"
                          type="text"
                          value={form.first_name}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-lg text-sm transition-colors duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white ${
                            errors.first_name ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                          }`}
                          required
                          placeholder="Enter first name"
                        />
                        {errors.first_name && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <span className="mr-1">⚠</span> {errors.first_name}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="middle_name" className="block text-sm font-semibold text-gray-700 mb-2">
                          M.I. <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <input
                          id="middle_name"
                          name="middle_name"
                          type="text"
                          value={form.middle_name}
                          onChange={handleChange}
                          maxLength={1}
                          className={`w-full px-4 py-3 border-2 rounded-lg text-sm transition-colors duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-center ${
                            errors.middle_name ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                          }`}
                          placeholder="M"
                        />
                        {errors.middle_name && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <span className="mr-1">⚠</span> {errors.middle_name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={form.last_name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg text-sm transition-colors duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white ${
                          errors.last_name ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                        }`}
                        required
                        placeholder="Enter last name"
                      />
                      {errors.last_name && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠</span> {errors.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-1 w-8 bg-purple-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div>
                      <label htmlFor="contact_number" className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Number <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <input
                        id="contact_number"
                        name="contact_number"
                        type="text"
                        value={form.contact_number}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg text-sm transition-colors duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white ${
                          errors.contact_number ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                        }`}
                        placeholder="Enter contact number (optional)"
                      />
                      {errors.contact_number && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠</span> {errors.contact_number}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                        Address <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={form.address}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg text-sm transition-colors duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white ${
                          errors.address ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                        }`}
                        placeholder="Enter address (optional)"
                      />
                      {errors.address && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠</span> {errors.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Assignment Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-1 w-8 bg-orange-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Role Assignment</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div>
                      <label htmlFor="role_id" className="block text-sm font-semibold text-gray-700 mb-2">
                        Church Role {!editStaffId && <span className="text-red-500">*</span>}
                      </label>
                      {roles.length === 0 ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 text-sm flex items-center">
                            <span className="mr-2">⚠</span> No roles available. Please create roles first.
                          </p>
                        </div>
                      ) : (
                        <select
                          id="role_id"
                          name="role_id"
                          value={form.role_id}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-lg text-sm transition-colors duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white ${
                            errors.role_id ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <option value="">Select a role for this staff member</option>
                          {roles.map((role) => (
                            <option key={role.RoleID} value={role.RoleID}>
                              {role.RoleName}
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.role_id && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠</span> {errors.role_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <Button 
                type="button" 
                onClick={handleClose} 
                variant="outline"
                className="px-4 py-2 text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit(form)}
                disabled={
                  isSubmitting ||
                  Object.keys(validateForm(form, editStaffId, roles)).length > 0
                }
                className="px-4 py-2 text-sm font-medium"
              >
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  editStaffId ? "Update Staff" : "Create Staff"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;
