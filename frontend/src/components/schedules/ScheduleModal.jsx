"use client";
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Calendar, Clock, Users, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import InlineCalendar from "@/components/ui/InlineCalendar.jsx";
import axios from "@/lib/axios";

const ScheduleModal = ({ isOpen, onClose, schedule, services, onSuccess }) => {
  const [formData, setFormData] = useState({
    serviceId: "",
    slotCapacity: "",
    recurrences: [{
      recurrenceType: "OneTime",
      dayOfWeek: 0,
      weekOfMonth: 1,
      specificDate: ""
    }],
    times: [{
      startTime: "",
      endTime: ""
    }],
    fees: [{
      feeType: "Fee",
      fee: "0.00"
    }]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const feeTypes = [
    "Fee",
    "Donation"
  ];

  useEffect(() => {
    if (schedule) {
      // Populate form with existing schedule data
      setFormData({
        serviceId: schedule.ServiceID || "",
        slotCapacity: schedule.SlotCapacity || "",
        recurrences: schedule.recurrences && schedule.recurrences.length > 0 
          ? schedule.recurrences.map(r => ({
              recurrenceType: r.RecurrenceType,
              dayOfWeek: r.DayOfWeek || 0,
              weekOfMonth: r.WeekOfMonth || 1,
              specificDate: r.SpecificDate ? r.SpecificDate.split('T')[0] : ""
            }))
          : [{
              recurrenceType: "OneTime",
              dayOfWeek: 0,
              weekOfMonth: 1,
              specificDate: ""
            }],
        times: schedule.times && schedule.times.length > 0
          ? schedule.times.map(t => ({
              startTime: t.StartTime || "",
              endTime: t.EndTime || ""
            }))
          : [{
              startTime: "",
              endTime: ""
            }],
        fees: schedule.fees && schedule.fees.length > 0
          ? [{
              feeType: schedule.fees[0].FeeType,
              fee: schedule.fees[0].Fee
            }]
          : [{
              feeType: "Fee",
              fee: "0.00"
            }]
      });
    } else {
      // Reset form for new schedule
      setFormData({
        serviceId: "",
        slotCapacity: "",
        recurrences: [{
          recurrenceType: "OneTime",
          dayOfWeek: 0,
          weekOfMonth: 1,
          specificDate: ""
        }],
        times: [{
          startTime: "",
          endTime: ""
        }],
        fees: [{
          feeType: "Fee",
          fee: "0.00"
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

    // Validate fees
    formData.fees.forEach((fee, index) => {
      if (!fee.feeType) {
        newErrors[`fee_${index}_type`] = "Fee type is required";
      }
      if (!fee.fee || fee.fee < 0) {
        newErrors[`fee_${index}_amount`] = "Fee amount must be 0 or greater";
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
      
      const payload = {
        start_date: today,
        end_date: null, // Always null as per requirement
        slot_capacity: parseInt(formData.slotCapacity),
        recurrences: formData.recurrences.map(r => ({
          recurrence_type: r.recurrenceType,
          day_of_week: r.recurrenceType !== "OneTime" ? r.dayOfWeek : null,
          week_of_month: r.recurrenceType === "MonthlyNth" ? r.weekOfMonth : null,
          specific_date: r.recurrenceType === "OneTime" ? r.specificDate : null
        })),
        times: formData.times.map(t => ({
          start_time: t.startTime,
          end_time: t.endTime
        })),
        fees: formData.fees.map(f => ({
          fee_type: f.feeType,
          fee: parseFloat(f.fee)
        }))
      };

      let response;
      if (schedule) {
        // Update existing schedule
        response = await axios.put(`/api/schedules/${schedule.ScheduleID}`, payload);
      } else {
        // Create new schedule
        response = await axios.post(`/api/sacrament-services/${formData.serviceId}/schedules`, payload);
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
        recurrenceType: "OneTime",
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
                        className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm ${
                          formData.serviceId === '' ? 'text-gray-400' : 'text-gray-900'
                        }`}
                        required
                      >
                        <option value="" disabled hidden>Select a service...</option>
                        {services.map((service) => (
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
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900"
                    >
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
                          <input
                            type="time"
                            value={time.startTime}
                            onChange={(e) => updateTime(index, 'startTime', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          {errors[`time_${index}_start`] && (
                            <p className="text-xs text-red-600 mt-1">{errors[`time_${index}_start`]}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            End Time
                          </Label>
                          <input
                            type="time"
                            value={time.endTime}
                            onChange={(e) => updateTime(index, 'endTime', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          {errors[`time_${index}_end`] && (
                            <p className="text-xs text-red-600 mt-1">{errors[`time_${index}_end`]}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fees */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Fees *
                    </Label>
                    {formData.fees.map((fee, index) => (
                      <div key={index} className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Fee Type
                          </Label>
                          <select
                            value={fee.feeType}
                            onChange={(e) => updateFee(index, 'feeType', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900"
                          >
                            {feeTypes.map(type => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          {errors[`fee_${index}_type`] && (
                            <p className="text-xs text-red-600 mt-1">{errors[`fee_${index}_type`]}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Amount ($)
                          </Label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={fee.fee}
                            onChange={(e) => updateFee(index, 'fee', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 text-gray-900"
                          />
                          {errors[`fee_${index}_amount`] && (
                            <p className="text-xs text-red-600 mt-1">{errors[`fee_${index}_amount`]}</p>
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
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    <div className="mb-6">
                      <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Your Date</h3>
                      <p className="text-gray-600">Choose when this special event will take place</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
                      <InlineCalendar
                        value={formData.recurrences[0]?.specificDate}
                        onChange={(dateString) => updateRecurrence(0, 'specificDate', dateString)}
                        className="border-none bg-transparent shadow-none"
                      />
                      {errors[`recurrence_0_date`] && (
                        <p className="text-sm text-red-600 mt-3">{errors[`recurrence_0_date`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Regular layout for recurring schedules */
              <div className="px-8 py-6">
                <div className="max-w-2xl mx-auto space-y-6">
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
                        className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm ${
                          formData.serviceId === '' ? 'text-gray-400' : 'text-gray-900'
                        }`}
                        required
                      >
                        <option value="" disabled hidden>Select a service...</option>
                        {services.map((service) => (
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

                  {/* Slot Capacity */}
                  <div>
                    <Label htmlFor="slotCapacity" className="text-sm font-medium text-gray-700">
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
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 text-gray-900"
                      required
                    />
                    <InputError
                      messages={errors.slotCapacity ? [errors.slotCapacity] : []}
                      className="mt-2 text-xs text-red-600"
                    />
                  </div>

                  {/* Recurrence Pattern */}
                  {formData.recurrences.map((recurrence, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700">
                          Recurrence Type *
                        </Label>
                        <select
                          value={recurrence.recurrenceType}
                          onChange={(e) => updateRecurrence(index, 'recurrenceType', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900"
                        >
                          {recurrenceTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(recurrence.recurrenceType === "Weekly" || recurrence.recurrenceType === "MonthlyNth") && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Day of Week *
                          </Label>
                          <select
                            value={recurrence.dayOfWeek}
                            onChange={(e) => updateRecurrence(index, 'dayOfWeek', parseInt(e.target.value))}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900"
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
                          <Label className="text-sm font-medium text-gray-700">
                            Week of Month *
                          </Label>
                          <select
                            value={recurrence.weekOfMonth}
                            onChange={(e) => updateRecurrence(index, 'weekOfMonth', parseInt(e.target.value))}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900"
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

                  {/* Time Slots */}
                  {formData.times.map((time, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Start Time *
                        </Label>
                        <input
                          type="time"
                          placeholder="Select start time"
                          value={time.startTime}
                          onChange={(e) => updateTime(index, 'startTime', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 ${
                            time.startTime === '' ? 'text-gray-400' : 'text-gray-900'
                          }`}
                        />
                        {errors[`time_${index}_start`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`time_${index}_start`]}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          End Time *
                        </Label>
                        <input
                          type="time"
                          placeholder="Select end time"
                          value={time.endTime}
                          onChange={(e) => updateTime(index, 'endTime', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 ${
                            time.endTime === '' ? 'text-gray-900' : 'text-gray-900'
                          }`}
                        />
                        {errors[`time_${index}_end`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`time_${index}_end`]}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Fees */}
                  {formData.fees.map((fee, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Fee Type *
                        </Label>
                        <select
                          value={fee.feeType}
                          onChange={(e) => updateFee(index, 'feeType', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900"
                        >
                          {feeTypes.map(type => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        {errors[`fee_${index}_type`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`fee_${index}_type`]}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Amount ($) *
                        </Label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={fee.fee}
                          onChange={(e) => updateFee(index, 'fee', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 text-gray-900"
                        />
                        {errors[`fee_${index}_amount`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`fee_${index}_amount`]}</p>
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
