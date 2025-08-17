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
      setErrors(error.response.data.errors || ["Validation failed."]);
    } else {
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
    Description: ""
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
      Description: ""
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
    router.push(`/churchstaff/${churchname}/sacrament/configure/${sacramentId}`);
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

  const hasAccess =
    user?.profile?.system_role?.role_name === "ChurchOwner" ||
    user?.church_role?.permissions?.some(
      (perm) => perm.PermissionName === "sacrament_list"
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
                You do not have permission to access the Sacrament page.
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
                      <Button onClick={handleOpen} className="flex items-center">
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
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isInitialLoading ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-8">
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
                                  {sacrament.Description || 'No description'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center items-center space-x-2">
                                  <Button
                                    onClick={() => handleEdit(sacrament.ServiceID)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 min-h-0 h-auto"
                                    disabled={isLoadingEdit}
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
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                  <Button
                                    onClick={() => handleConfigure(sacrament.ServiceID)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto"
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
                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
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
            className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6 relative max-h-[90vh] overflow-y-auto"
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="block mt-1 w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
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
                  className="block mt-1 w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="Enter service description (optional)"
                  rows={3}
                />
                <InputError
                  messages={errors.Description}
                  className="mt-2 text-xs text-red-600"
                />
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
