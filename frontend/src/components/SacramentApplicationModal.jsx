'use client'

import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Calendar, Clock, Users, Upload, FileText, Trash2 } from 'lucide-react'
import axios from '@/lib/axios'
import FormRenderer from './FormRenderer'
import Alert from './Alert'

const SacramentApplicationModal = ({ isOpen, onClose, church }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [selectedScheduleTime, setSelectedScheduleTime] = useState(null)
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
  const [uploadedDocuments, setUploadedDocuments] = useState({})
  const [scheduleSlotCounts, setScheduleSlotCounts] = useState({})
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [userMembership, setUserMembership] = useState(null)
  const [membershipLoading, setMembershipLoading] = useState(false)

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen && church) {
      setCurrentStep(1)
      setSelectedService(null)
      setSelectedSchedule(null)
      setSelectedScheduleTime(null)
      setFormData({})
      setCurrentMonth(new Date())
      setSelectedDate(null)
      setUploadedDocuments({})
      setSubmitError(null)
      setSubmitSuccess(false)
      setIsSubmitting(false)
      setMembershipError(null)
      setUserMembership(null)
      fetchServices()
      if (church) {
        checkMembershipStatus()
      }
    }
  }, [isOpen, church])

  const checkMembershipStatus = async () => {
    if (!church) return
    
    try {
      setMembershipLoading(true)
      const response = await axios.get(`/api/user/membership/${church.ChurchID}`)
      console.log('Membership status:', response.data)
      setUserMembership(response.data)
    } catch (err) {
      console.log('No membership found or error:', err.response?.status)
      if (err.response?.status === 404) {
        setUserMembership({ status: 'none' }) // User is not a member
      } else {
        setUserMembership(null) // Error occurred, assume no membership
      }
    } finally {
      setMembershipLoading(false)
    }
  }

  const isApprovedMember = () => {
    return userMembership && userMembership.status === 'approved'
  }

  const calculateDiscountedFee = (originalFee, service) => {
    if (!isApprovedMember() || !service.member_discount_type || !service.member_discount_value) {
      return originalFee
    }

    const discountValue = parseFloat(service.member_discount_value)
    if (isNaN(discountValue) || discountValue <= 0) {
      return originalFee
    }

    if (service.member_discount_type === 'percentage') {
      const discount = (originalFee * discountValue) / 100
      return Math.max(0, originalFee - discount) // Don't go below 0
    } else if (service.member_discount_type === 'fixed') {
      return Math.max(0, originalFee - discountValue) // Don't go below 0
    }

    return originalFee
  }

  const getDiscountInfo = (originalFee, service) => {
    if (!isApprovedMember() || !service.member_discount_type || !service.member_discount_value) {
      return null
    }

    const discountedFee = calculateDiscountedFee(originalFee, service)
    const savings = originalFee - discountedFee

    if (savings > 0) {
      return {
        originalFee,
        discountedFee,
        savings,
        discountType: service.member_discount_type,
        discountValue: service.member_discount_value
      }
    }

    return null
  }

  const fetchServices = async () => {
    if (!church) return
    
    try {
      setServicesLoading(true)
      setServicesError(null)
      console.log('Fetching services for church ID:', church.ChurchID)
      const response = await axios.get(`/api/churches/${church.ChurchID}/sacrament-services`)
      console.log('Services API response:', response)
      console.log('Services data:', response.data)
      console.log('Services array:', response.data.services)
      setServices(response.data.services || [])
    } catch (err) {
      console.error('Error fetching services:', err)
      console.error('Error response:', err.response)
      setServicesError('Failed to load sacrament services: ' + (err.response?.data?.error || err.message))
    } finally {
      setServicesLoading(false)
    }
  }

  const fetchSchedules = async (serviceId) => {
    try {
      setSchedulesLoading(true)
      setSchedulesError(null)
      console.log('Fetching schedules for service ID:', serviceId)
      const response = await axios.get(`/api/sacrament-services/${serviceId}/schedules-public`)
      console.log('Schedules API response:', response)
      console.log('Schedules data:', response.data)
      console.log('Schedules array:', response.data.schedules)
      setSchedules(response.data.schedules || [])
    } catch (err) {
      console.error('Error fetching schedules:', err)
      console.error('Error response:', err.response)
      setSchedulesError('Failed to load schedules: ' + (err.response?.data?.error || err.message))
    } finally {
      setSchedulesLoading(false)
    }
  }

  const fetchFormConfig = async (serviceId) => {
    try {
      setFormLoading(true)
      setFormError(null)
      const response = await axios.get(`/api/sacrament-services/${serviceId}/form-config-public`)
      console.log('Form config received:', response.data)
      console.log('Form elements:', response.data.form_elements)
      setFormConfig(response.data)
    } catch (err) {
      console.error('Error fetching form config:', err)
      setFormError('Failed to load requirements')
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
    
    // Check if there's only one time slot and it has available slots
    if (schedule.times && schedule.times.length === 1) {
      const singleTimeSlot = schedule.times[0]
      
      // Get slot availability for this time slot - fix timezone issue
      let dateKey = null
      if (selectedDate) {
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        dateKey = `${year}-${month}-${day}`
      }
      const slotKey = `${schedule.ScheduleID}_${dateKey}`
      const slotInfo = scheduleSlotCounts[slotKey]
      const timeSlotInfo = slotInfo?.time_slots?.find(ts => ts.ScheduleTimeID === singleTimeSlot.ScheduleTimeID)
      const availableSlots = timeSlotInfo ? timeSlotInfo.RemainingSlots : schedule.SlotCapacity
      
      // Only auto-select if slots are available
      if (availableSlots > 0) {
        setSelectedScheduleTime(singleTimeSlot)
        fetchFormConfig(selectedService.ServiceID)
        setCurrentStep(3)
        return
      }
    }
    
    // For multiple time slots or when single slot is unavailable, show time selection
    // The user will need to manually select from available time slots
  }

  const handleScheduleTimeSelect = (scheduleTime) => {
    setSelectedScheduleTime(scheduleTime)
    fetchFormConfig(selectedService.ServiceID)
    setCurrentStep(3)
  }

  const handleFileUpload = (requirementIndex, file) => {
    if (file) {
      setUploadedDocuments(prev => ({
        ...prev,
        [requirementIndex]: file
      }))
    }
  }

  const removeDocument = (requirementIndex) => {
    setUploadedDocuments(prev => {
      const updated = { ...prev }
      delete updated[requirementIndex]
      return updated
    })
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [membershipError, setMembershipError] = useState(null)

  // Simplified application submission handler
  const handleApplicationSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // Check if service is free (any amount = 0) and require membership
      const hasFreeSchedules = selectedSchedule.fees && selectedSchedule.fees.some(fee => {
        const amount = parseFloat(fee.Amount || fee.Fee || fee.amount || fee.fee || 0)
        return amount === 0
      })
      
      if (hasFreeSchedules) {
        // Free service - check membership requirement
        try {
          const membershipResponse = await axios.get(`/api/user/membership/${church.ChurchID}`)
          console.log("Membership response:", membershipResponse)
          if (!membershipResponse.data || membershipResponse.data.status !== 'approved') {
            setMembershipError('This is a free service. You must be an approved member of this church to request it. Please apply for membership first.')
            return
          }
        } catch (error) {
          if (error.response?.status === 404) {
            setMembershipError('This is a free service. You must be an approved member of this church to request it. Please apply for membership first.')
            return
          }
          // Other errors, continue with request
        }
      }
      
      // Prepare basic application data
      // Fix timezone issue by using local date string
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const localDateString = `${year}-${month}-${day}`
      
      const applicationData = {
        church_id: church.ChurchID,
        service_id: selectedService.ServiceID,
        schedule_id: selectedSchedule.ScheduleID,
        schedule_time_id: selectedScheduleTime.ScheduleTimeID,
        selected_date: localDateString, // YYYY-MM-DD format using local date
        status: 'pending'
      }
      
      console.log('Submitting application:', applicationData)
      
      // Submit to API
      const response = await axios.post('/api/sacrament-applications', applicationData)
      
      // Check if payment is required
      if (response.data?.requires_payment && response.data?.redirect_url) {
        // Save checkout session id and church_id then redirect to PayMongo checkout
        try { 
          localStorage.setItem('paymongo_session_id', response.data?.payment_session?.id || ''); 
          localStorage.setItem('paymongo_church_id', applicationData.church_id.toString());
          localStorage.setItem('appointment_success', '1');
        } catch {}
        onClose()
        window.location.href = response.data.redirect_url
        return
      }
      
      // Free flow: redirect to dashboard to show unified success toast
      try { localStorage.setItem('appointment_success', '1'); } catch {}
      onClose()
      window.location.assign('/dashboard#success')
      return
      
    } catch (error) {
      console.error('Error submitting application:', error)
      
      // Check if error response indicates payment required
      if (error.response?.status === 402 && error.response.data?.redirect_url) {
        // Save checkout session id and church_id then redirect to PayMongo checkout
        try { 
          localStorage.setItem('paymongo_session_id', error.response.data?.payment_session?.id || ''); 
          localStorage.setItem('paymongo_church_id', applicationData.church_id.toString());
          localStorage.setItem('appointment_success', '1');
        } catch {}
        onClose()
        window.location.href = error.response.data.redirect_url
        return
      }
      
      setSubmitError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to submit application. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // Check if service is free (any amount = 0) and require membership
      const hasFreeSchedules = selectedSchedule.fees && selectedSchedule.fees.some(fee => {
        const amount = parseFloat(fee.Amount || fee.Fee || fee.amount || fee.fee || 0)
        return amount === 0
      })
      
      if (hasFreeSchedules) {
        // Free service - check membership requirement
        try {
          const membershipResponse = await axios.get(`/api/user/membership/${church.ChurchID}`)
          
          if (!membershipResponse.data || membershipResponse.data.status !== 'approved') {
            setMembershipError('This is a free service. You must be an approved member of this church to request it. Please apply for membership first.')
            return
          }
        } catch (error) {
          if (error.response?.status === 404) {
            setMembershipError('This is a free service. You must be an approved member of this church to request it. Please apply for membership first.')
            return
          }
          // Other errors, continue with request
        }
      }
      
      // Check if we have required form fields filled
      const requiredFields = formConfig.form_elements?.filter(field => field.required && !['heading', 'paragraph', 'label', 'container'].includes(field.type)) || []
      
      for (const field of requiredFields) {
        const fieldId = field.id || `field_${field.InputFieldID}`
        const fieldValue = formData[fieldId]
        if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
          setSubmitError(`Please fill in the required field: ${field.label}`)
          setIsSubmitting(false)
          return
        }
      }
      
      // Prepare form data for multipart submission
      const formDataToSubmit = new FormData()
      
      // Add basic appointment data
      formDataToSubmit.append('church_id', church.ChurchID)
      formDataToSubmit.append('service_id', selectedService.ServiceID)
      formDataToSubmit.append('schedule_id', selectedSchedule.ScheduleID)
      formDataToSubmit.append('schedule_time_id', selectedScheduleTime.ScheduleTimeID)
      
      // Fix timezone issue by using local date string
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const localDateString = `${year}-${month}-${day}`
      formDataToSubmit.append('selected_date', localDateString)
      
      // Add form field answers - make sure formData has the right structure
      console.log('Form data being sent:', formData)
      formDataToSubmit.append('form_data', JSON.stringify(formData))
      
      // Add uploaded documents
      Object.entries(uploadedDocuments).forEach(([requirementIndex, file]) => {
        formDataToSubmit.append(`documents[document_${requirementIndex}]`, file)
      })
      
      // Submit to API
      const response = await axios.post('/api/appointments', formDataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      // Check if payment is required
      if (response.data?.requires_payment && response.data?.redirect_url) {
        // Save checkout session id and church_id then redirect to PayMongo checkout
        try { 
          localStorage.setItem('paymongo_session_id', response.data?.payment_session?.id || ''); 
          localStorage.setItem('paymongo_church_id', church.ChurchID.toString());
          localStorage.setItem('appointment_success', '1');
        } catch {}
        onClose()
        window.location.href = response.data.redirect_url
        return
      }
      
      // Free flow: redirect to dashboard to show unified success toast
      try { localStorage.setItem('appointment_success', '1'); } catch {}
      onClose()
      window.location.assign('/dashboard#success')
      return
      
    } catch (error) {
      console.error('Error submitting application:', error)
      
      // Check if error response indicates payment required
      if (error.response?.status === 402 && error.response.data?.redirect_url) {
        // Save checkout session id and church_id then redirect to PayMongo checkout
        try { 
          localStorage.setItem('paymongo_session_id', error.response.data?.payment_session?.id || ''); 
          localStorage.setItem('paymongo_church_id', church.ChurchID.toString());
          localStorage.setItem('appointment_success', '1');
        } catch {}
        onClose()
        window.location.href = error.response.data.redirect_url
        return
      }
      
      setSubmitError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to submit application. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatScheduleDisplay = (schedule) => {
    const startDate = new Date(schedule.StartDate)
    const fees = schedule.fees || []
    
    // Format fees with discount information if applicable
    const formatFeesWithDiscount = () => {
      if (fees.length === 0) return 'No fees'
      
      return fees.map(fee => {
        const originalAmount = parseFloat(fee.Fee || fee.Amount || 0)
        const discountInfo = getDiscountInfo(originalAmount, selectedService)
        
        if (discountInfo) {
          return `${fee.FeeType}: ₱${discountInfo.discountedFee.toFixed(2)} (was ₱${originalAmount.toFixed(2)})`
        } else {
          return `${fee.FeeType}: ₱${originalAmount.toFixed(2)}`
        }
      }).join(', ')
    }
    
    return {
      date: startDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      totalSlots: schedule.SlotCapacity,
      fees: formatFeesWithDiscount()
    }
  }

  const formatScheduleTimeDisplay = (scheduleTime, schedule) => {
    // Get slot count for this specific schedule time and selected date - fix timezone issue
    let dateKey = null
    if (selectedDate) {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      dateKey = `${year}-${month}-${day}`
    }
    const slotKey = `${schedule.ScheduleID}_${dateKey}`
    const slotInfo = scheduleSlotCounts[slotKey]
    
    // Find the specific time slot info
    const timeSlotInfo = slotInfo?.time_slots?.find(ts => ts.ScheduleTimeID === scheduleTime.ScheduleTimeID)
    const availableSlots = timeSlotInfo ? timeSlotInfo.RemainingSlots : schedule.SlotCapacity
    
    return {
      time: `${scheduleTime.StartTime} - ${scheduleTime.EndTime}`,
      availableSlots: availableSlots,
      totalSlots: schedule.SlotCapacity
    }
  }

  const fetchScheduleSlots = async (scheduleId, date) => {
    try {
      // Use the actual selected date
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      
      console.log('Fetching slots for:', { scheduleId, dateString })
      
      const response = await axios.get('/api/schedule-remaining-slots', {
        params: {
          schedule_id: scheduleId,
          date: dateString
        }
      })
      
      console.log('Slot API response:', response.data)
      
      const slotKey = `${scheduleId}_${dateString}`
      setScheduleSlotCounts(prev => ({
        ...prev,
        [slotKey]: response.data
      }))
      
      return response.data
    } catch (error) {
      console.error('Error fetching schedule slots:', error)
      console.error('Error details:', error.response?.data)
      return null
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
      
      // Only check for recurring schedules - StartDate is just when schedule becomes available
      if (schedule.IsRecurring && schedule.RecurrencePattern) {
        const pattern = schedule.RecurrencePattern.toLowerCase().trim()
        
        // Handle "every [day]" patterns with precise matching
        if (pattern.startsWith('every ')) {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          
          // Extract the day part after "every "
          const dayPart = pattern.replace('every ', '').trim()
          
          // Find which day this schedule is for using exact word matching
          let scheduleDayOfWeek = -1
          for (let i = 0; i < dayNames.length; i++) {
            // Use word boundary matching to ensure exact day name match
            const dayRegex = new RegExp(`\\b${dayNames[i]}\\b`, 'i')
            if (dayRegex.test(dayPart)) {
              scheduleDayOfWeek = i
              break // Only match the first day found
            }
          }
          
          // Check if the date falls on the correct day of week AND is after/on start date
          if (scheduleDayOfWeek !== -1 && date.getDay() === scheduleDayOfWeek && date >= scheduleDate) {
            return true
          }
        }
        // Handle "[ordinal] [day] of every month" patterns (e.g., "Second Saturday of every month")
        else if (pattern.includes('of every month')) {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          
          // Find which day this schedule is for
          let scheduleDayOfWeek = -1
          for (let i = 0; i < dayNames.length; i++) {
            const dayRegex = new RegExp(`\\b${dayNames[i]}\\b`, 'i')
            if (dayRegex.test(pattern)) {
              scheduleDayOfWeek = i
              break
            }
          }
          
          if (scheduleDayOfWeek !== -1 && date.getDay() === scheduleDayOfWeek && date >= scheduleDate) {
            // Check if this is the correct occurrence of the day in the month
            const dayOfMonth = date.getDate()
            const weekOfMonth = Math.ceil(dayOfMonth / 7)
            
            // Map ordinal words to numbers
            const ordinalMap = {
              'first': 1,
              'second': 2, 
              'third': 3,
              'fourth': 4,
              'fifth': 5
            }
            
            // Find the ordinal in the pattern
            for (const [ordinal, number] of Object.entries(ordinalMap)) {
              if (pattern.includes(ordinal)) {
                return weekOfMonth === number
              }
            }
          }
        }
      } else {
        // For non-recurring schedules, only match the exact start date
        if (isSameDay(scheduleDate, date)) {
          return true
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
    setSelectedSchedule(null) // Reset schedule selection when month changes
  }

  const selectDate = async (date) => {
    const schedulesForDate = getSchedulesForDate(date)
    if (schedulesForDate.length > 0) {
      setSelectedDate(date)
      setSelectedSchedule(null) // Reset schedule selection when date changes
      setSlotsLoading(true)
      
      try {
        // Fetch real slot counts for all schedules on this date
        const promises = schedulesForDate.map(schedule => 
          fetchScheduleSlots(schedule.ScheduleID, date)
        )
        
        await Promise.all(promises)
      } catch (error) {
        console.error('Error fetching slots:', error)
      } finally {
        setSlotsLoading(false)
      }
    }
  }

  const getSlotAvailabilityText = (schedule, date) => {
    if (!date) return `${schedule.SlotCapacity}/${schedule.SlotCapacity} left`
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`
    const slotKey = `${schedule.ScheduleID}_${dateKey}`
    const slotInfo = scheduleSlotCounts[slotKey]
    
    if (slotInfo && slotInfo.time_slots && slotInfo.time_slots.length > 0) {
      // Get the first time slot info to show availability
      const firstTimeSlot = slotInfo.time_slots[0]
      const available = firstTimeSlot.RemainingSlots
      const total = firstTimeSlot.SlotCapacity
      return `${available}/${total} left`
    }
    
    return `${schedule.SlotCapacity}/${schedule.SlotCapacity} left`
  }

  // Calculate form canvas height based on element positions
  const calculateFormHeight = () => {
    if (!formConfig?.form_elements || formConfig.form_elements.length === 0) {
      return 800
    }

    let maxBottom = 0
    formConfig.form_elements.forEach(element => {
      const y = element.properties?.y || 0
      const height = element.properties?.height || 40
      const elementBottom = y + height
      if (elementBottom > maxBottom) {
        maxBottom = elementBottom
      }
    })

    // Add some padding at the bottom
    return Math.max(maxBottom + 100, 800)
  }

  // Simple stacked renderer: render fields in a clean vertical layout (not like the builder canvas)
  const renderSimpleField = (field, index) => {
    console.log(`Rendering field ${index}:`, field)
    
    // Skip fields without proper type or empty fields
    if (!field || !field.type) {
      console.log(`Skipping field ${index} - no type`)
      return null
    }
    
    const fieldKey = `field_${field.InputFieldID || index}`
    const value = formData[fieldKey] || ''

    const setValue = (v) => setFormData(prev => ({ ...prev, [fieldKey]: v }))

    const label = field.label || field.properties?.text
    const required = !!field.required

    // Normalize options if string
    const getOptions = () => {
      if (!field.options) return []
      if (Array.isArray(field.options)) return field.options
      try { const arr = JSON.parse(field.options); return Array.isArray(arr) ? arr : [] } catch { /* ignore */ }
      if (typeof field.options === 'string') return field.options.split(',').map(s => s.trim()).filter(Boolean)
      return []
    }

    switch (field.type) {
      case 'container':
        // Containers are just visual groupings in the builder, skip them in the simple view
        return null
      case 'heading':
        if (!label) return null
        return (
          <h3 key={index} className="text-lg font-semibold text-gray-900">{label}</h3>
        )
      case 'paragraph':
      case 'label':
        if (!label) return null
        return (
          <p key={index} className="text-sm text-gray-700">{label}</p>
        )
      case 'textarea':
        return (
          <div key={index} className="space-y-1">
            {label && (
              <label className="text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
            )}
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={field.properties?.rows || 3}
              placeholder={field.placeholder}
              required={required}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        )
      case 'select':
        return (
          <div key={index} className="space-y-1">
            {label && (
              <label className="text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
            )}
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required={required}
            >
              <option value="">Select an option...</option>
              {getOptions().map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )
      case 'radio':
        return (
          <div key={index} className="space-y-1">
            {label && (
              <div className="text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
              </div>
            )}
            <div className="space-y-2">
              {getOptions().map((opt, i) => (
                <label key={i} className="flex items-center text-sm text-gray-700">
                  <input
                    type="radio"
                    name={fieldKey}
                    className="mr-2"
                    value={opt}
                    checked={value === opt}
                    onChange={(e) => setValue(e.target.value)}
                    required={required}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        )
      case 'checkbox':
        return (
          <label key={index} className="flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              className="mr-2"
              checked={!!value}
              onChange={(e) => setValue(e.target.checked)}
              required={required}
            />
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )
      case 'date':
      case 'email':
      case 'tel':
      case 'number':
      case 'text':
      default:
        return (
          <div key={index} className="space-y-1">
            {label && (
              <label className="text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
            )}
            <input
              type={field.type === 'tel' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={field.placeholder}
              required={required}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        )
    }
  }

  const renderFormField = (field, index) => {
    // Use InputFieldID as the key, not index
    const fieldKey = `field_${field.InputFieldID || index}`
    const value = formData[fieldKey] || ''

    const updateField = (newValue) => {
      setFormData(prev => ({
        ...prev,
        [fieldKey]: newValue
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
    
    console.log(`Field ${index} (${field.type}):`, {
      field,
      properties: field.properties,
      x, y, width, height
    })

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
                htmlFor={fieldKey} 
                style={labelStyles}
              >
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <input
              type={field.type}
              id={fieldKey}
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
                htmlFor={fieldKey} 
                style={labelStyles}
              >
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <textarea
              id={fieldKey}
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
                htmlFor={fieldKey} 
                style={labelStyles}
              >
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <select
              id={fieldKey}
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
                      name={fieldKey}
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
                htmlFor={fieldKey} 
                style={labelStyles}
              >
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <input
              type="date"
              id={fieldKey}
              value={value}
              onChange={(e) => updateField(e.target.value)}
              required={field.required}
              style={inputStyles}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
        )

      case 'heading':
        // Define font sizes for each heading level (exactly like form builder)
        const getHeadingStyles = (headingSize) => {
          const sizes = {
            'h1': { fontSize: '2rem', fontWeight: '700' },      // 32px, bold
            'h2': { fontSize: '1.5rem', fontWeight: '600' },    // 24px, semibold
            'h3': { fontSize: '1.25rem', fontWeight: '600' },   // 20px, semibold
            'h4': { fontSize: '1rem', fontWeight: '500' }       // 16px, medium
          }
          return sizes[headingSize] || sizes['h2']
        }
        
        const HeadingTag = field.properties?.size || 'h2'
        const headingStyles = getHeadingStyles(HeadingTag)
        
        return (
          <div key={index} style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            display: 'flex',
            alignItems: 'center'
          }}>
            {React.createElement(HeadingTag, {
              style: {
                textAlign: field.properties?.align || 'left',
                color: field.properties?.color || '#000000',
                margin: 0,
                lineHeight: '1.2',
                fontSize: headingStyles.fontSize,
                fontWeight: headingStyles.fontWeight,
                width: '100%',
                padding: '0 8px'
              }
            }, field.properties?.text || field.label)}
          </div>
        )
        
      case 'paragraph':
        return (
          <div 
            key={index} 
            style={{
              ...commonStyles,
              height: `${height}px`,
              display: 'flex',
              alignItems: 'flex-start',
              lineHeight: '1.4',
              padding: '8px'
            }}
          >
            {field.properties?.text || field.label}
          </div>
        )
        
      case 'label':
        return (
          <div 
            key={index} 
            style={{
              ...commonStyles,
              fontSize: `${textSize}px`,
              height: `${height}px`,
              display: 'flex',
              alignItems: 'center',
              padding: '8px'
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{
        maxHeight: '90vh'
      }}>
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
              <span className="ml-2 text-sm font-medium">Requirements</span>
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
                      {slotsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-3 text-gray-600">Loading slot availability...</span>
                        </div>
                      ) : selectedSchedule ? (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">
                              Select Time Slot
                            </h5>
                            <button
                              onClick={() => setSelectedSchedule(null)}
                              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              ← Back to schedules
                            </button>
                          </div>
                          <div className="space-y-2">
                            {selectedSchedule.times?.map((scheduleTime) => {
                              const timeDisplay = formatScheduleTimeDisplay(scheduleTime, selectedSchedule)
                              const isAvailable = timeDisplay.availableSlots > 0
                              return (
                                <div
                                  key={scheduleTime.ScheduleTimeID}
                                  onClick={() => isAvailable ? handleScheduleTimeSelect(scheduleTime) : null}
                                  className={`p-3 border rounded-lg transition-all ${
                                    isAvailable
                                      ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer group'
                                      : 'border-red-200 bg-red-50 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center text-sm text-gray-700 mb-1">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span className="font-medium">{timeDisplay.time}</span>
                                      </div>
                                      <div className="flex items-center text-sm mb-1">
                                        <Users className="w-4 h-4 mr-2" />
                                        <span className={isAvailable ? 'text-gray-600' : 'text-red-600'}>
                                          {isAvailable
                                            ? `${timeDisplay.availableSlots} of ${timeDisplay.totalSlots} slots available`
                                            : 'Fully booked'
                                          }
                                        </span>
                                      </div>
                                      {selectedSchedule.fees && selectedSchedule.fees.length > 0 && (
                                        <div className="text-xs text-gray-500">
                                          {formatScheduleDisplay(selectedSchedule).fees}
                                        </div>
                                      )}
                                    </div>
                                    {isAvailable && (
                                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">
                            Available Schedules for {selectedDate.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </h5>
                          <div className="space-y-2">
                            {getSchedulesForDate(selectedDate).map((schedule) => {
                              const displayInfo = formatScheduleDisplay(schedule)
                              
                              // Check if schedule has any available slots
                              const year = selectedDate.getFullYear()
                              const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
                              const day = String(selectedDate.getDate()).padStart(2, '0')
                              const dateKey = `${year}-${month}-${day}`
                              const slotKey = `${schedule.ScheduleID}_${dateKey}`
                              const slotInfo = scheduleSlotCounts[slotKey]
                              
                              // Check if any time slot has remaining slots
                              let hasAvailableSlots = true // Default to available
                              if (slotInfo && slotInfo.time_slots && slotInfo.time_slots.length > 0) {
                                // If we have slot data, check if any time slot has remaining slots
                                hasAvailableSlots = slotInfo.time_slots.some(ts => ts.RemainingSlots > 0)
                              } else {
                                // Fallback to schedule capacity if slot info not loaded yet
                                hasAvailableSlots = schedule.SlotCapacity > 0
                              }
                              
                              console.log('Schedule availability check:', {
                                scheduleId: schedule.ScheduleID,
                                slotInfo,
                                hasAvailableSlots,
                                scheduleCapacity: schedule.SlotCapacity
                              })
                              
                              return (
                                <div
                                  key={`${schedule.ScheduleID}-${selectedDate.toISOString()}`}
                                  onClick={() => hasAvailableSlots ? handleScheduleSelect(schedule) : null}
                                  className={`p-3 border rounded-lg transition-all ${
                                    hasAvailableSlots 
                                      ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer group'
                                      : 'border-red-200 bg-red-50 cursor-not-allowed opacity-75'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center text-sm text-gray-700 mb-1">
                                        <span className="font-medium">Schedule #{schedule.ScheduleID}</span>
                                        {schedule.IsRecurring && schedule.RecurrencePattern && (
                                          <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                            hasAvailableSlots 
                                              ? 'text-blue-600 bg-blue-50' 
                                              : 'text-gray-500 bg-gray-100'
                                          }`}>
                                            {schedule.RecurrencePattern}
                                          </span>
                                        )}
                                        {!hasAvailableSlots && (
                                          <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded font-medium">
                                            Fully Booked
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center text-sm text-gray-600 mb-1">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span>
                                          {schedule.times?.length === 1
                                            ? `${schedule.times[0].StartTime} - ${schedule.times[0].EndTime}`
                                            : `${schedule.times?.length || 0} time slots available`
                                          }
                                        </span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Users className="w-4 mr-2" />
                                        <span className={hasAvailableSlots ? 'text-gray-600' : 'text-red-600'}>
                                          {getSlotAvailabilityText(schedule, selectedDate)}
                                        </span>
                                        {displayInfo.fees !== 'No fees' && (
                                          <span className="ml-4">
                                            {displayInfo.fees}
                                          </span>
                                        )}
                                        {isApprovedMember() && selectedService && selectedService.member_discount_type && (
                                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                                            Member Discount: {selectedService.member_discount_type === 'percentage' 
                                              ? `${selectedService.member_discount_value}% OFF`
                                              : `₱${selectedService.member_discount_value} OFF`
                                            }
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {hasAvailableSlots ? (
                                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    ) : (
                                      <div className="w-4 h-4 text-gray-300">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.3"/>
                                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
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
                  <h3 className="text-lg font-medium text-gray-900">Requirements</h3>
                  <p className="text-sm text-gray-600">
                    {selectedService?.ServiceName}
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
                  <span className="ml-3 text-gray-600">Loading requirements...</span>
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
<div>
                  {/* Requirements */}
                  {formConfig.requirements && formConfig.requirements.length > 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                      <h4 className="font-medium text-yellow-800 mb-3">Requirements for this Sacrament</h4>
                      <ul className="list-disc list-inside space-y-2">
                        {formConfig.requirements.map((req, index) => (
                          <li key={index} className={`text-sm ${req.is_mandatory ? 'text-yellow-800' : 'text-yellow-700'}`}>
                            {req.description}
                            {req.is_mandatory && <span className="font-medium"> (Required)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-8 mb-6">
                      <p className="text-gray-600">No specific requirements have been set for this sacrament.</p>
                    </div>
                  )}

                  {/* Custom Form Fields - Only render if not a staff form */}
                  {selectedService && !selectedService.isStaffForm && formConfig.form_elements && formConfig.form_elements.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-4">Fill out the required information</h4>
                      <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        {formConfig.form_elements.map((field, index) => renderSimpleField(field, index)).filter(Boolean)}
                      </div>
                    </div>
                  )}

                  {/* Application Summary */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                    <h4 className="font-medium text-blue-800 mb-3">Application Summary</h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      <div><span className="font-medium">Service:</span> {selectedService?.ServiceName}</div>
                      <div><span className="font-medium">Date:</span> {selectedDate?.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</div>
                      <div><span className="font-medium">Time:</span> {selectedScheduleTime?.StartTime} - {selectedScheduleTime?.EndTime}</div>
                      <div><span className="font-medium">Church:</span> {church?.ChurchName}</div>
                    </div>
                  </div>

                  {/* Membership Error Alert */}
                  {membershipError && (
                    <div className="mb-6">
                      <Alert 
                        type="error"
                        title="Membership Required"
                        message={membershipError}
                        onClose={() => setMembershipError(null)}
                        autoClose={false}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                      <p className="text-red-800 text-sm">{submitError}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={selectedService && !selectedService.isStaffForm && formConfig.form_elements && formConfig.form_elements.length > 0 ? handleFormSubmit : handleApplicationSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Success Modal - minimal animated check with auto-dismiss */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl px-8 py-7 flex flex-col items-center gap-3 animate-[fadeIn_0.18s_ease-out]">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 text-green-500" viewBox="0 0 52 52">
                <circle className="success-ring" cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path className="success-check" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27 l8 8 l16 -16" />
              </svg>
            </div>
            <div className="text-base font-semibold text-gray-900">Application submitted</div>
          </div>
          <style jsx global>{`
            @keyframes drawRing { to { stroke-dashoffset: 0; } }
            @keyframes drawCheck { to { stroke-dashoffset: 0; } }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
            .success-ring { stroke-dasharray: 151; stroke-dashoffset: 151; animation: drawRing 450ms ease-out forwards; }
            .success-check { stroke-dasharray: 48; stroke-dashoffset: 48; animation: drawCheck 350ms 220ms ease-out forwards; }
          `}</style>
        </div>
      )}
    </div>
  )
}

export default SacramentApplicationModal
