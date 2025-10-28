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
import ConfirmDialog from "@/components/ConfirmDialog";

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

const fetchClergy = async (churchName, setErrors) => {
  try {
    const sanitizedChurchName = churchName.replace(/:\d+$/, "");
    const response = await axios.get(
      `/api/clergy?church_name=${sanitizedChurchName}`
    );
    return response.data || [];
  } catch (error) {
    // For any error (404, 500, network error, etc.), return empty array instead of throwing error
    // This allows the page to load even if the clergy feature isn't working yet
    console.warn('Clergy API not available:', error.message);
    return [];
  }
};

const saveClergyMember = async ({
  editClergyId,
  churchId,
  form,
  setErrors,
  mutate,
}) => {
  try {
    const url = editClergyId ? `/api/clergy/${editClergyId}` : "/api/clergy";
    const method = editClergyId ? "put" : "post";
    const response = await axios({
      method,
      url,
      data: { ChurchID: churchId, ...form },
    });
    mutate();
  } catch (error) {
    setErrors(
      error.response?.data?.errors || [
        error.response?.data?.error || "Failed to save clergy member.",
      ]
    );
    throw error;
  }
};

const validateClergyForm = (form) => {
  const errors = {};
  
  if (!form.first_name || !form.first_name.trim()) {
    errors.first_name = "First name is required.";
  }
  
  if (!form.last_name || !form.last_name.trim()) {
    errors.last_name = "Last name is required.";
  }
  
  if (!form.position || !form.position.trim()) {
    errors.position = "Position is required.";
  }
  
  if (form.middle_name && form.middle_name.length > 1) {
    errors.middle_name = "Middle initial must be a single character.";
  }
  
  return errors;
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
  const [activeTab, setActiveTab] = useState("staff");
  
  // Clergy state management
  const [clergyList, setClergyList] = useState([]);
  const [filteredClergy, setFilteredClergy] = useState([]);
  const [clergySearchTerm, setClergySearchTerm] = useState("");
  const [clergyCurrentPage, setClergyCurrentPage] = useState(1);
  const [clergyForm, setClergyForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    position: ""
  });
  const [editClergyId, setEditClergyId] = useState(null);
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
  const [modalAlertMessage, setModalAlertMessage] = useState("");
  const [modalAlertType, setModalAlertType] = useState("");
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, clergyId: null, currentStatus: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  // Staff confirm dialog state
  const [staffConfirmDialog, setStaffConfirmDialog] = useState({ open: false, staffId: null, currentStatus: null });
  const [staffConfirmLoading, setStaffConfirmLoading] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadChurchStaffAndRoles = async () => {
      if (!churchname) {
        setPageErrors(["No church name provided in URL."]);
        setIsInitialLoading(false);
        return;
      }

      try {
        const [staffData, clergyData] = await Promise.all([
          fetchChurchStaffAndRoles(churchname, setPageErrors),
          fetchClergy(churchname, setPageErrors)
        ]);
        
        setChurchId(staffData.ChurchID);
        setStaffList(staffData.staff);
        setFilteredStaff(staffData.staff);
        setRoles(staffData.roles);
        setClergyList(clergyData);
        setFilteredClergy(clergyData);
      } catch (err) {
        if (err.response?.status === 401) {
          setAlertMessage("Please log in to view staff.");
          setAlertType("error");
          router.push("/login");
        } else {
          setAlertMessage(err.message || "Failed to load data.");
          setAlertType("error");
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

  // Filter clergy based on search term
  useEffect(() => {
    if (!clergySearchTerm) {
      setFilteredClergy(clergyList);
    } else {
      const filtered = clergyList.filter(clergy => {
        const fullName = `${clergy.first_name} ${clergy.middle_name ? clergy.middle_name + '.' : ''} ${clergy.last_name}`.toLowerCase();
        const position = clergy.position?.toLowerCase() || '';
        const searchLower = clergySearchTerm.toLowerCase();
        
        return fullName.includes(searchLower) || 
               position.includes(searchLower);
      });
      setFilteredClergy(filtered);
    }
    setClergyCurrentPage(1);
  }, [clergySearchTerm, clergyList]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = filteredStaff.slice(startIndex, endIndex);

  // Calculate clergy pagination
  const clergyTotalPages = Math.ceil(filteredClergy.length / itemsPerPage);
  const clergyStartIndex = (clergyCurrentPage - 1) * itemsPerPage;
  const clergyEndIndex = clergyStartIndex + itemsPerPage;
  const currentClergy = filteredClergy.slice(clergyStartIndex, clergyEndIndex);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Handle clergy search
  const handleClergySearch = (term) => {
    setClergySearchTerm(term);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle clergy pagination
  const handleClergyPageChange = (page) => {
    setClergyCurrentPage(page);
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
      setAlertMessage(err.message || "Failed to fetch staff details.");
      setAlertType("error");
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
      setAlertMessage("Failed to save staff.");
      setAlertType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setErrors({});
    setModalAlertMessage("");
    setModalAlertType("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Clergy handlers
  const handleClergyOpen = () => {
    setClergyForm({
      first_name: "",
      last_name: "",
      middle_name: "",
      position: ""
    });
    setEditClergyId(null);
    setErrors({});
    setModalAlertMessage("");
    setModalAlertType("");
    setOpen(true);
  };

  const handleClergyEdit = async (clergyId) => {
    try {
      const response = await axios.get(`/api/clergy/${clergyId}`);
      const clergy = response.data;
      setClergyForm({
        first_name: clergy.first_name,
        last_name: clergy.last_name,
        middle_name: clergy.middle_name || "",
        position: clergy.position
      });
      setEditClergyId(clergyId);
      setErrors({});
      setModalAlertMessage("");
      setModalAlertType("");
      setOpen(true);
    } catch (err) {
      setAlertMessage("Failed to fetch clergy details.");
      setAlertType("error");
    }
  };

  const handleClergyChange = (e) => {
    const { name, value } = e.target;
    setClergyForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleClergySubmit = async () => {
    setIsSubmitting(true);
    const formErrors = validateClergyForm(clergyForm);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await saveClergyMember({
        editClergyId,
        churchId,
        form: clergyForm,
        setErrors: (backendErrors) => {
          setErrors(backendErrors);
        },
        mutate: () => {
          if (churchId) {
            fetchClergy(churchname, setPageErrors)
              .then((data) => {
                setClergyList(data);
                setFilteredClergy(data);
              })
              .catch(() => {});
          }
        },
      });
      setOpen(false);
      setAlertMessage(editClergyId ? "Clergy member updated successfully!" : "Clergy member added successfully!");
      setAlertType("success");
    } catch (err) {
      setModalAlertType("error");
      setModalAlertMessage("Failed to save clergy member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (clergyId, currentStatus) => {
    setConfirmDialog({
      open: true,
      clergyId,
      currentStatus
    });
  };

  const confirmToggleStatus = async () => {
    try {
      setConfirmLoading(true);
      await axios.patch(`/api/clergy/${confirmDialog.clergyId}/toggle-status`);
      
      // Refresh clergy list
      const data = await fetchClergy(churchname, () => {});
      setClergyList(data);
      setFilteredClergy(data);
      
      setAlertMessage(`Clergy member ${confirmDialog.currentStatus ? 'deactivated' : 'activated'} successfully!`);
      setAlertType("success");
    } catch (err) {
      setAlertMessage("Failed to update clergy status.");
      setAlertType("error");
    } finally {
      setConfirmLoading(false);
      setConfirmDialog({ open: false, clergyId: null, currentStatus: null });
    }
  };

  const handleStaffToggleStatus = (staffId, currentStatus) => {
    setStaffConfirmDialog({
      open: true,
      staffId,
      currentStatus
    });
  };

  const confirmStaffToggleStatus = async () => {
    try {
      setStaffConfirmLoading(true);
      await axios.patch(`/api/staff/${staffConfirmDialog.staffId}/toggle-status`);
      
      // Refresh staff list
      const data = await fetchChurchStaffAndRoles(churchname, () => {});
      setStaffList(data.staff);
      setFilteredStaff(data.staff);
      
      setAlertMessage(`Staff member ${staffConfirmDialog.currentStatus ? 'deactivated' : 'activated'} successfully!`);
      setAlertType("success");
    } catch (err) {
      setAlertMessage("Failed to update staff status.");
      setAlertType("error");
    } finally {
      setStaffConfirmLoading(false);
      setStaffConfirmDialog({ open: false, staffId: null, currentStatus: null });
    }
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

  // Permission helper function
  const hasPermission = (permissionName) => {
    return user?.profile?.system_role?.role_name === "ChurchOwner" ||
      user?.church_role?.permissions?.some(
        (perm) => perm.PermissionName === permissionName
      );
  };

  const hasAccess = hasPermission("employee_list");
  const canAddEmployee = hasPermission("employee_add");
  const canEditEmployee = hasPermission("employee_edit");
  const canDeactivateEmployee = hasPermission("employee_deactivate");

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
      <div className="w-full h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Manage Church Personnel
            </h1>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("staff")}
                    className={`${activeTab === "staff"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm cursor-pointer hover:cursor-pointer`}
                  >
                    Staff
                  </button>
                  <button
                    onClick={() => setActiveTab("clergy")}
                    className={`${activeTab === "clergy"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm cursor-pointer hover:cursor-pointer`}
                  >
                    Clergy
                  </button>
                </nav>
              </div>
            </div>

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

            {/* Tab Content */}
            {activeTab === "staff" && (
              <div className="mt-6">
                <div className="overflow-x-auto">
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Church Staff</h3>
                          <p className="mt-1 text-sm text-gray-600">Manage staff members with system accounts and roles.</p>
                        </div>
                        <Button 
                          onClick={handleOpen} 
                          className="flex items-center" 
                          disabled={!canAddEmployee}
                          title={!canAddEmployee ? 'You do not have permission to add employees' : ''}
                        >
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
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {isInitialLoading ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8">
                                <DataLoading message="Loading staff..." />
                              </td>
                            </tr>
                          ) : currentStaff.length > 0 ? (
                            currentStaff.map((staff) => (
                              <tr key={staff.UserChurchRoleID} className={`hover:bg-gray-50 ${!staff.is_active ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
{(() => {
                                      const cap = s => (s || '').split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                                      const first = cap(staff.user.profile.first_name);
                                      const last = cap(staff.user.profile.last_name);
                                      const mi = (staff.user.profile.middle_name || '').trim();
                                      const miStr = mi ? ` ${mi.charAt(0).toUpperCase()}.` : '';
                                      return `${last}, ${first}${miStr}`.trim();
                                    })()}
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
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    staff.is_active 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {staff.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-center items-center space-x-2">
                                    <Button
                                      onClick={() => handleEdit(staff.UserChurchRoleID)}
                                      variant="outline"
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={!canEditEmployee}
                                      title={!canEditEmployee ? 'You do not have permission to edit employees' : ''}
                                    >
                                      <Pencil className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      onClick={() => handleStaffToggleStatus(staff.UserChurchRoleID, staff.is_active)}
                                      variant="outline"
                                      className={`inline-flex items-center px-2 py-1 text-xs font-medium min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed ${
                                        staff.is_active 
                                          ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                                          : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'
                                      }`}
                                      disabled={!canDeactivateEmployee}
                                      title={!canDeactivateEmployee ? 'You do not have permission to deactivate employees' : ''}
                                    >
                                      {staff.is_active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
            )}

            {/* Clergy Tab Content */}
            {activeTab === "clergy" && (
              <div className="mt-6">
                <div className="overflow-x-auto">
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Clergy Members</h3>
                          <p className="mt-1 text-sm text-gray-600">Manage clergy information for reference purposes.</p>
                        </div>
                        <Button 
                          onClick={handleClergyOpen} 
                          className="flex items-center" 
                          disabled={!canAddEmployee}
                          title={!canAddEmployee ? 'You do not have permission to add clergy' : ''}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Clergy
                        </Button>
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      <SearchAndPagination
                        searchQuery={clergySearchTerm}
                        onSearchChange={handleClergySearch}
                        currentPage={clergyCurrentPage}
                        totalPages={clergyTotalPages}
                        onPageChange={handleClergyPageChange}
                        totalItems={filteredClergy.length}
                        itemsPerPage={itemsPerPage}
                        placeholder="Search clergy..."
                      />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {isInitialLoading ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-8">
                                <DataLoading message="Loading clergy..." />
                              </td>
                            </tr>
                          ) : currentClergy.length > 0 ? (
                            currentClergy.map((clergy) => (
                              <tr key={clergy.ClergyID} className={`hover:bg-gray-50 ${!clergy.is_active ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
{(() => {
                                    const cap = s => (s || '').split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                                    const first = cap(clergy.first_name);
                                    const last = cap(clergy.last_name);
                                    const mi = (clergy.middle_name || '').trim();
                                    const miStr = mi ? ` ${mi.charAt(0).toUpperCase()}.` : '';
                                    return `${last}, ${first}${miStr}`.trim();
                                  })()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {clergy.position}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    clergy.is_active 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {clergy.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-center items-center space-x-2">
                                    <Button
                                      onClick={() => handleClergyEdit(clergy.ClergyID)}
                                      variant="outline"
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={!canEditEmployee}
                                      title={!canEditEmployee ? 'You do not have permission to edit clergy' : ''}
                                    >
                                      <Pencil className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      onClick={() => handleToggleStatus(clergy.ClergyID, clergy.is_active)}
                                      variant="outline"
                                      className={`inline-flex items-center px-2 py-1 text-xs font-medium min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed ${
                                        clergy.is_active 
                                          ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                                          : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'
                                      }`}
                                      disabled={!canDeactivateEmployee}
                                      title={!canDeactivateEmployee ? 'You do not have permission to deactivate clergy' : ''}
                                    >
                                      {clergy.is_active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                No clergy members found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


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
                    {activeTab === "staff" 
                      ? (editStaffId ? "Edit Staff Member" : "Add New Staff Member")
                      : (editClergyId ? "Edit Clergy Member" : "Add New Clergy Member")
                    }
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {activeTab === "staff"
                      ? (editStaffId ? "Update staff member information" : "Create a new staff member account")
                      : (editClergyId ? "Update clergy member information" : "Add clergy member information")
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 py-6 max-h-[calc(95vh-140px)] overflow-y-auto">
              {modalAlertMessage && (
                <div className="mb-4">
                  <Alert
                    type={modalAlertType}
                    message={modalAlertMessage}
                    onClose={() => setModalAlertMessage("")}
                  />
                </div>
              )}
              <form className="space-y-6">
                {activeTab === "staff" && (
                  <>
                    {/* Account Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Account Information</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${
                              errors.email ? "border-red-500" : ""
                            }`}
                            disabled={editStaffId !== null}
                            required
                            autoFocus
                            placeholder="Enter email address"
                          />
                          {errors.email && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.email}
                            </p>
                          )}
                        </div>
                        
                        {!editStaffId && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${
                                  errors.password ? "border-red-500" : ""
                                }`}
                                required
                                placeholder="Create password"
                              />
                              {errors.password && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.password}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                value={form.password_confirmation}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${
                                  errors.password_confirmation ? "border-red-500" : ""
                                }`}
                                required
                                placeholder="Confirm password"
                              />
                              {errors.password_confirmation && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.password_confirmation}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "staff" && (
                  <>
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-t pt-6">Personal Information</h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                          <div className="md:col-span-5">
                            <Label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                              First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="first_name"
                              name="first_name"
                              type="text"
                              value={form.first_name}
                              onChange={handleChange}
                              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${
                                errors.first_name ? "border-red-500" : ""
                              }`}
                              required
                              placeholder="Enter first name"
                            />
                            {errors.first_name && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.first_name}
                              </p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="middle_name" className="block text-sm font-medium text-gray-700 mb-1">
                              M.I. <span className="text-gray-400 text-xs">(Optional)</span>
                            </Label>
                            <Input
                              id="middle_name"
                              name="middle_name"
                              type="text"
                              value={form.middle_name}
                              onChange={handleChange}
                              maxLength={1}
                              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 text-center ${
                                errors.middle_name ? "border-red-500" : ""
                              }`}
                              placeholder="M"
                            />
                            {errors.middle_name && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.middle_name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="last_name"
                            name="last_name"
                            type="text"
                            value={form.last_name}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${
                              errors.last_name ? "border-red-500" : ""
                            }`}
                            required
                            placeholder="Enter last name"
                          />
                          {errors.last_name && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "clergy" && (
                  <>
                    {/* Clergy Personal Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Clergy Information</h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                          <div className="md:col-span-5">
                            <Label htmlFor="clergy_first_name" className="block text-sm font-medium text-gray-700 mb-1">
                              First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="clergy_first_name"
                              name="first_name"
                              type="text"
                              value={clergyForm.first_name}
                              onChange={handleClergyChange}
                              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${
                                errors.first_name ? "border-red-500" : ""
                              }`}
                              required
                              autoFocus
                              placeholder="Enter first name"
                            />
                            {errors.first_name && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.first_name}
                              </p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="clergy_middle_name" className="block text-sm font-medium text-gray-700 mb-1">
                              M.I. <span className="text-gray-400 text-xs">(Optional)</span>
                            </Label>
                            <Input
                              id="clergy_middle_name"
                              name="middle_name"
                              type="text"
                              value={clergyForm.middle_name}
                              onChange={handleClergyChange}
                              maxLength={1}
                              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 text-center ${
                                errors.middle_name ? "border-red-500" : ""
                              }`}
                              placeholder="M"
                            />
                            {errors.middle_name && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.middle_name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="clergy_last_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="clergy_last_name"
                            name="last_name"
                            type="text"
                            value={clergyForm.last_name}
                            onChange={handleClergyChange}
                            className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${
                              errors.last_name ? "border-red-500" : ""
                            }`}
                            required
                            placeholder="Enter last name"
                          />
                          {errors.last_name && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.last_name}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="clergy_position" className="block text-sm font-medium text-gray-700 mb-1">
                            Position <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="clergy_position"
                            name="position"
                            type="text"
                            value={clergyForm.position}
                            onChange={handleClergyChange}
                            className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${
                              errors.position ? "border-red-500" : ""
                            }`}
                            required
                            placeholder="e.g., Parish Priest, Deacon, Bishop"
                          />
                          {errors.position && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.position}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "staff" && (
                  <>
                    {/* Contact Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-t pt-6">Contact Information</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Number <span className="text-gray-400 text-xs">(Optional)</span>
                          </Label>
                          <Input
                            id="contact_number"
                            name="contact_number"
                            type="text"
                            value={form.contact_number}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${
                              errors.contact_number ? "border-red-500" : ""
                            }`}
                            placeholder="Enter contact number (optional)"
                          />
                          {errors.contact_number && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.contact_number}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                            Address <span className="text-gray-400 text-xs">(Optional)</span>
                          </Label>
                          <Input
                            id="address"
                            name="address"
                            type="text"
                            value={form.address}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${
                              errors.address ? "border-red-500" : ""
                            }`}
                            placeholder="Enter address (optional)"
                          />
                          {errors.address && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role Assignment Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-t pt-6">Role Assignment</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-1">
                            Church Role {!editStaffId && <span className="text-red-500">*</span>}
                          </Label>
                          {roles.length === 0 ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-red-700 text-sm">
                                No roles available. Please create roles first.
                              </p>
                            </div>
                          ) : (
                            <select
                              id="role_id"
                              name="role_id"
                              value={form.role_id}
                              onChange={handleChange}
                              className={`w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.role_id ? "border-red-500" : ""
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
                            <p className="mt-1 text-xs text-red-600">
                              {errors.role_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
                onClick={() => {
                  if (activeTab === "staff") {
                    handleSubmit(form);
                  } else {
                    handleClergySubmit();
                  }
                }}
                disabled={
                  isSubmitting ||
                  (activeTab === "staff" ? 
                    Object.keys(validateForm(form, editStaffId, roles)).length > 0 :
                    Object.keys(validateClergyForm(clergyForm)).length > 0
                  )
                }
                className="px-4 py-2 text-sm font-medium"
              >
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  activeTab === "staff" ?
                    (editStaffId ? "Update Staff" : "Create Staff") :
                    (editClergyId ? "Update Clergy" : "Add Clergy")
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => { if (!confirmLoading) setConfirmDialog({ open: false, clergyId: null, currentStatus: null }); }}
        onConfirm={confirmToggleStatus}
        title={`${confirmDialog.currentStatus ? 'Deactivate' : 'Activate'} Clergy Member`}
        message={`Are you sure you want to ${confirmDialog.currentStatus ? 'deactivate' : 'activate'} this clergy member?`}
        confirmText={confirmDialog.currentStatus ? 'Deactivate' : 'Activate'}
        type={confirmDialog.currentStatus ? 'danger' : 'info'}
        isLoading={confirmLoading}
      />

      <ConfirmDialog
        isOpen={staffConfirmDialog.open}
        onClose={() => { if (!staffConfirmLoading) setStaffConfirmDialog({ open: false, staffId: null, currentStatus: null }); }}
        onConfirm={confirmStaffToggleStatus}
        title={`${staffConfirmDialog.currentStatus ? 'Deactivate' : 'Activate'} Staff Member`}
        message={`Are you sure you want to ${staffConfirmDialog.currentStatus ? 'deactivate' : 'activate'} this staff member?`}
        confirmText={staffConfirmDialog.currentStatus ? 'Deactivate' : 'Activate'}
        type={staffConfirmDialog.currentStatus ? 'danger' : 'info'}
        isLoading={staffConfirmLoading}
      />
    </div>
  );
};

export default EmployeePage;
