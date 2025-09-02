'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Calendar, Clock, Users } from 'lucide-react'
import axios from '@/lib/axios'

const SacramentApplicationModal = ({ isOpen, onClose, church }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [formData, setFormData] = useState({})

  // Step 1: Services
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError] = useState(null)

  // Step 2: Schedules
  const [schedules, setSchedules] = useState([])
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const [schedulesError, setSchedulesError] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  // Step 3: Form
  const [formConfig, setFormConfig] = useState({ form_elements: [], requirements: [] })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen && church) {
      setCurrentStep(1)
      setSelectedService(null)
      setSelectedSchedule(null)
      setFormData({})
      setCurrentMonth(new Date())
      setSelectedDate(null)
      fetchServices()
    }
  }, [isOpen, church])

  const fetchServices = async () => {
    if (!church) return
    
    try {
      setServicesLoading(true)
      setServicesError(null)
      const response = await axios.get(`/api/churches/${church.ChurchID}/sacrament-services`)
      setServices(response.data.services)
    } catch (err) {
      console.error('Error fetching services:', err)
      setServicesError('Failed to load sacrament services')
    } finally {
      setServicesLoading(false)
    }
  }

  const fetchSchedules = async (serviceId) => {
    try {
      setSchedulesLoading(true)
      setSchedulesError(null)
      const response = await axios.get(`/api/sacrament-services/${serviceId}/schedules-public`)
      setSchedules(response.data.schedules)
    } catch (err) {
      console.error('Error fetching schedules:', err)
      setSchedulesError('Failed to load schedules')
    } finally {
      setSchedulesLoading(false)
    }
  }

  const fetchFormConfig = async (serviceId) => {
    try {
      setFormLoading(true)
      setFormError(null)
      const response = await axios.get(`/api/sacrament-services/${serviceId}/form-config-public`)
      setFormConfig(response.data)
    } catch (err) {
      console.error('Error fetching form config:', err)
      setFormError('Failed to load application form')
    } finally {
      setFormLoading(false)
    }
  }

  const handleServiceSelect = (service) => {
    setSelectedService(service)
    fetchSchedules(service.ServiceID)
    setCurrentStep(2)
  }

  const handleScheduleSelect = (schedule) => {
    setSelectedSchedule(schedule)
    fetchFormConfig(selectedService.ServiceID)
    setCurrentStep(3)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    // TODO: Submit application
    console.log('Application submitted:', {
      church,
      service: selectedService,
      schedule: selectedSchedule,
      formData
    })
    onClose()
  }

  const formatScheduleDisplay = (schedule) => {
    const startDate = new Date(schedule.StartDate)
    const times = schedule.times || []
    const fees = schedule.fees || []
    
    return {
      date: startDate.toLocaleDateString(),
      times: times.map(t => `${t.StartTime} - ${t.EndTime}`).join(', '),
      availableSlots: schedule.RemainingSlot,
      totalSlots: schedule.SlotCapacity,
      fees: fees.map(f => `${f.FeeType}: ₱${f.Fee}`).join(', ') || 'No fees'
    }
  }

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear()
  }

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.StartDate)
      
      // Check if it's an exact date match
      if (isSameDay(scheduleDate, date)) {
        return true
      }
      
      // Check for recurring schedules
      if (schedule.IsRecurring && schedule.RecurrencePattern) {
        const pattern = schedule.RecurrencePattern.toLowerCase()
        
        // Handle "every [day]" patterns
        if (pattern.includes('every')) {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          
          for (let i = 0; i < dayNames.length; i++) {
            if (pattern.includes(dayNames[i])) {
              // Check if the date falls on the correct day of week
              if (date.getDay() === i && date >= scheduleDate) {
                return true
              }
            }
          }
        }
      }
      
      return false
    })
  }

  const hasSchedulesOnDate = (date) => {
    return getSchedulesForDate(date).length > 0
  }

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + direction)
    setCurrentMonth(newMonth)
    setSelectedDate(null)
  }

  const selectDate = (date) => {
    const schedulesForDate = getSchedulesForDate(date)
    if (schedulesForDate.length > 0) {
      setSelectedDate(date)
    }
  }

  const renderFormField = (field, index) => {
    const fieldId = `field_${index}`
    const value = formData[fieldId] || ''

    const updateField = (newValue) => {
      setFormData(prev => ({
        ...prev,
        [fieldId]: newValue
      }))
    }

    // Get positioning and sizing from saved properties - USE EXACT SAVED VALUES
    const x = field.properties?.x || 0
    const y = field.properties?.y || 0
    const width = field.properties?.width || 300
    const height = field.properties?.height || 40
    const textSize = field.properties?.size || 14
    const textAlign = field.properties?.align || 'left'
    const textColor = field.properties?.color || '#374151'

    // Always use absolute positioning to match the form builder exactly
    const commonStyles = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      fontSize: `${textSize}px`,
      textAlign: textAlign,
      color: textColor
    }

    const inputStyles = {
      ...commonStyles,
      height: `${height}px`,
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      outline: 'none',
      backgroundColor: '#ffffff',
      fontSize: '14px',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
    }

    const labelStyles = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y - 30}px`,
      fontWeight: '600',
      fontSize: '14px',
      color: '#374151'
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <div key={index} style={{ position: 'relative' }}>
            {field.label && (
              <label 
                htmlFor={fieldId} 
                style={labelStyles}
              >
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <input
              type={field.type}
              id={fieldId}
              value={value}
              onChange={(e) => updateField(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              style={inputStyles}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={index} style={{ position: 'relative' }}>
            {field.label && (
              <label 
                htmlFor={fieldId} 
                style={labelStyles}
              >
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <textarea
              id={fieldId}
              value={value}
              onChange={(e) => updateField(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={field.properties?.rows || 3}
              style={{
                ...inputStyles,
                height: `${height}px`,
                resize: 'vertical',
                minHeight: '80px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        )

      case 'select':
        return (
          <div key={index} style={{ position: 'relative' }}>
            {field.label && (
              <label 
                htmlFor={fieldId} 
                style={labelStyles}
              >
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <select
              id={fieldId}
              value={value}
              onChange={(e) => updateField(e.target.value)}
              required={field.required}
              style={inputStyles}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="">Select an option...</option>
              {(field.options || []).map((option, optIndex) => (
                <option key={optIndex} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )

      case 'radio':
        return (
          <div key={index}>
            {field.label && (
              <div style={labelStyles}>
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </div>
            )}
            <div style={{
              ...commonStyles,
              top: `${y}px` // Position radio group below label
            }}>
            {/* Radio options container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(field.options || []).map((option, optIndex) => (
                  <label key={optIndex} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <input
                      type="radio"
                      name={fieldId}
                      value={option}
                      checked={value === option}
                      onChange={(e) => updateField(e.target.value)}
                      required={field.required}
                      style={{ 
                        marginRight: '12px',
                        transform: 'scale(1.1)'
                      }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 'checkbox':
        return (
          <div key={index}>
            <label style={{ 
              ...commonStyles, 
              display: 'flex', 
              alignItems: 'center', 
              fontSize: '14px',
              cursor: 'pointer',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              transition: 'all 0.2s ease',
              height: `${height}px`
            }}>
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => updateField(e.target.checked)}
                required={field.required}
                style={{ 
                  marginRight: '12px',
                  transform: 'scale(1.1)'
                }}
              />
              <span>
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </span>
            </label>
          </div>
        )

      case 'date':
        return (
          <div key={index}>
            {field.label && (
              <label 
                htmlFor={fieldId} 
                style={labelStyles}
              >
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <input
              type="date"
              id={fieldId}
              value={value}
              onChange={(e) => updateField(e.target.value)}
              required={field.required}
              style={inputStyles}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
        )

      case 'label':
      case 'heading':
      case 'paragraph':
        // Get proper font size based on heading size
        const getHeadingFontSize = (headingSize) => {
          const sizes = {
            'h1': '32px',  // 2rem
            'h2': '24px',  // 1.5rem  
            'h3': '20px',  // 1.25rem
            'h4': '16px'   // 1rem
          }
          return sizes[headingSize] || '24px'
        }
        
        const getHeadingFontWeight = (headingSize) => {
          const weights = {
            'h1': '700',  // bold
            'h2': '600',  // semibold
            'h3': '600',  // semibold  
            'h4': '500'   // medium
          }
          return weights[headingSize] || '600'
        }
        
        const actualFontSize = field.type === 'heading' 
          ? getHeadingFontSize(field.properties?.size || 'h2')
          : `${textSize}px`
          
        const actualFontWeight = field.type === 'heading'
          ? getHeadingFontWeight(field.properties?.size || 'h2')
          : 'normal'
        
        return (
          <div 
            key={index} 
            style={{
              ...commonStyles,
              fontWeight: actualFontWeight,
              fontSize: actualFontSize,
              height: `${height}px`,
              display: 'flex',
              alignItems: 'center',
              lineHeight: '1.2',
              margin: 0,
              padding: 0
            }}
          >
            {field.properties?.text || field.label}
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            {church?.ProfilePictureUrl ? (
              <img 
                src={church.ProfilePictureUrl}
                alt={church.ChurchName}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 mr-3"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
                {church?.ChurchName?.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Apply for Sacrament</h2>
              <p className="text-sm text-gray-600">{church?.ChurchName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Progress */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Select Service</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-4"></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Select Schedule</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-4"></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Fill Application</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Select Service */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Sacrament Service</h3>
              
              {servicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading services...</span>
                </div>
              ) : servicesError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{servicesError}</p>
                  <button
                    onClick={fetchServices}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No sacrament services available at this church.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.ServiceID}
                      onClick={() => handleServiceSelect(service)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                            {service.ServiceName}
                          </h4>
                          {service.Description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {service.Description}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Schedule */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Choose a Schedule</h3>
                  <p className="text-sm text-gray-600">For {selectedService?.ServiceName}</p>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Change Service
                </button>
              </div>

              {schedulesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading schedules...</span>
                </div>
              ) : schedulesError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{schedulesError}</p>
                  <button
                    onClick={() => fetchSchedules(selectedService.ServiceID)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No available schedules for this service.</p>
                </div>
              ) : (
                <div>
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h4 className="font-medium text-gray-900">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button
                      onClick={() => navigateMonth(1)}
                      className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="mb-4">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for days before the first day of the month */}
                      {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
                        <div key={`empty-${index}`} className="p-2 h-10"></div>
                      ))}
                      
                      {/* Days of the month */}
                      {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, index) => {
                        const day = index + 1
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                        const today = new Date()
                        const isToday = isSameDay(date, today)
                        const isPast = date < today && !isToday
                        const hasSchedules = hasSchedulesOnDate(date)
                        const isSelected = selectedDate && isSameDay(date, selectedDate)
                        
                        return (
                          <button
                            key={day}
                            onClick={() => selectDate(date)}
                            disabled={isPast || !hasSchedules}
                            className={`
                              p-2 h-10 text-sm rounded-md transition-all relative
                              ${isPast 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : hasSchedules 
                                  ? isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-900 hover:bg-blue-50 cursor-pointer'
                                  : 'text-gray-400 cursor-not-allowed'
                              }
                              ${isToday && !isSelected ? 'ring-2 ring-blue-200' : ''}
                            `}
                          >
                            {day}
                            {hasSchedules && (
                              <div className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                                isSelected ? 'bg-white' : 'bg-blue-600'
                              }`}></div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Schedule Details for Selected Date */}
                  {selectedDate && (
                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="font-medium text-gray-900 mb-3">
                        Available times for {selectedDate.toLocaleDateString()}
                      </h5>
                      <div className="space-y-2">
                        {getSchedulesForDate(selectedDate).map((schedule) => {
                          const displayInfo = formatScheduleDisplay(schedule)
                          return (
                            <div
                              key={`${schedule.ScheduleID}-${selectedDate.toISOString()}`}
                              onClick={() => handleScheduleSelect(schedule)}
                              className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center text-sm text-gray-700 mb-1">
                                    <Clock className="w-4 h-4 mr-2" />
                                    <span className="font-medium">{displayInfo.times}</span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600 mb-1">
                                    <Users className="w-4 h-4 mr-2" />
                                    <span>{displayInfo.availableSlots} of {displayInfo.totalSlots} slots available</span>
                                    {displayInfo.fees !== 'No fees' && (
                                      <span className="ml-4">
                                        <span className="font-medium">Fees:</span> {displayInfo.fees}
                                      </span>
                                    )}
                                  </div>
                                  {schedule.IsRecurring && schedule.RecurrencePattern && (
                                    <div className="flex items-center text-xs text-blue-600">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      <span>{schedule.RecurrencePattern}</span>
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {!selectedDate && (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      Select a date with available schedules (marked with blue dots)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Fill Form */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Application Form</h3>
                  <p className="text-sm text-gray-600">
                    {selectedService?.ServiceName} - {formatScheduleDisplay(selectedSchedule).date}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Change Schedule
                </button>
              </div>

              {formLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading form...</span>
                </div>
              ) : formError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{formError}</p>
                  <button
                    onClick={() => fetchFormConfig(selectedService.ServiceID)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit}>
                  {/* Requirements */}
                  {formConfig.requirements && formConfig.requirements.length > 0 && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Requirements</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {formConfig.requirements.map((req, index) => (
                          <li key={index} className={`text-sm ${req.is_mandatory ? 'text-yellow-800' : 'text-yellow-700'}`}>
                            {req.description}
                            {req.is_mandatory && <span className="font-medium"> (Required)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Form Fields */}
                  {formConfig.form_elements && formConfig.form_elements.length > 0 ? (
                    (() => {
                      // Find container element to get dimensions
                      const containerElement = formConfig.form_elements.find(el => el.type === 'container')
                      
                      if (containerElement) {
                        // Use container dimensions and styling
                        const containerProps = containerElement.properties || {}
                        return (
                          <div 
                            style={{ 
                              position: 'relative',
                              width: `${containerProps.width || 600}px`,
                              height: `${containerProps.height || 400}px`,
                              border: `${containerProps.borderWidth || 2}px solid ${containerProps.borderColor || '#e5e7eb'}`,
                              borderRadius: `${containerProps.borderRadius || 8}px`,
                              backgroundColor: containerProps.backgroundColor || '#ffffff',
                              padding: `${containerProps.padding || 20}px`,
                              margin: '20px auto',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            {formConfig.form_elements
                              .filter(el => el.type !== 'container')
                              .map(renderFormField)
                            }
                          </div>
                        )
                      } else {
                        // Fallback to default container if no container element found
                        return (
                          <div 
                            style={{ 
                              position: 'relative',
                              width: '100%',
                              minHeight: '500px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '12px',
                              backgroundColor: '#ffffff',
                              padding: '32px',
                              margin: '20px 0',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            {formConfig.form_elements.map(renderFormField)}
                          </div>
                        )
                      }
                    })()
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No form configuration found for this service.</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Submit Application
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SacramentApplicationModal