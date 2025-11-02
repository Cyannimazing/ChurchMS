"use client";
import React from "react";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { Plus, X, Loader2, Edit, Trash2, Settings } from "lucide-react";
import { useAuth } from "@/hooks/auth.jsx";
import DataLoading from "@/components/DataLoading";
import { Button } from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import SearchAndPagination from "@/components/SearchAndPagination";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";

const fetchChurchAndSacraments = async (churchName, setErrors) => {
  try {
    const response = await axios.get(`/api/sacrament-services/${churchName}`);
    console.log(response);
    return response.data;
  } catch (error) {
    setErrors([
      error.response?.data?.error ||
        "Failed to fetch church and sacrament services data. Please ensure the church exists.",
    ]);
    throw error;
  }
};

const fetchSacramentById = async (serviceId, churchId, setErrors) => {
  try {
    const response = await axios.get(
      `/api/sacrament-services/${serviceId}?church_id=${churchId}`
    );
    return response.data;
  } catch (error) {
    setErrors([error.response?.data?.error || "Failed to fetch sacrament service details."]);
    throw error;
  }
};

const saveSacramentService = async ({ editServiceId, churchName, form, setErrors, mutate }) => {
  try {
    const url = editServiceId ? `/api/sacrament-services/${editServiceId}` : "/api/sacrament-services";
    const method = editServiceId ? "put" : "post";
    const payload = { church_name: churchName, ...form };
    const response = await axios({ method, url, data: payload });
    mutate();
  } catch (error) {
    if (error.response?.status === 422) {
      console.error('Validation errors:', error.response.data);
      setErrors(error.response.data.errors || ["Validation failed."]);
    } else {
      console.error('Save error:', error.response?.data || error.message);
      setErrors([
        error.response?.data?.error || `Failed to save sacrament service: ${error.message}`,
      ]);
    }
    throw error;
  }
};

const SacramentPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  const [churchId, setChurchId] = useState(null);
  const [sacraments, setSacraments] = useState([]);
  const [filteredSacraments, setFilteredSacraments] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    ServiceName: "", 
    Description: "",
    isStaffForm: true,
    isMass: false,
    isCertificateGeneration: false,
    advanceBookingNumber: 3,
    advanceBookingUnit: "weeks",
    member_discount_type: "",
    member_discount_value: "",
    fee: 0,
    isMultipleService: false,
    sub_sacrament_services: [],
    sub_services: []
  });
  const [editSacramentId, setEditSacramentId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sacramentToDelete, setSacramentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const itemsPerPage = 5;
  
  // Check if there's already a Mass service
  const existingMassService = sacraments.find(s => s.isMass === true && s.ServiceID !== editSacramentId);
  const isMassRestricted = existingMassService && !editSacramentId;
  const canEditMass = !existingMassService || (editSacramentId && sacraments.find(s => s.ServiceID === editSacramentId)?.isMass);

  useEffect(() => {
    const loadChurchAndSacraments = async () => {
      if (!churchname) {
        setErrors(["No church name provided in URL."]);
        setIsInitialLoading(false);
        return;
      }

      try {
        const data = await fetchChurchAndSacraments(churchname, setErrors);
        setChurchId(data.ChurchID);
        setSacraments(data.sacraments || []);
        setFilteredSacraments(data.sacraments || []);
      } catch (err) {
        if (err.response?.status === 401) {
          setErrors(["Please log in to view sacraments."]);
          router.push("/login");
        } else {
          setErrors([err.message || "Failed to load data."]);
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    setIsInitialLoading(true);
    loadChurchAndSacraments();
  }, [churchname, router]);

  // Filter sacraments based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSacraments(sacraments);
    } else {
      const filtered = sacraments.filter(sacrament =>
        sacrament.ServiceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sacrament.Description && sacrament.Description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSacraments(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, sacraments]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredSacraments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSacraments = filteredSacraments.slice(startIndex, endIndex);

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
      ServiceName: "", 
      Description: "",
      isStaffForm: true,
      isMass: false,
      isCertificateGeneration: false,
      advanceBookingNumber: 3,
      advanceBookingUnit: "weeks",
      member_discount_type: "",
      member_discount_value: "",
      fee: 0,
      isMultipleService: false,
      sub_sacrament_services: [],
      sub_services: []
    });
    setEditSacramentId(null);
    setErrors([]);
    setOpen(true);
  };

  const handleEdit = async (sacramentId) => {
    if (!churchId) {
      setErrors(["Church ID not available. Please try again."]);
      return;
    }
    
    setIsLoadingEdit(true);
    setErrors([]);
    
    // First try to use local data
    const localSacrament = sacraments.find(s => s.ServiceID === sacramentId);
    if (localSacrament) {
      setForm({
        ServiceName: localSacrament.ServiceName || "",
        Description: localSacrament.Description || "",
        isStaffForm: localSacrament.isStaffForm !== undefined ? localSacrament.isStaffForm : true,
        isMass: localSacrament.isMass !== undefined ? localSacrament.isMass : false,
        isCertificateGeneration: localSacrament.isCertificateGeneration !== undefined ? localSacrament.isCertificateGeneration : false,
        advanceBookingNumber: localSacrament.advanceBookingNumber || 3,
        advanceBookingUnit: localSacrament.advanceBookingUnit || "weeks",
        member_discount_type: localSacrament.member_discount_type || "",
        member_discount_value: localSacrament.member_discount_value || "",
        fee: localSacrament.fee || 0,
        isMultipleService: localSacrament.isMultipleService || false,
        sub_sacrament_services: (localSacrament.sub_sacrament_services || []).map(v => ({
          id: v.SubSacramentServiceID || v.id,
          name: v.SubServiceName ?? v.name ?? "",
          fee: v.fee ?? 0,
        })),
        sub_services: (localSacrament.sub_services || []).map(ss => ({
          SubServiceName: ss.SubServiceName || "",
          Description: ss.Description || "",
          IsActive: ss.IsActive !== undefined ? ss.IsActive : true,
          schedules: (ss.schedules || []).map(sch => {
            // Convert time to HH:MM format if needed
            const formatTime = (time) => {
              if (!time) return "14:00";
              // If already in HH:MM format, return as is
              if (/^\d{2}:\d{2}$/.test(time)) return time;
              // If in HH:MM:SS format, strip seconds
              if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time.substring(0, 5);
              return time;
            };
            return {
              DayOfWeek: sch.DayOfWeek || "Thursday",
              StartTime: formatTime(sch.StartTime),
              EndTime: formatTime(sch.EndTime),
              OccurrenceType: sch.OccurrenceType || "weekly",
              OccurrenceValue: sch.OccurrenceValue || null,
            };
          }),
          requirements: (ss.requirements || []).map(req => ({
            RequirementName: req.RequirementName || "",
            isNeeded: req.isNeeded !== undefined ? req.isNeeded : true,
          })),
        })),
      });
      setEditSacramentId(sacramentId);
      setOpen(true);
      setIsLoadingEdit(false);
      return;
    }
    
    // If not found locally, fetch from API
    try {
      const sacrament = await fetchSacramentById(sacramentId, churchId, setErrors);
      
      setForm({
        ServiceName: sacrament.ServiceName || "",
        Description: sacrament.Description || "",
        isStaffForm: sacrament.isStaffForm !== undefined ? sacrament.isStaffForm : true,
        isMass: sacrament.isMass !== undefined ? sacrament.isMass : false,
        isCertificateGeneration: sacrament.isCertificateGeneration !== undefined ? sacrament.isCertificateGeneration : false,
        advanceBookingNumber: sacrament.advanceBookingNumber || 3,
        advanceBookingUnit: sacrament.advanceBookingUnit || "weeks",
        member_discount_type: sacrament.member_discount_type || "",
        member_discount_value: sacrament.member_discount_value || "",
        fee: sacrament.fee || 0,
        isMultipleService: sacrament.isMultipleService || false,
        sub_sacrament_services: (sacrament.sub_sacrament_services || []).map(v => ({
          id: v.SubSacramentServiceID || v.id,
          name: v.SubServiceName ?? v.name ?? "",
          fee: v.fee ?? 0,
        })),
        sub_services: (sacrament.sub_services || []).map(ss => ({
          SubServiceName: ss.SubServiceName || "",
          Description: ss.Description || "",
          IsActive: ss.IsActive !== undefined ? ss.IsActive : true,
          schedules: (ss.schedules || []).map(sch => {
            // Convert time to HH:MM format if needed
            const formatTime = (time) => {
              if (!time) return "14:00";
              // If already in HH:MM format, return as is
              if (/^\d{2}:\d{2}$/.test(time)) return time;
              // If in HH:MM:SS format, strip seconds
              if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time.substring(0, 5);
              return time;
            };
            return {
              DayOfWeek: sch.DayOfWeek || "Thursday",
              StartTime: formatTime(sch.StartTime),
              EndTime: formatTime(sch.EndTime),
              OccurrenceType: sch.OccurrenceType || "weekly",
              OccurrenceValue: sch.OccurrenceValue || null,
            };
          }),
          requirements: (ss.requirements || []).map(req => ({
            RequirementName: req.RequirementName || "",
            isNeeded: req.isNeeded !== undefined ? req.isNeeded : true,
          })),
        })),
      });
      setEditSacramentId(sacramentId);
      setOpen(true);
    } catch (err) {
      setErrors([err.message || "Failed to fetch sacrament details."]);
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleDelete = (sacramentId) => {
    if (!churchId) {
      setErrors(["Church ID not available. Please try again."]);
      return;
    }
    const sacrament = sacraments.find(s => s.ServiceID === sacramentId);
    setSacramentToDelete(sacrament);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!sacramentToDelete) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`/api/sacrament-services/${sacramentToDelete.ServiceID}?church_id=${churchId}`);
      // Refresh the list
      const data = await fetchChurchAndSacraments(churchname, setErrors);
      setChurchId(data.ChurchID);
      setSacraments(data.sacraments || []);
      setFilteredSacraments(data.sacraments || []);
      setAlertMessage("Sacrament deleted successfully!");
      setAlertType("success");
      setShowDeleteConfirm(false);
      setSacramentToDelete(null);
    } catch (err) {
      setErrors([err.response?.data?.error || "Failed to delete sacrament."]);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSacramentToDelete(null);
  };

  const handleConfigure = (sacramentId) => {
    router.push(`/${churchname}/service/configure/${sacramentId}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!churchname || !form.ServiceName.trim()) {
      setErrors(["Church name or Service Name is missing."]);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formData = {
        ServiceName: form.ServiceName,
        Description: form.Description || "",
        isStaffForm: form.isStaffForm,
        isMass: form.isMass,
        isCertificateGeneration: form.isCertificateGeneration,
        advanceBookingNumber: form.advanceBookingNumber,
        advanceBookingUnit: form.advanceBookingUnit,
        member_discount_type: form.member_discount_type || null,
        member_discount_value: form.member_discount_value ? parseFloat(form.member_discount_value) : null,
        fee: form.isMultipleService ? 0 : (parseFloat(form.fee) || 0),
        isMultipleService: form.isMultipleService,
        sub_sacrament_services: form.isMultipleService ? form.sub_sacrament_services : [],
        sub_services: form.sub_services || [],
      };
      
      await saveSacramentService({
        editServiceId: editSacramentId,
        churchName: churchname,
        form: formData,
        setErrors,
        mutate: () =>
          fetchChurchAndSacraments(churchname, setErrors).then((data) => {
            setChurchId(data.ChurchID);
            setSacraments(data.sacraments || []);
            setFilteredSacraments(data.sacraments || []);
          }),
      });
      setOpen(false);
      setAlertMessage(editSacramentId ? "Sacrament updated successfully!" : "Sacrament created successfully!");
      setAlertType("success");
    } catch (err) {
      setErrors([err.response?.data?.error || "Failed to save sacrament."]);
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

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alertMessage) return;
    const timeout = setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 5000);
    return () => clearTimeout(timeout);
  }, [alertMessage]);

  // Permission helper function
  const hasPermission = (permissionName) => {
    return user?.profile?.system_role?.role_name === "ChurchOwner" ||
      user?.church_role?.permissions?.some(
        (perm) => perm.PermissionName === permissionName
      );
  };

  const hasAccess = hasPermission("service_list");
  const canAddService = hasPermission("service_add");
  const canEditService = hasPermission("service_edit");
  const canDeleteService = hasPermission("service_delete");
  const canConfigureService = hasPermission("service_configure");

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
                You do not have permission to access the Service page.
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
              Manage Church Sacraments
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
                        <h3 className="text-lg font-medium text-gray-900">Church Sacraments</h3>
                        <p className="mt-1 text-sm text-gray-600">Manage sacraments and their schedules for church members.</p>
                      </div>
                      <Button 
                        onClick={handleOpen} 
                        className="flex items-center" 
                        disabled={!canAddService}
                        title={!canAddService ? 'You do not have permission to add services' : ''}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Sacrament
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
                      totalItems={filteredSacraments.length}
                      itemsPerPage={itemsPerPage}
                      placeholder="Search sacraments..."
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sacrament Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Variants</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Services</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Discount</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isInitialLoading ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8">
                              <DataLoading message="Loading sacraments..." />
                            </td>
                          </tr>
                        ) : currentSacraments.length > 0 ? (
                          currentSacraments.map((sacrament) => (
                            <tr key={sacrament.ServiceID} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {sacrament.ServiceName}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {sacrament.sub_sacrament_services && sacrament.sub_sacrament_services.length > 0 ? (
                                    <div className="space-y-1">
                                      {sacrament.sub_sacrament_services.map((variant, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                            {variant.SubServiceName}
                                          </span>
                                          <span className="text-xs text-gray-600">
                                            ₱{parseFloat(variant.fee).toLocaleString()}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600">
                                        ₱{parseFloat(sacrament.fee || 0).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {sacrament.sub_services && sacrament.sub_services.length > 0 ? (
                                    <div className="space-y-1">
                                      {sacrament.sub_services.map((subService, idx) => (
                                        <div key={idx} className="flex items-center">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {subService.SubServiceName}
                                            {subService.schedules && subService.schedules.length > 0 && (
                                              <span className="ml-1 text-blue-600">({subService.schedules.length})</span>
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">None</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {sacrament.member_discount_type && sacrament.member_discount_value ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {sacrament.member_discount_type === 'percentage' 
                                        ? `${sacrament.member_discount_value}%` 
                                        : `PHP ${parseFloat(sacrament.member_discount_value).toLocaleString()}`}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">No discount</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-sm">
                                  {sacrament.isCertificateGeneration ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Enabled
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                      Disabled
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center items-center space-x-2">
                                  <Button
                                    onClick={() => handleEdit(sacrament.ServiceID)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isLoadingEdit || !canEditService}
                                    title={!canEditService ? 'You do not have permission to edit services' : ''}
                                  >
                                    {isLoadingEdit ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Edit className="h-3 w-3 mr-1" />
                                    )}
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() => handleDelete(sacrament.ServiceID)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!canDeleteService}
                                    title={!canDeleteService ? 'You do not have permission to delete services' : ''}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                  <Button
                                    onClick={() => handleConfigure(sacrament.ServiceID)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!canConfigureService}
                                    title={!canConfigureService ? 'You do not have permission to configure services' : ''}
                                  >
                                    <Settings className="h-3 w-3 mr-1" />
                                    Configure
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                              {searchTerm ? 'No sacraments found matching your search.' : 'No sacraments available.'}
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
            className="bg-white rounded-lg shadow-2xl w-full max-w-7xl mx-4 p-6 relative max-h-[90vh] overflow-y-auto"
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
              className="text-xl font-bold text-gray-900 mb-6"
            >
              {editSacramentId ? "Edit Sacrament" : "Create Sacrament"}
            </h2>
            <form onSubmit={handleSubmit} className="">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Main Fields */}
                <div className="space-y-6">
                  <div>
                    <Label
                      htmlFor="serviceName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Service Name
                    </Label>
                    <Input
                      id="serviceName"
                      type="text"
                      value={form.ServiceName}
                      onChange={(e) => setForm({ ...form, ServiceName: e.target.value })}
                      required
                      className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                      placeholder="Enter service name"
                      autoFocus
                    />
                    <InputError
                      messages={errors.ServiceName}
                      className="mt-2 text-xs text-red-600"
                    />
                  </div>
                  
                  <div>
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-gray-700"
                    >
                      Description
                    </Label>
                    <textarea
                      id="description"
                      value={form.Description}
                      onChange={(e) => setForm({ ...form, Description: e.target.value })}
                      className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                      placeholder="Enter service description (optional)"
                      rows={3}
                    />
                    <InputError
                      messages={errors.Description}
                      className="mt-2 text-xs text-red-600"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center">
                      <input
                        id="isStaffForm"
                        type="checkbox"
                        checked={form.isStaffForm}
                        onChange={(e) => setForm({ ...form, isStaffForm: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <Label
                        htmlFor="isStaffForm"
                        className="ml-2 text-sm font-medium text-gray-700"
                      >
                        Staff Only Form
                      </Label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      If checked, only staff can fill this form. If unchecked, users from the frontend can also fill this form.
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center">
                      <input
                        id="isMass"
                        type="checkbox"
                        checked={form.isMass}
                        onChange={(e) => setForm({ ...form, isMass: e.target.checked })}
                        disabled={!canEditMass}
                        className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
                          !canEditMass ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                      <Label
                        htmlFor="isMass"
                        className={`ml-2 text-sm font-medium ${
                          !canEditMass ? 'text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        Mass
                      </Label>
                    </div>
                    {existingMassService && !editSacramentId ? (
                      <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-xs text-yellow-800 font-medium">
                          ⚠️ Mass Service Already Exists
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Only one service can be marked as Mass. The service "{existingMassService.ServiceName}" is already set as the Mass service.
                        </p>
                      </div>
                    ) : existingMassService && editSacramentId && !sacraments.find(s => s.ServiceID === editSacramentId)?.isMass ? (
                      <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-xs text-yellow-800 font-medium">
                          ⚠️ Mass Service Already Exists
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Only one service can be marked as Mass. The service "{existingMassService.ServiceName}" is already set as the Mass service.
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        Check this box if this sacrament is related to Mass services. Only one service can be marked as Mass at a time.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center">
                      <input
                        id="isCertificateGeneration"
                        type="checkbox"
                        checked={form.isCertificateGeneration}
                        onChange={(e) => setForm({ ...form, isCertificateGeneration: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <Label
                        htmlFor="isCertificateGeneration"
                        className="ml-2 text-sm font-medium text-gray-700"
                      >
                        Enable Certificate Generation
                      </Label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Check this box if this sacrament should allow certificate generation for completed appointments.
                    </p>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Advance Notice
                    </Label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <select
                          value={form.advanceBookingNumber}
                          onChange={(e) => setForm({ ...form, advanceBookingNumber: parseInt(e.target.value) })}
                          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          value={form.advanceBookingUnit}
                          onChange={(e) => setForm({ ...form, advanceBookingUnit: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Users must book appointments at least {form.advanceBookingNumber} {form.advanceBookingUnit} before the appointment date for preparation and requirements gathering.
                    </p>
                  </div>
                  
                  {/* Fee and Multiple Service Variants */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fee" className="text-sm font-medium text-gray-700">
                        Fee (₱)
                      </Label>
                      <Input
                        id="fee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.fee}
                        onChange={(e) => setForm({ ...form, fee: e.target.value })}
                        disabled={form.isMultipleService}
                        className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 disabled:bg-gray-100"
                        placeholder="Enter fee"
                      />
                      {form.isMultipleService && (
                        <p className="mt-1 text-xs text-gray-500">Fee is managed per variant when multiple services are enabled.</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center">
                        <input
                          id="isMultipleService"
                          type="checkbox"
                          checked={form.isMultipleService}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const next = { ...form, isMultipleService: checked };
                            if (checked && (!form.sub_sacrament_services || form.sub_sacrament_services.length < 2)) {
                              next.sub_sacrament_services = [
                                { name: `${form.ServiceName || 'Service'} Public`, fee: 0 },
                                { name: `${form.ServiceName || 'Service'} Private`, fee: 0 }
                              ];
                            }
                            setForm(next);
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <Label htmlFor="isMultipleService" className="ml-2 text-sm font-medium text-gray-700">
                          Multiple Service Variants
                        </Label>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Enable if this service has variants (e.g., Baptism Public/Private). Variants share the same form, requirements, and field mapping.
                      </p>
                    </div>

                    {form.isMultipleService && (
                      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-sm font-medium text-gray-700">Service Variants</Label>
                          <Button
                            type="button"
                            onClick={() => setForm({
                              ...form,
                              sub_sacrament_services: [
                                ...form.sub_sacrament_services,
                                { name: "", fee: 0 }
                              ]
                            })}
                            variant="outline"
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Variant
                          </Button>
                        </div>

                        {(!form.sub_sacrament_services || form.sub_sacrament_services.length === 0) ? (
                          <p className="text-sm text-gray-500">At least 2 variants are required.</p>
                        ) : (
                          <div className="space-y-3">
                            {form.sub_sacrament_services.map((variant, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-6">
                                  <Label className="text-xs font-medium text-gray-700">Variant Name</Label>
                                  <Input
                                    type="text"
                                    value={variant.name}
                                    onChange={(e) => {
                                      const list = [...form.sub_sacrament_services];
                                      list[idx].name = e.target.value;
                                      setForm({ ...form, sub_sacrament_services: list });
                                    }}
                                    className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                                    placeholder="e.g., Baptism Public"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <Label className="text-xs font-medium text-gray-700">Fee (₱)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={variant.fee}
                                    onChange={(e) => {
                                      const list = [...form.sub_sacrament_services];
                                      list[idx].fee = e.target.value;
                                      setForm({ ...form, sub_sacrament_services: list });
                                    }}
                                    className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                                    placeholder="0.00"
                                  />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      if ((form.sub_sacrament_services?.length || 0) <= 2) return;
                                      const list = form.sub_sacrament_services.filter((_, i) => i !== idx);
                                      setForm({ ...form, sub_sacrament_services: list });
                                    }}
                                    variant="outline"
                                    disabled={(form.sub_sacrament_services?.length || 0) <= 2}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {form.sub_sacrament_services.length < 2 && (
                              <p className="text-xs text-red-600">Minimum of 2 variants required.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Discount (Optional)
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <select
                          value={form.member_discount_type}
                          onChange={(e) => setForm({ ...form, member_discount_type: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">No discount</option>
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (PHP)</option>
                        </select>
                      </div>
                      {form.member_discount_type && (
                        <div>
                          <Input
                            type="number"
                            value={form.member_discount_value}
                            onChange={(e) => setForm({ ...form, member_discount_value: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                            placeholder={form.member_discount_type === 'percentage' ? 'Enter percentage (e.g., 5 for 5%)' : 'Enter amount (e.g., 1000 for PHP1000)'}
                            min="0"
                            step={form.member_discount_type === 'percentage' ? '0.01' : '0.01'}
                            max={form.member_discount_type === 'percentage' ? '100' : undefined}
                          />
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {form.member_discount_type === 'percentage' 
                        ? 'Enter the percentage discount for members (e.g., 5 for 5% off)' 
                        : form.member_discount_type === 'fixed'
                        ? 'Enter the fixed discount amount in PHP (e.g., 1000 for PHP1000 off)'
                        : 'Set up a discount that will be applied for church members.'}
                    </p>
                  </div>
                </div>
                
                {/* Right Column - Sub-Services */}
                <div className="space-y-6 w-full h-full">
                  <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 w-full h-full flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Sub-Services (Optional)
                        </Label>
                        <p className="mt-1 text-xs text-gray-500">
                          Add optional sub-services like interviews with specific schedules.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          setForm({
                            ...form,
                            sub_services: [
                              ...form.sub_services,
                              {
                                SubServiceName: "",
                                Description: "",
                                IsActive: true,
                                schedules: [],
                                requirements: []
                              }
                            ]
                          });
                        }}
                        variant="outline"
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Sub-Service
                      </Button>
                    </div>

                    {form.sub_services.length === 0 ? (
                      <p className="text-sm text-gray-500 italic py-2">No sub-services added yet.</p>
                    ) : (
                      <div className="space-y-4 flex-1 overflow-y-auto">
                        {form.sub_services.map((subService, subIndex) => (
                          <div key={subIndex} className="p-4 border border-gray-200 rounded-md bg-white">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-sm font-medium text-gray-700">Sub-Service {subIndex + 1}</h4>
                              <Button
                                type="button"
                                onClick={() => {
                                  const newSubServices = form.sub_services.filter((_, i) => i !== subIndex);
                                  setForm({ ...form, sub_services: newSubServices });
                                }}
                                variant="outline"
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs font-medium text-gray-700">Name</Label>
                                <Input
                                  type="text"
                                  value={subService.SubServiceName}
                                  onChange={(e) => {
                                    const newSubServices = [...form.sub_services];
                                    newSubServices[subIndex].SubServiceName = e.target.value;
                                    setForm({ ...form, sub_services: newSubServices });
                                  }}
                                  className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                                  placeholder="e.g., Interview"
                                />
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-gray-700">Description</Label>
                                <textarea
                                  value={subService.Description || ""}
                                  onChange={(e) => {
                                    const newSubServices = [...form.sub_services];
                                    newSubServices[subIndex].Description = e.target.value;
                                    setForm({ ...form, sub_services: newSubServices });
                                  }}
                                  className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                                  placeholder="Description (optional)"
                                  rows={2}
                                />
                              </div>

                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={subService.IsActive}
                                  onChange={(e) => {
                                    const newSubServices = [...form.sub_services];
                                    newSubServices[subIndex].IsActive = e.target.checked;
                                    setForm({ ...form, sub_services: newSubServices });
                                  }}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <Label className="ml-2 text-xs font-medium text-gray-700">Active</Label>
                              </div>

                              {/* Schedules for this sub-service */}
                              <div className="mt-3 pl-3 border-l-2 border-gray-300">
                                <div className="flex justify-between items-center mb-2">
                                  <Label className="text-xs font-medium text-gray-700">Schedules</Label>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const newSubServices = [...form.sub_services];
                                      newSubServices[subIndex].schedules.push({
                                        DayOfWeek: "Thursday",
                                        StartTime: "14:00",
                                        EndTime: "16:00",
                                        OccurrenceType: "weekly",
                                        OccurrenceValue: null
                                      });
                                      setForm({ ...form, sub_services: newSubServices });
                                    }}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border-green-200 min-h-0 h-auto"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Schedule
                                  </Button>
                                </div>

                                {subService.schedules.length === 0 ? (
                                  <p className="text-xs text-gray-500 italic">No schedules added.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {subService.schedules.map((schedule, scheduleIndex) => (
                                      <div key={scheduleIndex} className="p-3 bg-gray-50 border border-gray-200 rounded">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="text-xs font-medium text-gray-600">Schedule {scheduleIndex + 1}</span>
                                          <Button
                                            type="button"
                                            onClick={() => {
                                              const newSubServices = [...form.sub_services];
                                              newSubServices[subIndex].schedules = newSubServices[subIndex].schedules.filter((_, i) => i !== scheduleIndex);
                                              setForm({ ...form, sub_services: newSubServices });
                                            }}
                                            variant="outline"
                                            className="inline-flex items-center px-1 py-0.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>

                                        <div className="space-y-3">
                                          <div>
                                            <Label className="text-xs font-medium text-gray-700">Day of Week *</Label>
                                            <select
                                              value={schedule.DayOfWeek}
                                              onChange={(e) => {
                                                const newSubServices = [...form.sub_services];
                                                newSubServices[subIndex].schedules[scheduleIndex].DayOfWeek = e.target.value;
                                                setForm({ ...form, sub_services: newSubServices });
                                              }}
                                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-xs text-gray-900"
                                            >
                                              <option value="Monday">Monday</option>
                                              <option value="Tuesday">Tuesday</option>
                                              <option value="Wednesday">Wednesday</option>
                                              <option value="Thursday">Thursday</option>
                                              <option value="Friday">Friday</option>
                                              <option value="Saturday">Saturday</option>
                                              <option value="Sunday">Sunday</option>
                                            </select>
                                          </div>

                                          <div>
                                            <Label className="text-xs font-medium text-gray-700">Occurrence Type *</Label>
                                            <select
                                              value={schedule.OccurrenceType}
                                              onChange={(e) => {
                                                const newSubServices = [...form.sub_services];
                                                newSubServices[subIndex].schedules[scheduleIndex].OccurrenceType = e.target.value;
                                                if (e.target.value === "weekly") {
                                                  newSubServices[subIndex].schedules[scheduleIndex].OccurrenceValue = null;
                                                }
                                                setForm({ ...form, sub_services: newSubServices });
                                              }}
                                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-xs text-gray-900"
                                            >
                                              <option value="weekly">Weekly</option>
                                              <option value="nth_day_of_month">Monthly (Nth weekday)</option>
                                            </select>
                                          </div>

                                          {schedule.OccurrenceType === "nth_day_of_month" && (
                                            <div>
                                              <Label className="text-xs font-medium text-gray-700">Week of Month *</Label>
                                              <select
                                                value={schedule.OccurrenceValue || ""}
                                                onChange={(e) => {
                                                  const newSubServices = [...form.sub_services];
                                                  newSubServices[subIndex].schedules[scheduleIndex].OccurrenceValue = parseInt(e.target.value);
                                                  setForm({ ...form, sub_services: newSubServices });
                                                }}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-xs text-gray-900"
                                              >
                                                <option value="">Select...</option>
                                                <option value="1">First</option>
                                                <option value="2">Second</option>
                                                <option value="3">Third</option>
                                                <option value="4">Fourth</option>
                                              </select>
                                            </div>
                                          )}

                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-xs font-medium text-gray-700">Start Time *</Label>
                                              <Input
                                                type="time"
                                                value={schedule.StartTime}
                                                onChange={(e) => {
                                                  const newSubServices = [...form.sub_services];
                                                  newSubServices[subIndex].schedules[scheduleIndex].StartTime = e.target.value;
                                                  setForm({ ...form, sub_services: newSubServices });
                                                }}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-900"
                                              />
                                            </div>

                                            <div>
                                              <Label className="text-xs font-medium text-gray-700">End Time *</Label>
                                              <Input
                                                type="time"
                                                value={schedule.EndTime}
                                                onChange={(e) => {
                                                  const newSubServices = [...form.sub_services];
                                                  newSubServices[subIndex].schedules[scheduleIndex].EndTime = e.target.value;
                                                  setForm({ ...form, sub_services: newSubServices });
                                                }}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-900"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Requirements for this sub-service */}
                              <div className="mt-3 pl-3 border-l-2 border-gray-300">
                                <div className="flex justify-between items-center mb-2">
                                  <Label className="text-xs font-medium text-gray-700">Requirements (Optional)</Label>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const newSubServices = [...form.sub_services];
                                      newSubServices[subIndex].requirements.push({
                                        RequirementName: "",
                                        isNeeded: true
                                      });
                                      setForm({ ...form, sub_services: newSubServices });
                                    }}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200 min-h-0 h-auto"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Requirement
                                  </Button>
                                </div>

                                {subService.requirements.length === 0 ? (
                                  <p className="text-xs text-gray-500 italic">No requirements added.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {subService.requirements.map((requirement, reqIndex) => (
                                      <div key={reqIndex} className="p-3 bg-gray-50 border border-gray-200 rounded">
                                        <div className="space-y-2">
                                          <div className="flex items-start space-x-2">
                                            <Input
                                              type="text"
                                              value={requirement.RequirementName}
                                              onChange={(e) => {
                                                const newSubServices = [...form.sub_services];
                                                newSubServices[subIndex].requirements[reqIndex].RequirementName = e.target.value;
                                                setForm({ ...form, sub_services: newSubServices });
                                              }}
                                              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-900"
                                              placeholder="e.g., Birth Certificate"
                                            />
                                            <Button
                                              type="button"
                                              onClick={() => {
                                                const newSubServices = [...form.sub_services];
                                                newSubServices[subIndex].requirements = newSubServices[subIndex].requirements.filter((_, i) => i !== reqIndex);
                                                setForm({ ...form, sub_services: newSubServices });
                                              }}
                                              variant="outline"
                                              className="inline-flex items-center px-2 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <div className="flex items-center">
                                            <input
                                              type="checkbox"
                                              checked={requirement.isNeeded !== false}
                                              onChange={(e) => {
                                                const newSubServices = [...form.sub_services];
                                                newSubServices[subIndex].requirements[reqIndex].isNeeded = e.target.checked;
                                                setForm({ ...form, sub_services: newSubServices });
                                              }}
                                              className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <Label className="ml-2 text-xs font-medium text-gray-700">Needed</Label>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end items-center space-x-3 mt-6">
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
                  disabled={isSubmitting || !form.ServiceName.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editSacramentId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editSacramentId ? "Update Sacrament" : "Create Sacrament"}</>
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
        onClose={() => {
          setShowDeleteConfirm(false);
          setSacramentToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Sacrament"
        message={`Are you sure you want to delete "${sacramentToDelete?.ServiceName}"? This action cannot be undone and will permanently remove the sacrament and all its associated schedules.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Sacrament"}
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />

    </div>
  );
};

export default SacramentPage;
