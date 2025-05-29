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
    setErrors([error.response?.data?.error || "Failed to fetch church data."]);
    throw error;
  }
};

const fetchStaffList = async (churchId, setErrors) => {
  await csrf();
  try {
    const response = await axios.get(`/api/staff?church_id=${churchId}`);
    return response.data;
  } catch (error) {
    setErrors([error.response?.data?.error || "Failed to fetch staff list."]);
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

const fetchStaffById = async (staffId, churchId, setErrors) => {
  await csrf();
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
  await csrf();
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
    setErrors([error.response?.data?.error || "Failed to save staff."]);
    throw error;
  }
};

const validateStep = (step, form, editStaffId) => {
  const errors = {};
  if (step === 1) {
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Valid email is required.";
    }
    if (!form.first_name.trim()) {
      errors.first_name = "First name is required.";
    }
    if (!form.last_name.trim()) {
      errors.last_name = "Last name is required.";
    }
    if (!editStaffId) {
      if (!form.password || form.password.length < 8) {
        errors.password = "Password must be at least 8 characters.";
      }
      if (form.password !== form.password_confirmation) {
        errors.password_confirmation = "Passwords must match.";
      }
    }
  }
  return errors;
};

const ChurchStaffPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  const [churchId, setChurchId] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Unified loading state
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
    const loadChurchAndStaff = async () => {
      if (!churchname) {
        toast.error("No church name provided in URL.");
        setIsInitialLoading(false);
        return;
      }

      try {
        const churchData = await fetchChurchByName(churchname, setPageErrors);
        setChurchId(churchData.ChurchID);

        const [staffData, rolesData] = await Promise.all([
          fetchStaffList(churchData.ChurchID, setPageErrors),
          fetchRoles(churchData.ChurchID, setPageErrors),
        ]);
        setStaffList(staffData);
        setRoles(rolesData);
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

    setIsInitialLoading(true); // Start loading
    loadChurchAndStaff();
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
    console.log("Next clicked, step:", step);
    const stepErrors = validateStep(step, form, editStaffId);
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
    console.log("Previous clicked, step:", step);
    setErrors({});
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (formData) => {
    console.log("Submit triggered with formData:", formData);
    setIsSubmitting(true);
    try {
      await saveStaff({
        editStaffId,
        churchId,
        form: formData,
        setErrors: setPageErrors,
        mutate: () => {
          if (churchId) {
            setIsInitialLoading(true); // Trigger loading for refresh
            Promise.all([
              fetchStaffList(churchId, setPageErrors).then(setStaffList),
              fetchRoles(churchId, setPageErrors).then(setRoles),
            ]).finally(() => setIsInitialLoading(false));
          }
        },
      });
      setOpen(false);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep(1);
    setErrors({});
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
      <div className="lg:ml-75 lg:py-12 mx-3 py-20">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-red-600">Unauthorized</h2>
            <p className="mt-2 text-gray-600">
              You do not have permission to access the Employee page.
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
              <List className="mr-2 h-6 w-6 text-gray-600" /> Church Staff
            </h1>
            <button
              onClick={handleOpen}
              className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
            >
              <Plus className="mr-2 h-5 w-5" /> Create Staff
            </button>
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
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-left">
                  <th className="p-3 text-sm font-semibold">Name</th>
                  <th className="p-3 text-sm font-semibold">Email</th>
                  <th className="p-3 text-sm font-semibold">Role</th>
                  <th className="p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody aria-live="polite">
                {isInitialLoading ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-center">
                      <DataLoading message="Loading staff..." />
                    </td>
                  </tr>
                ) : staffList.length ? (
                  staffList.map((staff, index) => (
                    <tr
                      key={staff.UserChurchRoleID}
                      className={`border-t border-gray-200 hover:bg-gray-50 transition-opacity duration-300 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-900">{`${
                        staff.user.profile.first_name
                      } ${staff.user.profile.middle_name || ""} ${
                        staff.user.profile.last_name
                      }`}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {staff.user.email}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {staff.role?.RoleName || "None"}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEdit(staff.UserChurchRoleID)}
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
                      colSpan={4}
                      className="p-3 text-center text-sm text-gray-600"
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
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
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
                          type="password"
                          value={form.password}
                          onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                          }
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
                          type="password"
                          value={form.password_confirmation}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              password_confirmation: e.target.value,
                            })
                          }
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
                      type="text"
                      value={form.first_name}
                      onChange={(e) =>
                        setForm({ ...form, first_name: e.target.value })
                      }
                      className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.first_name ? "border-red-500" : "border-gray-300"
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
                      type="text"
                      value={form.last_name}
                      onChange={(e) =>
                        setForm({ ...form, last_name: e.target.value })
                      }
                      className={`mt-1 w-full border rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.last_name ? "border-red-500" : "border-gray-300"
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
                      type="text"
                      value={form.middle_name}
                      onChange={(e) =>
                        setForm({ ...form, middle_name: e.target.value })
                      }
                      className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
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
                      type="text"
                      value={form.contact_number}
                      onChange={(e) =>
                        setForm({ ...form, contact_number: e.target.value })
                      }
                      className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
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
                      type="text"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
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
                    <select
                      id="role_id"
                      value={form.role_id}
                      onChange={(e) =>
                        setForm({ ...form, role_id: e.target.value })
                      }
                      className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No Role</option>
                      {roles.map((role) => (
                        <option key={role.RoleID} value={role.RoleID}>
                          {role.RoleName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </form>
            <div className="flex justify-between items-center mt-6">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Previous
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      Object.keys(validateStep(step, form, editStaffId))
                        .length > 0
                    }
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmit(form)}
                    disabled={
                      isSubmitting ||
                      Object.keys(validateStep(step, form, editStaffId))
                        .length > 0
                    }
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editStaffId
                      ? "Update"
                      : "Create"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChurchStaffPage;
