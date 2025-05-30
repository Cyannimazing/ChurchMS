"use client";
import React from "react";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { List, Pencil, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/auth.jsx";
import DataLoading from "@/components/DataLoading";
import { Button } from "@/components/Button.jsx";

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
    toast.success(
      editStaffId ? "Staff updated successfully" : "Staff created successfully"
    );
  } catch (error) {
    setErrors(
      error.response?.data?.errors || [
        error.response?.data?.error || "Failed to save staff.",
      ]
    );
    throw error;
  }
};

const validateStep = (step, form, editStaffId, roles) => {
  const errors = {};
  if (step === 1) {
    if (!form.email) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Valid email is required.";
    } else if (form.email.length > 255) {
      errors.email = "Email must not exceed 255 characters.";
    }
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
      errors.middle_name = "Middle name must be a single character.";
    }
  } else if (step === 2) {
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
  } else if (step === 3) {
    if (form.role_id && !roles.some((role) => role.RoleID === form.role_id)) {
      errors.role_id = "Selected role is invalid.";
    }
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
  const [step, setStep] = useState(1);
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

  useEffect(() => {
    const loadChurchStaffAndRoles = async () => {
      if (!churchname) {
        toast.error("No church name provided in URL.");
        setIsInitialLoading(false);
        return;
      }

      try {
        const data = await fetchChurchStaffAndRoles(churchname, setPageErrors);
        setChurchId(data.ChurchID);
        setStaffList(data.staff);
        setRoles(data.roles);
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error("Please log in to view staff.");
          router.push("/login");
        } else {
          toast.error(err.message || "Failed to load data.");
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    setIsInitialLoading(true);
    loadChurchStaffAndRoles();
  }, [churchname, router]);

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
    setStep(1);
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
      setStep(1);
      setErrors({});
      setOpen(true);
    } catch (err) {
      toast.error(err.message || "Failed to fetch staff details.");
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const stepErrors = validateStep(step, form, editStaffId, roles);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((prev) => prev + 1);
  };

  const handlePrevious = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    const stepErrors = validateStep(step, form, editStaffId, roles);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
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
          if (backendErrors.email) {
            setStep(1); // Navigate back to step 1 if email error
          }
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
      setStep(1);
    } catch (err) {
      toast.error("Failed to save staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep(1);
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
      <div className="lg:ml-72 mx-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
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
    <div className="lg:ml-72 mx-3">
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <List className="mr-2 h-6 w-6 text-gray-600" /> Church Staff
              </h1>
              <Button className="flex" onClick={handleOpen}>
                <Plus className="mr-2 h-5 w-5" /> Create Employee
              </Button>
            </div>

            {pageErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex justify-between items-center">
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

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="bg-white divide-y divide-gray-200"
                  aria-live="polite"
                >
                  {isInitialLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4">
                        <DataLoading message="Loading staff..." />
                      </td>
                    </tr>
                  ) : staffList.length ? (
                    staffList.map((staff) => (
                      <tr key={staff.UserChurchRoleID}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {`${staff.user.profile.first_name} ${
                            staff.user.profile.middle_name || ""
                          } ${staff.user.profile.last_name}`.trim()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {staff.user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {staff.role?.RoleName || "None"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(staff.UserChurchRoleID)}
                            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                            aria-label={`Edit staff ${staff.user.profile.first_name} ${staff.user.profile.last_name}`}
                          >
                            <Pencil className="mr-1 h-4 w-4" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-700"
                      >
                        No staff found.
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
              className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto"
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
                className="text-2xl font-bold text-gray-900 mb-4"
              >
                {editStaffId ? "Edit Staff" : "Create Staff"} - Step {step} of 3
              </h2>
              <form className="space-y-4">
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={editStaffId !== null}
                        required
                        autoFocus
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    {!editStaffId && (
                      <>
                        <div>
                          <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Password
                          </label>
                          <input
                            id="password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                              errors.password
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            required
                          />
                          {errors.password && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.password}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="password_confirmation"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Confirm Password
                          </label>
                          <input
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            value={form.password_confirmation}
                            onChange={handleChange}
                            className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                              errors.password_confirmation
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            required
                          />
                          {errors.password_confirmation && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.password_confirmation}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    <div>
                      <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        First Name
                      </label>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={form.first_name}
                        onChange={handleChange}
                        className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.first_name
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.first_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="last_name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Last Name
                      </label>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={form.last_name}
                        onChange={handleChange}
                        className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.last_name
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {errors.last_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.last_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="middle_name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Middle Name
                      </label>
                      <input
                        id="middle_name"
                        name="middle_name"
                        type="text"
                        value={form.middle_name}
                        onChange={handleChange}
                        className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.middle_name
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.middle_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.middle_name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="contact_number"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Contact Number
                      </label>
                      <input
                        id="contact_number"
                        name="contact_number"
                        type="text"
                        value={form.contact_number}
                        onChange={handleChange}
                        className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.contact_number
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.contact_number && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.contact_number}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Address
                      </label>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={form.address}
                        onChange={handleChange}
                        className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.address ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.address}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="role_id"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Role
                      </label>
                      {roles.length === 0 ? (
                        <p className="text-red-600 text-sm mt-1">
                          No roles available. Please create roles first.
                        </p>
                      ) : (
                        <select
                          id="role_id"
                          name="role_id"
                          value={form.role_id}
                          onChange={handleChange}
                          className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                            errors.role_id
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        >
                          <option value="">No Role</option>
                          {roles.map((role) => (
                            <option key={role.RoleID} value={role.RoleID}>
                              {role.RoleName}
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.role_id && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.role_id}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </form>
              <div className="flex justify-between items-center mt-6">
                <div>
                  {step > 1 && (
                    <Button
                      type="button"
                      onClick={handlePrevious}
                      variant="outline"
                    >
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button type="button" onClick={handleClose} variant="outline">
                    Cancel
                  </Button>
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      variant="primary"
                      disabled={
                        Object.keys(
                          validateStep(step, form, editStaffId, roles)
                        ).length > 0
                      }
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleSubmit(form)}
                      variant="primary"
                      disabled={
                        isSubmitting ||
                        Object.keys(
                          validateStep(step, form, editStaffId, roles)
                        ).length > 0
                      }
                    >
                      {isSubmitting
                        ? "Saving..."
                        : editStaffId
                        ? "Update"
                        : "Create"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePage;
