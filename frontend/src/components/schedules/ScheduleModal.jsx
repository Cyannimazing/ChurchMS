"use client";
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Calendar, Clock, Users, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import CustomDatePicker from "@/components/schedules/CustomDatePicker.jsx";
import axios from "@/lib/axios";

const ScheduleModal = ({ isOpen, onClose, schedule, services, onSuccess }) => {
  // Flatten services - expand variants for isMultipleService
  const flattenedServices = services.flatMap(service => {
    if (service.isMultipleService && service.sub_sacrament_services && service.sub_sacrament_services.length > 0) {
      return service.sub_sacrament_services.map(variant => ({
        ServiceID: `variant_${variant.SubSacramentServiceID}`,
        ServiceName: `${service.ServiceName} (${variant.SubServiceName})`,
        SubSacramentServiceID: variant.SubSacramentServiceID,
        ParentServiceID: service.ServiceID,
        fee: variant.fee,
        isVariant: true
      }));
    } else if (!service.isMultipleService) {
      return [{
        ServiceID: service.ServiceID,
        ServiceName: service.ServiceName,
        fee: service.fee,
        isVariant: false
      }];
    }
    return []; // Skip parent services with no variants
  });

  const [formData, setFormData] = useState({
    serviceId: "",
    slotCapacity: "",
    recurrences: [{
      recurrenceType: "",
      dayOfWeek: 0,
      weekOfMonth: 1,
      specificDate: ""
    }],
    times: [{
      startTime: "",
      endTime: ""
    }]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [occupiedTimes, setOccupiedTimes] = useState([]);

  const recurrenceTypes = [
    { value: "OneTime", label: "One Time Event" },
    { value: "Weekly", label: "Weekly" },
    { value: "MonthlyNth", label: "Monthly (Nth weekday)" }
  ];

  const daysOfWeek = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  const weeksOfMonth = [
    { value: 1, label: "First" },
    { value: 2, label: "Second" },
    { value: 3, label: "Third" },
    { value: 4, label: "Fourth" },
    { value: 5, label: "Fifth" }
  ];

  // Generate 30-minute time slots from 00:00 to 23:30
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        slots.push({ value: timeString, label: displayTime });
      }
    }
    return slots;
  };

  const allTimeSlots = generateTimeSlots();
  
  // Filter out occupied time slots
  const isTimeOccupied = (time) => {
    if (!occupiedTimes || occupiedTimes.length === 0) return false;
    
    return occupiedTimes.some(occupied => {
      const occupiedStart = occupied.start;
      const occupiedEnd = occupied.end;
      // Check if time falls within the occupied range (including start, excluding end)
      // For example: if occupied is 08:00-09:00, exclude 08:00 and 08:30
      return time >= occupiedStart && time < occupiedEnd;
    });
  };
  
  const timeSlots = allTimeSlots.filter(slot => !isTimeOccupied(slot.value));
  
  // Only enable time picking once service and schedule type are selected
  const canPickStartTime = Boolean(formData.serviceId && formData.recurrences[0]?.recurrenceType);
  
  console.log('Occupied times:', occupiedTimes);
  console.log('Available time slots:', timeSlots.length, 'of', allTimeSlots.length);


  // Fetch occupied times when service or recurrence changes
  useEffect(() => {
    const fetchOccupiedTimes = async () => {
      // Only fetch when BOTH service AND recurrence type are selected
      if (!formData.serviceId || !formData.recurrences[0] || !formData.recurrences[0].recurrenceType) {
        console.log('Skipping fetch - waiting for both service and recurrence type');
        setOccupiedTimes([]);
        return;
      }
      
      const recurrence = formData.recurrences[0];
      
      // For OneTime, also need a date; for Weekly need day; for MonthlyNth need day + week
      if (recurrence.recurrenceType === 'OneTime' && !recurrence.specificDate) {
        console.log('Skipping fetch - OneTime needs a date');
        setOccupiedTimes([]);
        return;
      }
      
      // Extract actual service ID (handle variants)
      const selectedServiceData = flattenedServices.find(s => s.ServiceID.toString() === formData.serviceId);
      const actualServiceId = selectedServiceData?.isVariant 
        ? selectedServiceData.ParentServiceID 
        : formData.serviceId;
      
      const params = {
        recurrence_type: recurrence.recurrenceType,
        day_of_week: recurrence.dayOfWeek,
        week_of_month: recurrence.weekOfMonth,
        date: recurrence.specificDate || new Date().toISOString().split('T')[0]
      };
      
      console.log('Fetching occupied times with params:', { actualServiceId, params });
      
      try {
        const response = await axios.get(`/api/sacrament-services/${actualServiceId}/available-times`, { params });
        console.log('Occupied times response:', response.data);
        if (response.data.success) {
          console.log('Setting occupied times:', response.data.occupied_times);
          setOccupiedTimes(response.data.occupied_times || []);
        }
      } catch (error) {
        console.error('Failed to fetch occupied times:', error.response?.data || error.message);
        setOccupiedTimes([]);
      }
    };
    
    fetchOccupiedTimes();
  }, [formData.serviceId, formData.recurrences]);

  useEffect(() => {
    if (schedule) {
      // Populate form with existing schedule data
      setFormData({
        serviceId: schedule.ServiceID || "",
        slotCapacity: schedule.SlotCapacity || "",
        recurrences: schedule.recurrences && schedule.recurrences.length > 0 
          ? schedule.recurrences.map(r => ({
              recurrenceId: r.RecurrenceID,
              recurrenceType: r.RecurrenceType,
              dayOfWeek: r.DayOfWeek || 0,
              weekOfMonth: r.WeekOfMonth || 1,
              specificDate: r.SpecificDate ? r.SpecificDate.split('T')[0] : ""
            }))
          : [{
              recurrenceType: "",
              dayOfWeek: 0,
              weekOfMonth: 1,
              specificDate: ""
            }],
        times: schedule.times && schedule.times.length > 0
          ? schedule.times.map(t => ({
              timeId: t.ScheduleTimeID,
              startTime: t.StartTime ? t.StartTime.slice(0, 5) : "",
              endTime: t.EndTime ? t.EndTime.slice(0, 5) : ""
            }))
          : [{
              startTime: "",
              endTime: ""
            }]
      });
    } else {
      // Reset form for new schedule
      setFormData({
        serviceId: "",
        slotCapacity: "",
        recurrences: [{
          recurrenceType: "",
          dayOfWeek: 0,
          weekOfMonth: 1,
          specificDate: ""
        }],
        times: [{
          startTime: "",
          endTime: ""
        }]
      });
    }
    setErrors({});
  }, [schedule]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.serviceId) {
      newErrors.serviceId = "Service is required";
    }

    if (!formData.slotCapacity || formData.slotCapacity < 1) {
      newErrors.slotCapacity = "Slot capacity must be at least 1";
    }

    // Validate recurrences
    formData.recurrences.forEach((recurrence, index) => {
      if (recurrence.recurrenceType === "OneTime" && !recurrence.specificDate) {
        newErrors[`recurrence_${index}_date`] = "Specific date is required for one-time events";
      }
    });

    // Validate times
    formData.times.forEach((time, index) => {
      if (!time.startTime) {
        newErrors[`time_${index}_start`] = "Start time is required";
      }
      if (!time.endTime) {
        newErrors[`time_${index}_end`] = "End time is required";
      }
      if (time.startTime && time.endTime && time.startTime >= time.endTime) {
        newErrors[`time_${index}_end`] = "End time must be after start time";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Auto-set start date to today
      const today = new Date().toISOString().split('T')[0];
      
      // Get actual service ID (handle variants)
      const selectedServiceData = flattenedServices.find(s => s.ServiceID.toString() === formData.serviceId);
      const actualServiceId = selectedServiceData?.isVariant 
        ? selectedServiceData.SubSacramentServiceID 
        : formData.serviceId;
      
      const payload = {
        start_date: today,
        end_date: null, // Always null as per requirement
        slot_capacity: parseInt(formData.slotCapacity),
        service_id: actualServiceId,
        is_variant: selectedServiceData?.isVariant || false,
        recurrences: formData.recurrences.map(r => ({
          recurrence_id: r.recurrenceId || undefined,
          recurrence_type: r.recurrenceType,
          day_of_week: r.recurrenceType !== "OneTime" ? r.dayOfWeek : null,
          week_of_month: r.recurrenceType === "MonthlyNth" ? r.weekOfMonth : null,
          specific_date: r.recurrenceType === "OneTime" ? r.specificDate : null
        })),
        times: formData.times.map(t => ({
          time_id: t.timeId || undefined,
          start_time: t.startTime,
          end_time: t.endTime
        }))
      };

      let response;
      if (schedule) {
        // Update existing schedule
        response = await axios.put(`/api/schedules/${schedule.ScheduleID}`, payload);
      } else {
        // Create new schedule
        const endpointServiceId = selectedServiceData?.isVariant 
          ? selectedServiceData.ParentServiceID 
          : selectedServiceData?.ServiceID;
        response = await axios.post(`/api/sacrament-services/${endpointServiceId}/schedules`, payload);
      }

      if (response.data.success) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to save schedule:", error);
      setErrors({ submit: "Failed to save schedule. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const addRecurrence = () => {
    setFormData({
      ...formData,
      recurrences: [...formData.recurrences, {
        recurrenceType: "",
        dayOfWeek: 0,
        weekOfMonth: 1,
        specificDate: ""
      }]
    });
  };

  const removeRecurrence = (index) => {
    setFormData({
      ...formData,
      recurrences: formData.recurrences.filter((_, i) => i !== index)
    });
  };

  const updateRecurrence = (index, field, value) => {
    const newRecurrences = [...formData.recurrences];
    newRecurrences[index] = { ...newRecurrences[index], [field]: value };
    setFormData({ ...formData, recurrences: newRecurrences });
  };

  const addTime = () => {
    setFormData({
      ...formData,
      times: [...formData.times, { startTime: "", endTime: "" }]
    });
  };

  // Filter end-time options based on selected start time (must be after start)
  const endTimeOptions = (start) => {
    if (!start) return timeSlots; // nothing selected yet
    return timeSlots.filter(slot => slot.value > start);
  };

  const removeTime = (index) => {
    setFormData({
      ...formData,
      times: formData.times.filter((_, i) => i !== index)
    });
  };

  const updateTime = (index, field, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = { ...newTimes[index], [field]: value };
    setFormData({ ...formData, times: newTimes });
  };

  const addFee = () => {
    setFormData({
      ...formData,
      fees: [...formData.fees, { feeType: "Fee", fee: "0.00" }]
    });
  };

  const removeFee = (index) => {
    setFormData({
      ...formData,
      fees: formData.fees.filter((_, i) => i !== index)
    });
  };

  const updateFee = (index, field, value) => {
    const newFees = [...formData.fees];
    newFees[index] = { ...newFees[index], [field]: value };
    setFormData({ ...formData, fees: newFees });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 relative max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="modal-title"
      >
        <Button
          onClick={onClose}
          variant="outline"
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 min-h-0 h-auto border-none hover:bg-gray-50 rounded-full z-10 transition-all duration-200"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <div className="px-8 py-6 border-b border-gray-100">
          <h2
            id="modal-title"
            className="text-2xl font-bold text-gray-900 pr-12"
          >
            {schedule ? "Edit Schedule" : "Create New Schedule"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {schedule ? "Update the schedule details below" : "Fill in the details to create a new schedule"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit}>
            {/* Check if it's a OneTime event for special layout */}
            {formData.recurrences[0]?.recurrenceType === "OneTime" ? (
              /* Calendar-focused layout for One Time Events */
              <div className="flex h-full">
                {/* Left Sidebar - Form Fields */}
                <div className="w-80 border-r border-gray-100 px-6 py-6 space-y-6 overflow-y-auto">
                  {/* Service Selection */}
                  {!schedule && (
                    <div>
                      <Label htmlFor="serviceId" className="text-sm font-medium text-gray-700">
                        Service *
                      </Label>
                      <select
                        id="serviceId"
                        value={formData.serviceId}
                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                        className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm cursor-pointer ${
                          formData.serviceId === '' ? 'text-gray-400' : 'text-gray-900'
                        }`}
                        required
                      >
                        <option value="" disabled hidden>Select a service...</option>
                        {flattenedServices.map((service) => (
                          <option key={service.ServiceID} value={service.ServiceID}>
                            {service.ServiceName}
                          </option>
                        ))}
                      </select>
                      <InputError
                        messages={errors.serviceId ? [errors.serviceId] : []}
                        className="mt-2 text-xs text-red-600"
                      />
                    </div>
                  )}

                  {/* Recurrence Type */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Schedule Type *
                    </Label>
                      <select
                      value={formData.recurrences[0]?.recurrenceType}
                      onChange={(e) => updateRecurrence(0, 'recurrenceType', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900 cursor-pointer"
                    >
                      <option value="" disabled hidden>Select schedule type...</option>
                      {recurrenceTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Slot Capacity */}
                  <div>
                    <Label htmlFor="slotCapacity" className="text-sm font-medium text-gray-700">
                      Slot Capacity *
                    </Label>
                    <Input
                      id="slotCapacity"
                      type="number"
                      min="1"
                      placeholder="Enter capacity"
                      value={formData.slotCapacity}
                      onChange={(e) => {
                        const capacity = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, slotCapacity: capacity });
                      }}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 text-gray-900"
                      required
                    />
                    <InputError
                      messages={errors.slotCapacity ? [errors.slotCapacity] : []}
                      className="mt-2 text-xs text-red-600"
                    />
                  </div>

                  {/* Time Slots */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Time Slots *
                    </Label>
                    {formData.times.map((time, index) => (
                      <div key={index} className="space-y-3 mb-4">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Start Time
                          </Label>
                          <select
                            value={time.startTime}
                            onChange={(e) => updateTime(index, 'startTime', e.target.value)}
                            disabled={!canPickStartTime}
                            className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-white ${!canPickStartTime ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <option value="" disabled>Select start time...</option>
                            {canPickStartTime && timeSlots.map((slot) => (
                              <option key={slot.value} value={slot.value}>
                                {slot.label}
                              </option>
                            ))}
                          </select>
                          {errors[`time_${index}_start`] && (
                            <p className="text-xs text-red-600 mt-1">{errors[`time_${index}_start`]}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            End Time
                          </Label>
                          <select
                            value={time.endTime}
                            onChange={(e) => updateTime(index, 'endTime', e.target.value)}
                            disabled={!canPickStartTime || !time.startTime}
                            className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-white ${(!canPickStartTime || !time.startTime) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <option value="" disabled>Select end time...</option>
                            {canPickStartTime && endTimeOptions(time.startTime).map((slot) => (
                              <option key={slot.value} value={slot.value}>
                                {slot.label}
                              </option>
                            ))}
                          </select>
                          {errors[`time_${index}_end`] && (
                            <p className="text-xs text-red-600 mt-1">{errors[`time_${index}_end`]}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>


                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  )}
                </div>

                {/* Main Content - Calendar */}
                <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-blue-50">
                  <div className="w-full max-w-xl">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 mb-3">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Event Date</h3>
                      <p className="text-sm text-gray-600">Choose when this special event will take place</p>
                      {formData.recurrences[0]?.specificDate && (
                        <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-blue-100 rounded-full">
                          <span className="text-xs font-medium text-blue-900">
                            Selected: {new Date(formData.recurrences[0].specificDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                      <CustomDatePicker
                        value={formData.recurrences[0]?.specificDate}
                        onChange={(dateString) => updateRecurrence(0, 'specificDate', dateString)}
                      />
                      {errors[`recurrence_0_date`] && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700 font-medium text-center">{errors[`recurrence_0_date`]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Regular layout for recurring schedules */
              <div className="px-8 py-6">
                <div className="max-w-2xl mx-auto space-y-5">
                  {/* Service Selection */}
                  {!schedule && (
                    <div>
                      <Label htmlFor="serviceId" className="text-sm font-medium text-gray-700 mb-2 block">
                        Service *
                      </Label>
                      <select
                        id="serviceId"
                        value={formData.serviceId}
                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                        className={`w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm cursor-pointer ${
                          formData.serviceId === '' ? 'text-gray-400' : 'text-gray-900'
                        }`}
                        required
                      >
                        <option value="" disabled hidden>Select a service...</option>
                        {flattenedServices.map((service) => (
                          <option key={service.ServiceID} value={service.ServiceID}>
                            {service.ServiceName}
                          </option>
                        ))}
                      </select>
                      <InputError
                        messages={errors.serviceId ? [errors.serviceId] : []}
                        className="mt-2 text-xs text-red-600"
                      />
                    </div>
                  )}

                  {/* Recurrence Pattern */}
                  {formData.recurrences.map((recurrence, index) => (
                    <div key={index} className="space-y-5">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Recurrence Type *
                        </Label>
                        <select
                          value={recurrence.recurrenceType}
                          onChange={(e) => updateRecurrence(index, 'recurrenceType', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900 cursor-pointer"
                        >
                          <option value="" disabled hidden>Select schedule type...</option>
                          {recurrenceTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(recurrence.recurrenceType === "Weekly" || recurrence.recurrenceType === "MonthlyNth") && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Day of Week *
                          </Label>
                          <select
                            value={recurrence.dayOfWeek}
                            onChange={(e) => updateRecurrence(index, 'dayOfWeek', parseInt(e.target.value))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900 cursor-pointer"
                          >
                            {daysOfWeek.map((day, dayIndex) => (
                              <option key={dayIndex} value={dayIndex}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {recurrence.recurrenceType === "MonthlyNth" && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Week of Month *
                          </Label>
                          <select
                            value={recurrence.weekOfMonth}
                            onChange={(e) => updateRecurrence(index, 'weekOfMonth', parseInt(e.target.value))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900 cursor-pointer"
                          >
                            {weeksOfMonth.map(week => (
                              <option key={week.value} value={week.value}>
                                {week.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Slot Capacity */}
                  <div>
                    <Label htmlFor="slotCapacity" className="text-sm font-medium text-gray-700 mb-2 block">
                      Slot Capacity *
                    </Label>
                    <Input
                      id="slotCapacity"
                      type="number"
                      min="1"
                      placeholder="Enter slot capacity"
                      value={formData.slotCapacity}
                      onChange={(e) => {
                        const capacity = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, slotCapacity: capacity });
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 text-gray-900"
                      required
                    />
                    <InputError
                      messages={errors.slotCapacity ? [errors.slotCapacity] : []}
                      className="mt-2 text-xs text-red-600"
                    />
                  </div>

                  {/* Time Slots */}
                  {formData.times.map((time, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Start Time *
                        </Label>
                        <select
                          value={time.startTime}
                          onChange={(e) => updateTime(index, 'startTime', e.target.value)}
                          disabled={!canPickStartTime}
                          className={`w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-white ${!canPickStartTime ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                            time.startTime === '' ? 'text-gray-400' : 'text-gray-900'
                          }`}
                        >
                          <option value="" disabled>Select start time...</option>
                          {canPickStartTime && timeSlots.map((slot) => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                        {errors[`time_${index}_start`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`time_${index}_start`]}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          End Time *
                        </Label>
                        <select
                          value={time.endTime}
                          onChange={(e) => updateTime(index, 'endTime', e.target.value)}
                          disabled={!canPickStartTime || !time.startTime}
                          className={`w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-white ${
                            (!canPickStartTime || !time.startTime) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer ' + (time.endTime === '' ? 'text-gray-400' : 'text-gray-900')
                          }`}
                        >
                          <option value="" disabled>Select end time...</option>
                          {canPickStartTime && endTimeOptions(time.startTime).map((slot) => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                        {errors[`time_${index}_end`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`time_${index}_end`]}</p>
                        )}
                      </div>
                    </div>
                  ))}


                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-end items-center space-x-3 p-6 border-t border-gray-200">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="inline-flex items-center px-3 py-2 text-sm font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {schedule ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{schedule ? "Update Schedule" : "Create Schedule"}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
