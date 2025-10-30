"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Settings,
  Trash2,
  Edit,
  Search,
  Filter,
  Grid,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/Button.jsx";
import { useAuth } from "@/hooks/auth.jsx";
import ScheduleModal from "@/components/schedules/ScheduleModal.jsx";
import ScheduleCalendarView from "@/components/schedules/ScheduleCalendarView.jsx";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import DataLoading from "@/components/DataLoading.jsx";
import SearchAndPagination from "@/components/SearchAndPagination";
import axios from "@/lib/axios";

const SchedulePage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [viewMode, setViewMode] = useState("calendar"); // "table" or "calendar"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Permission helper function
  const hasPermission = (permissionName) => {
    return user?.profile?.system_role?.role_name === "ChurchOwner" ||
      user?.church_role?.permissions?.some(
        (perm) => perm.PermissionName === permissionName
      );
  };

  const hasAccess = hasPermission("schedule_list");
  const canAddSchedule = hasPermission("schedule_add");
  const canEditSchedule = hasPermission("schedule_edit");
  const canDeleteSchedule = hasPermission("schedule_delete");

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [churchname, hasAccess]);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alertMessage) return;
    const timeout = setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 5000);
    return () => clearTimeout(timeout);
  }, [alertMessage]);

  // Filter schedules when service selection or search term changes
  useEffect(() => {
    let filtered = schedules;
    
    if (selectedService) {
      filtered = filtered.filter(schedule => schedule.ServiceID.toString() === selectedService);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(schedule => 
        schedule.service?.ServiceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.ScheduleID.toString().includes(searchTerm)
      );
    }
    
    setFilteredSchedules(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [schedules, selectedService, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchedules = filteredSchedules.slice(startIndex, endIndex);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load all services first
      const servicesResponse = await axios.get(`/api/sacrament-services/${churchname}`);
      if (servicesResponse.data?.sacraments) {
        setServices(servicesResponse.data.sacraments);
      }
      
      // Load all schedules for the church
      const schedulesPromises = servicesResponse.data.sacraments?.map(service => 
        axios.get(`/api/sacrament-services/${service.ServiceID}/schedules`).catch(() => ({ data: { schedules: [] } }))
      ) || [];
      
      const schedulesResponses = await Promise.all(schedulesPromises);
      const allSchedules = schedulesResponses.flatMap((response, index) => {
        const serviceSchedules = response.data?.schedules || [];
        return serviceSchedules.map(schedule => ({
          ...schedule,
          service: servicesResponse.data.sacraments[index]
        }));
      });
      
      setSchedules(allSchedules);
      setFilteredSchedules(allSchedules);
      
    } catch (error) {
      console.error("Failed to load data:", error);
      setAlertMessage("Failed to load schedules. Please try again.");
      setAlertType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return;

    try {
      const response = await axios.delete(`/api/schedules/${scheduleToDelete.ScheduleID}`);
      if (response.data.success) {
        setAlertMessage("Schedule deleted successfully!");
        setAlertType("success");
        loadData(); // Reload data
      }
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      setAlertMessage("Failed to delete schedule. Please try again.");
      setAlertType("error");
    } finally {
      setShowDeleteConfirm(false);
      setScheduleToDelete(null);
    }
  };

  const formatRecurrence = (recurrences) => {
    if (!recurrences || recurrences.length === 0) return "No recurrence";
    
    const recurrence = recurrences[0]; // Assuming one recurrence per schedule
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeks = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
    
    switch (recurrence.RecurrenceType) {
      case 'Weekly':
        return `Every ${days[recurrence.DayOfWeek]}`;
      case 'MonthlyNth':
        return `${weeks[recurrence.WeekOfMonth - 1]} ${days[recurrence.DayOfWeek]} of every month`;
      case 'OneTime':
        return `One time on ${new Date(recurrence.SpecificDate).toLocaleDateString()}`;
      default:
        return 'Unknown recurrence';
    }
  };

  const formatTimes = (times) => {
    if (!times || times.length === 0) return "No times";
    return times.map(time => {
      const start = new Date(`2000-01-01T${time.StartTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const end = new Date(`2000-01-01T${time.EndTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${start} - ${end}`;
    }).join(", ");
  };


  if (!hasAccess) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="w-full h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">Unauthorized</h2>
              <p className="mt-2 text-gray-600">
                You do not have permission to access the Schedule Management page.
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
              Schedule Management
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
                    ×
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
                        <h3 className="text-lg font-medium text-gray-900">Schedule Management</h3>
                        <p className="mt-1 text-sm text-gray-600">Manage schedules for church sacrament services.</p>
                      </div>
                        <div className="flex items-center gap-3">
                          {/* Service Filter */}
                          <div className="flex items-center">
                            <Filter className="h-4 w-4 mr-2 text-gray-400" />
                            <select
                              value={selectedService}
                              onChange={(e) => setSelectedService(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All Services</option>
                              {services.map((service) => (
                                <option key={service.ServiceID} value={service.ServiceID.toString()}>
                                  {service.ServiceName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* View Toggle */}
                          <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => setViewMode("table")}
                              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                viewMode === "table" 
                                  ? "bg-white text-blue-600 shadow-sm" 
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              <Grid className="h-4 w-4 mr-2" />
                              Table
                            </button>
                            <button
                              onClick={() => setViewMode("calendar")}
                              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                viewMode === "calendar" 
                                  ? "bg-white text-blue-600 shadow-sm" 
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              <CalendarDays className="h-4 w-4 mr-2" />
                              Calendar
                            </button>
                          </div>
                          
                          <Button 
                            onClick={() => setShowCreateModal(true)} 
                            className="flex items-center" 
                            disabled={isLoading || services.length === 0 || !canAddSchedule}
                            title={!canAddSchedule ? 'You do not have permission to add schedules' : ''}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Schedule
                          </Button>
                        </div>
                    </div>
                  </div>
                    
                    {/* Dynamic Content Area */}
                    {viewMode === "calendar" ? (
                      <div className="p-6">
                        {isLoading ? (
                          <div className="py-12">
                            <DataLoading message="Loading schedules..." />
                          </div>
                        ) : (
                          <ScheduleCalendarView
                            schedules={schedules}
                            filteredSchedules={filteredSchedules}
                            onEditSchedule={setEditingSchedule}
                            onDeleteSchedule={handleDeleteClick}
                            onCreateSchedule={() => setShowCreateModal(true)}
                            selectedService={selectedService}
                            searchTerm={searchTerm}
                            canEditSchedule={canEditSchedule}
                            canDeleteSchedule={canDeleteSchedule}
                            canAddSchedule={canAddSchedule}
                          />
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="px-6 py-4">
                          <SearchAndPagination
                            searchQuery={searchTerm}
                            onSearchChange={handleSearch}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            totalItems={filteredSchedules.length}
                            itemsPerPage={itemsPerPage}
                            placeholder="Search schedules..."
                          />
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurrence</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slots</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {isLoading ? (
                                <tr>
                                  <td colSpan={6} className="px-6 py-12">
                                    <div className="flex justify-center">
                                      <DataLoading message="Loading schedules..." />
                                    </div>
                                  </td>
                                </tr>
                              ) : filteredSchedules.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="text-center">
                                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {searchTerm || selectedService ? 'No Schedules Found' : 'No Schedules Yet'}
                                      </h3>
                                      <p className="text-gray-600 mb-6">
                                        {searchTerm || selectedService 
                                          ? 'No schedules match your current filters.' 
                                          : 'Get started by creating your first schedule for a service.'}
                                      </p>
                                      {!searchTerm && !selectedService && (
                                        <Button
                                          onClick={() => setShowCreateModal(true)}
                                          className="flex items-center mx-auto"
                                          disabled={!canAddSchedule}
                                          title={!canAddSchedule ? 'You do not have permission to add schedules' : ''}
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Create Schedule
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                currentSchedules.map((schedule) => (
                                  <tr key={schedule.ScheduleID} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {schedule.sub_sacrament_service 
                                          ? `${schedule.service?.ServiceName} (${schedule.sub_sacrament_service.SubServiceName})`
                                          : schedule.service?.ServiceName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        Schedule #{schedule.ScheduleID}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Settings className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{formatRecurrence(schedule.recurrences)}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{formatTimes(schedule.times)}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{schedule.SlotCapacity}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        new Date(schedule.StartDate) <= new Date() && 
                                        (!schedule.EndDate || new Date(schedule.EndDate) >= new Date())
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {new Date(schedule.StartDate) <= new Date() && 
                                         (!schedule.EndDate || new Date(schedule.EndDate) >= new Date())
                                          ? 'Active'
                                          : 'Inactive'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex justify-center items-center space-x-2">
                                        <Button
                                          onClick={() => setEditingSchedule(schedule)}
                                          variant="outline"
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={!canEditSchedule}
                                          title={!canEditSchedule ? 'You do not have permission to edit schedules' : ''}
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          onClick={() => handleDeleteClick(schedule)}
                                          variant="outline"
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={!canDeleteSchedule}
                                          title={!canDeleteSchedule ? 'You do not have permission to delete schedules' : ''}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          Delete
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Schedule Modal */}
      {(showCreateModal || editingSchedule) && (
        <ScheduleModal
          isOpen={showCreateModal || !!editingSchedule}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
          schedule={editingSchedule}
          services={services}
          onSuccess={() => {
            loadData();
            setShowCreateModal(false);
            setEditingSchedule(null);
            setAlertMessage(editingSchedule ? "Schedule updated successfully!" : "Schedule created successfully!");
            setAlertType("success");
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setScheduleToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Schedule"
        message={`Are you sure you want to delete this schedule for ${scheduleToDelete?.service?.ServiceName}? This action cannot be undone and will permanently remove all associated time slots, recurrences, and fees.`}
        confirmText="Delete Schedule"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default SchedulePage;
