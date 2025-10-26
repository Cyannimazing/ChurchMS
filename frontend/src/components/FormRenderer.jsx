'use client'

import React, { useState, useEffect } from 'react'
import axios from '@/lib/axios'

const FormRenderer = ({ formConfiguration, formData = {}, updateField, onFormDataChange, initialData = {}, readOnly = false, appointmentId = null, onSubmissionStatusChange = null }) => {
  const [localFormData, setLocalFormData] = useState(formData || initialData)
  const [errors, setErrors] = useState({})
  const [submissionStatuses, setSubmissionStatuses] = useState({})
  const [isUpdatingSubmission, setIsUpdatingSubmission] = useState({})

  // Update parent component when form data changes
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(localFormData)
    }
  }, [localFormData, onFormDataChange])

  // Update local form data when external formData changes
  useEffect(() => {
    setLocalFormData(formData)
  }, [formData])

  // Initialize submission statuses from requirements and sub-services
  useEffect(() => {
    if (formConfiguration?.requirements || formConfiguration?.sub_services) {
      const statuses = {}
      
      // Initialize requirement statuses
      formConfiguration.requirements?.forEach(req => {
        statuses[`req_${req.id}`] = req.isSubmitted || false
      })
      
      // Initialize sub-service statuses
      formConfiguration.sub_services?.forEach(subService => {
        statuses[`sub_${subService.id}`] = subService.isCompleted || false
        
        // Initialize sub-service requirement statuses
        subService.requirements?.forEach(req => {
          statuses[`subreq_${req.id}`] = req.isSubmitted || false
        })
      })
      
      setSubmissionStatuses(statuses)
    }
  }, [formConfiguration?.requirements, formConfiguration?.sub_services])

  // Handle requirement submission checkbox change
  const handleRequirementSubmissionChange = async (requirementId, isSubmitted) => {
    if (!appointmentId) {
      console.error('No appointment ID provided')
      return
    }

    const statusKey = `req_${requirementId}`
    setIsUpdatingSubmission(prev => ({ ...prev, [statusKey]: true }))

    try {
      const response = await axios.put(`/api/appointments/${appointmentId}/requirement-submission`, {
        requirement_id: requirementId,
        is_submitted: isSubmitted
      })

      if (response.data) {
        setSubmissionStatuses(prev => ({
          ...prev,
          [statusKey]: isSubmitted
        }))
        
        // Notify parent of submission status change
        if (onSubmissionStatusChange) {
          onSubmissionStatusChange(requirementId, isSubmitted, 'requirement')
        }
        
        console.log('Requirement submission updated:', response.data)
      }
    } catch (error) {
      console.error('Failed to update requirement submission:', error)
    } finally {
      setIsUpdatingSubmission(prev => ({ ...prev, [statusKey]: false }))
    }
  }

  // Handle sub-service completion checkbox change
  const handleSubServiceCompletionChange = async (subServiceId, isCompleted) => {
    if (!appointmentId) {
      console.error('No appointment ID provided')
      return
    }

    const statusKey = `sub_${subServiceId}`
    setIsUpdatingSubmission(prev => ({ ...prev, [statusKey]: true }))

    try {
      const response = await axios.put(`/api/appointments/${appointmentId}/sub-service-completion`, {
        sub_service_id: subServiceId,
        is_completed: isCompleted
      })

      if (response.data) {
        setSubmissionStatuses(prev => ({
          ...prev,
          [statusKey]: isCompleted
        }))
        console.log('Sub-service completion updated:', response.data)
      }
    } catch (error) {
      console.error('Failed to update sub-service completion:', error)
    } finally {
      setIsUpdatingSubmission(prev => ({ ...prev, [statusKey]: false }))
    }
  }

  // Handle sub-service requirement submission checkbox change
  const handleSubServiceRequirementSubmissionChange = async (subServiceRequirementId, isSubmitted) => {
    if (!appointmentId) {
      console.error('No appointment ID provided')
      return
    }

    const statusKey = `subreq_${subServiceRequirementId}`
    setIsUpdatingSubmission(prev => ({ ...prev, [statusKey]: true }))

    try {
      const response = await axios.put(`/api/appointments/${appointmentId}/sub-service-requirement-submission`, {
        sub_service_requirement_id: subServiceRequirementId,
        is_submitted: isSubmitted
      })

      if (response.data) {
        setSubmissionStatuses(prev => ({
          ...prev,
          [statusKey]: isSubmitted
        }))
        
        // Notify parent of submission status change
        if (onSubmissionStatusChange) {
          onSubmissionStatusChange(subServiceRequirementId, isSubmitted, 'sub_service_requirement')
        }
        
        console.log('Sub-service requirement submission updated:', response.data)
      }
    } catch (error) {
      console.error('Failed to update sub-service requirement submission:', error)
    } finally {
      setIsUpdatingSubmission(prev => ({ ...prev, [statusKey]: false }))
    }
  }

  const handleInputChange = (fieldId, value) => {
    // Use updateField if provided (for external state management)
    if (updateField) {
      updateField(fieldId, value)
    } else {
      // Otherwise manage local state
      setLocalFormData(prev => ({
        ...prev,
        [fieldId]: value
      }))
    }
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    formConfiguration?.form_elements?.forEach(element => {
      if (element.required && !['heading', 'paragraph', 'container'].includes(element.type)) {
        const fieldKey = element.elementId || element.id
        const value = formData[fieldKey]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[fieldKey] = `${element.label} is required`
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const renderFormElement = (element, absoluteX, absoluteY) => {
    const fieldKey = element.elementId || element.id
    const commonInputProps = {
      className: "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    }

    switch (element.type) {
      case 'container':
        return (
          <div 
            key={element.id}
            className="w-full h-full"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'transparent',
              borderWidth: `${element.borderWidth || 2}px`,
              borderStyle: 'solid',
              borderRadius: `${element.borderRadius || 8}px`,
              padding: `${element.padding || 30}px`,
              boxSizing: 'border-box'
            }}
          >
            {/* Container content will be positioned absolutely inside */}
          </div>
        )
      
      case 'heading':
        const HeadingTag = element.headingSize || element.size || 'h2'
        
        // Define font sizes for each heading level - exactly like form builder
        const getHeadingStyles = (headingSize) => {
          const sizes = {
            'h1': { fontSize: '2rem', fontWeight: '700' },      // 32px, bold
            'h2': { fontSize: '1.5rem', fontWeight: '600' },    // 24px, semibold
            'h3': { fontSize: '1.25rem', fontWeight: '600' },   // 20px, semibold
            'h4': { fontSize: '1rem', fontWeight: '500' }       // 16px, medium
          }
          return sizes[headingSize] || sizes['h2']
        }
        
        const headingStyles = getHeadingStyles(HeadingTag)
        
        return (
          <div key={element.id} className="w-full h-full flex items-center">
            <HeadingTag
              className={`w-full px-2 py-1 rounded select-none`}
              style={{ 
                textAlign: element.textAlign || element.align || 'left',
                color: element.textColor || element.color || '#000000',
                margin: 0,
                lineHeight: '1.2',
                userSelect: 'none',
                fontSize: headingStyles.fontSize,
                fontWeight: headingStyles.fontWeight
              }}
            >
              {element.content || element.text || 'Heading Text'}
            </HeadingTag>
          </div>
        )
      
      case 'paragraph':
        return (
          <div key={element.id} className="w-full h-full">
            <p
              className="w-full h-full px-2 py-1 rounded overflow-hidden"
              style={{ 
                textAlign: element.textAlign || 'left',
                color: element.textColor || '#000000',
                margin: 0,
                lineHeight: '1.4'
              }}
            >
              {element.content || 'Paragraph text content'}
            </p>
          </div>
        )
      
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
        return (
          <div key={element.id}>
            {/* Element Label - only show if not container/heading/paragraph */}
            {element.label && (
              <div className="text-xs font-medium text-gray-700 mb-1">
                {(() => {
                  const originalLabel = element.label;
                  const cleanedLabel = element.label.replace(/0 a 0$/, '').replace(/0+$/, '').trim();
                  console.log('Label rendering:', { originalLabel, cleanedLabel, elementId: element.elementId || element.id, elementType: element.type, required: element.required });
                  return cleanedLabel;
                })()}
                {Boolean(element.required) && <span className="text-red-500 ml-1">*</span>}
              </div>
            )}
            
            {/* Form Element */}
            <div className="relative h-full">
              <input
                type={element.type}
                placeholder={element.placeholder}
                required={element.required}
                value={formData[fieldKey] || ''}
                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                {...commonInputProps}
              />
            </div>
            {errors[fieldKey] && (
              <p className="text-red-500 text-xs mt-1">{errors[fieldKey]}</p>
            )}
          </div>
        )
      
      case 'textarea':
        return (
          <div key={element.id}>
            {element.label && (
              <div className="text-xs font-medium text-gray-700 mb-1">
                {element.label.replace(/0 a 0$/, '').replace(/0+$/, '').trim()}
                {Boolean(element.required) && <span className="text-red-500 ml-1">*</span>}
              </div>
            )}
            
            <div className="relative h-full">
              <textarea
                placeholder={element.placeholder}
                required={element.required}
                style={{ height: element.height ? `${element.height}px` : 'auto' }}
                value={formData[fieldKey] || ''}
                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                {...commonInputProps}
              />
            </div>
            {errors[fieldKey] && (
              <p className="text-red-500 text-xs mt-1">{errors[fieldKey]}</p>
            )}
          </div>
        )
      
      case 'select':
        return (
          <div key={element.id}>
            {element.label && (
              <div className="text-xs font-medium text-gray-700 mb-1">
                {element.label.replace(/0 a 0$/, '').replace(/0+$/, '').trim()}
                {Boolean(element.required) && <span className="text-red-500 ml-1">*</span>}
              </div>
            )}
            
            <div className="relative h-full">
              <select 
                value={formData[fieldKey] || ''}
                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                required={element.required}
                {...commonInputProps}
              >
                <option value="">Select an option...</option>
                {element.options?.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
            {errors[fieldKey] && (
              <p className="text-red-500 text-xs mt-1">{errors[fieldKey]}</p>
            )}
          </div>
        )
      
      case 'checkbox':
        return (
          <div key={element.id}>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                required={element.required}
                checked={formData[fieldKey] || false}
                onChange={(e) => handleInputChange(fieldKey, e.target.checked)}
                className="mr-2"
              />
              {element.label.replace(/0 a 0$/, '').replace(/0+$/, '').trim()}
            </label>
            {errors[fieldKey] && (
              <p className="text-red-500 text-xs mt-1">{errors[fieldKey]}</p>
            )}
          </div>
        )
      
      case 'radio':
        return (
          <div key={element.id}>
            {element.label && (
              <div className="text-xs font-medium text-gray-700 mb-1">
                {element.label.replace(/0 a 0$/, '').replace(/0+$/, '').trim()}
                {Boolean(element.required) && <span className="text-red-500 ml-1">*</span>}
              </div>
            )}
            
            <div className="space-y-2">
              {element.options?.map((option, index) => (
                <label key={index} className="flex items-center text-sm">
                  <input
                    type="radio"
                    name={`radio_${fieldKey}`}
                    value={option}
                    required={element.required}
                    checked={formData[fieldKey] === option}
                    onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
            {errors[fieldKey] && (
              <p className="text-red-500 text-xs mt-1">{errors[fieldKey]}</p>
            )}
          </div>
        )
      
      default:
        return <div key={element.id}>Unknown element type</div>
    }
  }

  // Calculate canvas height exactly like form builder (lines 585-610)
  const calculateCanvasHeight = () => {
    if (!formConfiguration?.form_elements || formConfiguration.form_elements.length === 0) {
      return 800
    }

    let maxBottom = 0
    formConfiguration.form_elements.forEach(element => {
      const containerElement = formConfiguration.form_elements.find(el => el.id === element.containerId)
      const isInsideContainer = !!containerElement
      
      // Calculate absolute position
      const absoluteY = isInsideContainer 
        ? (containerElement.y + (containerElement.padding || 30) + element.y)
        : element.y
      
      const elementBottom = absoluteY + element.height
      if (elementBottom > maxBottom) {
        maxBottom = elementBottom
      }
    })

    // Add some padding at the bottom
    return Math.max(maxBottom + 100, 800)
  }

  if (!formConfiguration?.form_elements || formConfiguration.form_elements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No form configuration found for this sacrament service.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Render exactly like form builder - all elements with absolute positioning */}
      <div
        className="relative overflow-visible"
        style={{
          height: `${calculateCanvasHeight()}px`,
          minWidth: '600px'
        }}
      >
        {/* Render ALL form elements exactly as they are positioned in the database */}
        {formConfiguration.form_elements.map((element) => {
          // Calculate absolute position exactly like form builder (lines 1115-1121)
          const containerElement = formConfiguration.form_elements?.find(el => el.id === element.containerId)
          const isInsideContainer = !!containerElement
          
          // Calculate absolute position based on container position if inside one - exactly like form builder
          const absoluteX = isInsideContainer 
            ? (containerElement.x + (containerElement.padding || 30) + element.x)
            : element.x
          const absoluteY = isInsideContainer 
            ? (containerElement.y + (containerElement.padding || 30) + element.y)
            : element.y

          return (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: absoluteX,
                top: absoluteY,
                width: element.width,
                height: element.height,
                zIndex: element.zIndex || 1
              }}
            >
              {renderFormElement(element, absoluteX, absoluteY)}
            </div>
          )
        })}
      </div>

      {/* Requirements Section */}
      {formConfiguration.requirements && formConfiguration.requirements.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h4>
          <div className="space-y-3">
            {formConfiguration.requirements.map((req, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border">
                <span className={`inline-block w-2 h-2 rounded-full mt-2 ${req.needed ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">{req.description}</p>
                  <span className={`text-xs ${req.needed ? 'text-red-600' : 'text-blue-600'}`}>
                    {req.needed ? 'Needed' : 'Optional'}
                  </span>
                </div>
                {req.needed && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`requirement-${req.id}-${index}`}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      checked={submissionStatuses[`req_${req.id}`] || false}
                      disabled={isUpdatingSubmission[`req_${req.id}`] || false}
                      onChange={(e) => handleRequirementSubmissionChange(req.id, e.target.checked)}
                    />
                    <label htmlFor={`requirement-${req.id}-${index}`} className="text-sm text-gray-600">
                      {isUpdatingSubmission[`req_${req.id}`] ? 'Updating...' : 'Submitted'}
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Services as Requirements */}
      {formConfiguration.sub_services && formConfiguration.sub_services.length > 0 && (
        <>
          {formConfiguration.sub_services.map((subService, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg bg-white mt-3">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mt-1.5"></span>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{subService.name}</p>
                {subService.description && (
                  <p className="text-xs text-gray-600 mt-1">{subService.description}</p>
                )}
                <span className="text-xs text-blue-600">Required</span>
                
                {/* Sub-service Requirements */}
                {subService.requirements && subService.requirements.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {subService.requirements.map((req, reqIndex) => (
                      <div key={reqIndex} className="flex items-start space-x-3 p-2 bg-gray-50 rounded border ml-6">
                        <span className={`inline-block w-2 h-2 rounded-full mt-1.5 ${req.needed ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-700">{req.description}</p>
                          <span className={`text-xs ${req.needed ? 'text-orange-600' : 'text-blue-600'}`}>
                            {req.needed ? 'Needed' : 'Optional'}
                          </span>
                        </div>
                        {req.needed && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`subreq-${req.id}-${reqIndex}`}
                              className="h-3 w-3 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              checked={submissionStatuses[`subreq_${req.id}`] || false}
                              disabled={isUpdatingSubmission[`subreq_${req.id}`] || false}
                              onChange={(e) => handleSubServiceRequirementSubmissionChange(req.id, e.target.checked)}
                            />
                            <label htmlFor={`subreq-${req.id}-${reqIndex}`} className="text-xs text-gray-600">
                              {isUpdatingSubmission[`subreq_${req.id}`] ? 'Updating...' : 'Submitted'}
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`subservice-${subService.id}-${index}`}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  checked={submissionStatuses[`sub_${subService.id}`] || false}
                  disabled={isUpdatingSubmission[`sub_${subService.id}`] || false}
                  onChange={(e) => handleSubServiceCompletionChange(subService.id, e.target.checked)}
                />
                <label htmlFor={`subservice-${subService.id}-${index}`} className="text-sm text-gray-600">
                  {isUpdatingSubmission[`sub_${subService.id}`] ? 'Updating...' : 'Completed'}
                </label>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default FormRenderer
