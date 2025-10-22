"use client";

import React, { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { Calendar, Clock, MapPin, Users, Eye, Check, X, AlertTriangle, Search, FileText, User, Mail, Phone, MapPin as Location, Download, FileText as CertificateIcon } from "lucide-react";
import { useAuth } from "@/hooks/auth.jsx";
import DataLoading from "@/components/DataLoading";
import SearchAndPagination from "@/components/SearchAndPagination";
import { Button } from "@/components/Button.jsx";
import FormRenderer from "@/components/FormRenderer.jsx";
import CertificateGenerator from "@/components/CertificateGenerator.jsx";
import CertificateTypeModal from "@/components/CertificateTypeModal.jsx";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import { exportToPDF, isServiceDownloadable } from "@/utils/pdfExport";

const AppointmentPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Form data state for staff input
  const [staffFormData, setStaffFormData] = useState({});
  
  // Confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Certificate generation state
  const [showCertificateTypeModal, setShowCertificateTypeModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificateType, setSelectedCertificateType] = useState('marriage');
  

  // Check if user is ChurchOwner or has appointment_list permission
  const hasAccess =
    user?.profile?.system_role?.role_name === "ChurchOwner" ||
    user?.church_role?.permissions?.some(
      (perm) => perm.PermissionName === "appointment_list"
    );

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clean up church name for API call
      const sanitizedChurchName = churchname.replace(/:\d+$/, "");
      
      // Fetch appointments for this church using church name
      const response = await axios.get(`/api/church-appointments/${sanitizedChurchName}`);
      setAppointments(response.data.appointments);
      setFilteredAppointments(response.data.appointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load appointments';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess && churchname) {
      fetchAppointments();
    }
  }, [hasAccess, churchname]);

  // Get unique services for filter dropdown
  const uniqueServices = [...new Set(appointments.map(apt => apt.ServiceName))].filter(Boolean).sort();

  // Filter appointments based on search term, status, and service
  useEffect(() => {
    let filtered = [...appointments];
    
    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(appointment => appointment.Status === statusFilter);
    }
    
    // Apply service filter
    if (serviceFilter !== "All") {
      filtered = filtered.filter(appointment => appointment.ServiceName === serviceFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(appointment => (
        appointment.ServiceName?.toLowerCase().includes(searchLower) ||
        appointment.UserName?.toLowerCase().includes(searchLower) ||
        appointment.UserEmail?.toLowerCase().includes(searchLower)
      ));
    }
    
    // Sort by AppointmentDate ascending (oldest first)
    filtered.sort((a, b) => new Date(a.AppointmentDate) - new Date(b.AppointmentDate));
    
    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, serviceFilter, appointments]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status, createdAt) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    // Check if appointment is older than 72 hours for pending status
    const isExpired = status === 'Pending' && createdAt && 
      new Date() - new Date(createdAt) > 72 * 60 * 60 * 1000;
    
    switch (status) {
      case 'Pending':
        return (
          <span className={`${baseClasses} ${isExpired ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            {isExpired ? 'Pending (72h+)' : 'Pending'}
          </span>
        );
      case 'Approved':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <Check className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <X className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      case 'Cancelled':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <X className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      case 'Completed':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <Check className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  // Helper function to check if appointment is expired (72+ hours old)
  const isAppointmentExpired = (createdAt, status) => {
    return status === 'Pending' && createdAt && 
      new Date() - new Date(createdAt) > 72 * 60 * 60 * 1000;
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Review modal functions
  const handleViewAppointment = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowReviewModal(true);
    setIsLoadingDetails(true);
    
    // Reset form data for new appointment
    setStaffFormData({});
    
    try {
      // Fetch detailed appointment information
      const response = await axios.get(`/api/appointments/${appointment.AppointmentID}`);
      console.log('Appointment details response:', response.data);
      console.log('Service data:', response.data?.service);
      console.log('isDownloadableContent:', response.data?.service?.isDownloadableContent);
      
      // Debug: Check all possible paths for isDownloadableContent
      console.log('Modal opened - checking isDownloadableContent paths:');
      console.log('service.isDownloadableContent:', response.data?.service?.isDownloadableContent);
      console.log('appointment.isDownloadableContent:', response.data?.isDownloadableContent);
      console.log('sacramentService.isDownloadableContent:', response.data?.sacramentService?.isDownloadableContent);
      
      setAppointmentDetails(response.data);
      
      // Initialize form data with saved answers from backend
      if (response.data?.formConfiguration?.form_elements) {
        const initialFormData = {};
        response.data.formConfiguration.form_elements.forEach(element => {
          if (element.answer && element.answer.trim() !== '') {
            initialFormData[element.id] = element.answer;
          }
        });
        console.log('Initializing form data with saved answers:', initialFormData);
        setStaffFormData(initialFormData);
      }
    } catch (err) {
      console.error('Error fetching appointment details:', err);
      setError('Failed to load appointment details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedAppointment(null);
    setAppointmentDetails(null);
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    setIsUpdatingStatus(true);
    
    try {
      await axios.put(`/api/appointments/${appointmentId}/status`, {
        status: status
      });
      
      // Update local state
      const updatedAppointments = appointments.map(apt => 
        apt.AppointmentID === appointmentId 
          ? { ...apt, Status: status }
          : apt
      );
      setAppointments(updatedAppointments);
      setFilteredAppointments(updatedAppointments);
      
      // Update selected appointment in modal
      if (selectedAppointment?.AppointmentID === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, Status: status });
      }
      
      // Close modal after successful update
      setTimeout(() => {
        handleCloseReviewModal();
      }, 1000);
      
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle confirm dialog actions
  const handleConfirmAction = () => {
    if (confirmAction) {
      const { appointmentId, status } = confirmAction;
      handleUpdateAppointmentStatus(appointmentId, status);
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // Show confirm dialog for status updates
  const showStatusConfirmDialog = (appointmentId, status) => {
    setConfirmAction({ appointmentId, status });
    setShowConfirmDialog(true);
  };

  // Certificate generation functions
  const handleGenerateCertificate = () => {
      setShowCertificateTypeModal(true);
  };

  const handleCertificateTypeSelection = (type) => {
    setSelectedCertificateType(type);
      setShowCertificateTypeModal(false);
      setShowCertificateModal(true);
  };


  const handleSaveFormData = async () => {
    console.log('Save button clicked');
    console.log('Selected appointment:', selectedAppointment?.AppointmentID);
    console.log('Staff form data:', staffFormData);
    
    if (!selectedAppointment?.AppointmentID) {
      alert('No appointment selected');
      return;
    }
    
    if (!staffFormData || Object.keys(staffFormData).length === 0) {
      alert('Please fill out the form before saving');
      return;
    }

    setIsUpdatingStatus(true);
    
    try {
      console.log('Attempting to save form data...');
      const response = await axios.post(`/api/appointments/${selectedAppointment.AppointmentID}/staff-form-data`, {
        formData: staffFormData
      });
      
      console.log('Save response:', response);
      alert('Form data saved successfully!');
      
    } catch (err) {
      console.error('Error saving form data:', err);
      console.error('Error details:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save form data';
      alert(`Error saving form data: ${errorMessage}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExportPDF = () => {
    if (!selectedAppointment || !appointmentDetails) {
      alert('No appointment data available for export');
      return;
    }
    
    try {
      exportToPDF(appointmentDetails, staffFormData, selectedAppointment);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

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
                You do not have permission to access the Appointment page.
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
              Church Appointments
            </h1>
            
            <div className="mt-6">
              <div className="overflow-x-auto">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Appointment Applications</h3>
                        <p className="mt-1 text-sm text-gray-600">Manage and review sacrament appointment applications from members.</p>
                        <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Pending applications older than 72 hours are highlighted in red and can be cancelled to free up slots.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center space-x-2">
                          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                            Filter by Status:
                          </label>
                          <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 bg-white cursor-pointer"
                          >
                            <option value="All">All</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label htmlFor="service-filter" className="text-sm font-medium text-gray-700">
                            Filter by Service:
                          </label>
                          <select
                            id="service-filter"
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 bg-white cursor-pointer"
                          >
                            <option value="All">All</option>
                            {uniqueServices.map(serviceName => (
                              <option key={serviceName} value={serviceName}>{serviceName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Showing {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
                        {statusFilter !== "All" && ` with status: ${statusFilter}`}
                        {serviceFilter !== "All" && ` for service: ${serviceFilter}`}
                      </div>
                    </div>
                    
                    {/* Search and Pagination */}
                    <SearchAndPagination
                      searchQuery={searchTerm}
                      onSearchChange={handleSearch}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      totalItems={filteredAppointments.length}
                      itemsPerPage={itemsPerPage}
                      placeholder="Search appointments..."
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8">
                              <DataLoading message="Loading appointments..." />
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-red-600">
                              {error}
                            </td>
                          </tr>
                        ) : currentAppointments.length > 0 ? (
                          currentAppointments.map((appointment) => {
                            const isExpired = isAppointmentExpired(appointment.created_at, appointment.Status);
                            return (
                            <tr key={appointment.AppointmentID} className={`hover:bg-gray-50 ${isExpired ? 'bg-red-50 border-l-4 border-l-red-400' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {appointment.UserName || 'Unknown User'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {appointment.UserEmail || 'No email'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.ServiceName}
                                </div>
                                {appointment.ServiceDescription && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {appointment.ServiceDescription}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                  <div>
                                    <div className="font-medium">
                                      {new Date(appointment.AppointmentDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    {appointment.StartTime && appointment.EndTime && (
                                      <div className="text-gray-500 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {formatTime(appointment.StartTime)} - {formatTime(appointment.EndTime)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(appointment.Status, appointment.created_at)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center items-center space-x-2">
                                  <Button
                                    onClick={() => handleViewAppointment(appointment)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Review
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                                <p>No appointments found.</p>
                              </div>
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-xl mx-auto relative"
            style={{
              width: '90vw',
              maxWidth: '90vw',
              maxHeight: '95vh',
              minHeight: '80vh'
            }}
            role="dialog"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="relative bg-gray-100 px-4 py-4 rounded-t-lg">
              <Button
                onClick={handleCloseReviewModal}
                variant="outline"
                className="absolute top-4 right-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300"
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
              <div className="flex items-center space-x-3 pr-16">
                <div>
                  <h2 id="modal-title" className="text-xl font-bold text-gray-800">
                    Review Appointment
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {selectedAppointment?.ServiceName} - {selectedAppointment?.UserName}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-4 py-4 overflow-y-auto" style={{
              maxHeight: 'calc(95vh - 140px)'
            }}>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                {isLoadingDetails ? (
                  <>
                    {/* Loading skeleton for Appointment Information */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="h-1 w-8 bg-gray-300 rounded-full animate-pulse"></div>
                          <div className="h-5 w-48 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                        <div className="h-6 w-20 bg-gray-300 rounded-full animate-pulse"></div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="mb-4">
                          <div className="space-y-2">
                            <div className="h-6 w-64 bg-gray-300 rounded animate-pulse"></div>
                            <div className="h-4 w-48 bg-gray-300 rounded animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
                              <div className="h-4 w-40 bg-gray-300 rounded animate-pulse"></div>
                              <div className="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                              <div className="h-4 w-36 bg-gray-300 rounded animate-pulse"></div>
                              <div className="h-3 w-32 bg-gray-300 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Loading skeleton for form section */}
                    <div className="space-y-4 mt-8">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="h-1 w-8 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="h-5 w-56 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="h-32 w-full bg-gray-300 rounded animate-pulse"></div>
                        <div className="h-32 w-full bg-gray-300 rounded animate-pulse"></div>
                        <div className="h-32 w-full bg-gray-300 rounded animate-pulse"></div>
                      </div>
                    </div>

                    {/* Loading message */}
                    <div className="flex items-center justify-center py-8">
                      <DataLoading message="Loading appointment details..." />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Appointment Information Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-900">Appointment Information</h3>
                        </div>
                        <div>
                          {getStatusBadge(selectedAppointment?.Status, selectedAppointment?.created_at)}
                        </div>
                      </div>
                    
                    <div className="space-y-4">
                      <div className="mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedAppointment?.ServiceName}</h4>
                          {selectedAppointment?.ServiceDescription && (
                            <p className="text-gray-600">{selectedAppointment.ServiceDescription}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Appointment Date</p>
                            <p className="text-gray-900">
                              {new Date(selectedAppointment?.AppointmentDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            {selectedAppointment?.StartTime && selectedAppointment?.EndTime && (
                              <p className="text-sm text-gray-600 mt-1">
                                {formatTime(selectedAppointment.StartTime)} - {formatTime(selectedAppointment.EndTime)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Applicant</p>
                            <p className="text-gray-900">{selectedAppointment?.UserName || 'Unknown User'}</p>
                            <p className="text-sm text-gray-600">{selectedAppointment?.UserEmail || 'No email provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special Notes Section */}
                  {selectedAppointment?.Notes && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="h-1 w-8 bg-amber-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900">Special Notes</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-gray-900 leading-relaxed">{selectedAppointment.Notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Sacrament Application Form Section */}
                  {appointmentDetails?.formConfiguration && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="h-1 w-8 bg-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900">Sacrament Application Form</h3>
                        <p className="text-sm text-gray-600 ml-2">Fill out the form for this applicant</p>
                      </div>
                      
                      <div style={{
                        minHeight: '600px',
                        width: '100%',
                        overflow: 'visible',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{
                          width: '100%',
                          maxWidth: '800px',
                          margin: '0 auto'
                        }}>
                          <FormRenderer
                            formConfiguration={appointmentDetails.formConfiguration}
                            formData={staffFormData}
                            updateField={(fieldName, value) => {
                              console.log('Staff updating field:', fieldName, 'to:', value);
                              setStaffFormData(prev => ({
                                ...prev,
                                [fieldName]: value
                              }));
                            }}
                            readOnly={false}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            {!isLoadingDetails && (
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="flex space-x-3">
                  {appointmentDetails?.formConfiguration && (
                    <Button
                      onClick={() => handleSaveFormData()}
                      variant="outline"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200"
                      disabled={isUpdatingStatus}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Save Form Data
                    </Button>
                  )}
                  {(appointmentDetails?.service?.isDownloadableContent || appointmentDetails?.isDownloadableContent || appointmentDetails?.sacramentService?.isDownloadableContent) && (
                    <Button
                      onClick={handleExportPDF}
                      variant="outline"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200"
                      disabled={isUpdatingStatus}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  {selectedAppointment?.Status === 'Pending' && (
                    <>
                      <Button
                        onClick={() => showStatusConfirmDialog(selectedAppointment.AppointmentID, 'Cancelled')}
                        variant="outline"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200"
                        disabled={isUpdatingStatus}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {isUpdatingStatus ? 'Updating...' : 'Cancel Appointment'}
                      </Button>
                      <Button
                        onClick={() => showStatusConfirmDialog(selectedAppointment.AppointmentID, 'Approved')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                        disabled={isUpdatingStatus}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {isUpdatingStatus ? 'Updating...' : 'Approve Appointment'}
                      </Button>
                    </>
                  )}
                  
                  {selectedAppointment?.Status === 'Approved' && (
                    <>
                      <Button
                        onClick={() => showStatusConfirmDialog(selectedAppointment.AppointmentID, 'Cancelled')}
                        variant="outline"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200"
                        disabled={isUpdatingStatus}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {isUpdatingStatus ? 'Updating...' : 'Cancel Appointment'}
                      </Button>
                      <Button
                        onClick={() => showStatusConfirmDialog(selectedAppointment.AppointmentID, 'Completed')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        disabled={isUpdatingStatus}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {isUpdatingStatus ? 'Updating...' : 'Mark as Completed'}
                      </Button>
                    </>
                  )}
                  
                  {selectedAppointment?.Status === 'Completed' && (
                    <Button
                      onClick={handleGenerateCertificate}
                      className="flex items-center bg-green-600 hover:bg-green-700"
                      disabled={isUpdatingStatus}
                    >
                      <CertificateIcon className="h-4 w-4 mr-2" />
                      Generate Certificate
                    </Button>
                  )}
                  
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        title="Confirm Status Update"
        message={
          confirmAction?.status === 'Completed' 
            ? 'Are you sure you want to mark this appointment as completed?'
            : confirmAction?.status === 'Cancelled'
            ? 'Are you sure you want to cancel this appointment?'
            : confirmAction?.status === 'Approved'
            ? 'Are you sure you want to approve this appointment?'
            : `Are you sure you want to update this appointment status to ${confirmAction?.status}?`
        }
        confirmText="Yes, Update Status"
        cancelText="Cancel"
        type={confirmAction?.status === 'Cancelled' ? 'warning' : confirmAction?.status === 'Completed' ? 'info' : 'info'}
        isLoading={isUpdatingStatus}
      />

      {/* Certificate Type Selection Modal */}
      <CertificateTypeModal
        isOpen={showCertificateTypeModal}
        onClose={() => setShowCertificateTypeModal(false)}
        onSelectType={handleCertificateTypeSelection}
      />

      {/* Certificate Generator Modal */}
      <CertificateGenerator
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        selectedAppointment={selectedAppointment}
        certificateType={selectedCertificateType}
        staffFormData={staffFormData}
      />

    </div>
  );
};

export default AppointmentPage;
