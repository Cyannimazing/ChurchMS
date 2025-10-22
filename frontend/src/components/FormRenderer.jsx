'use client'

import React, { useState, useEffect } from 'react'

const FormRenderer = ({ formConfiguration, formData = {}, updateField, onFormDataChange, initialData = {}, readOnly = false }) => {
  const [localFormData, setLocalFormData] = useState(formData || initialData)
  const [errors, setErrors] = useState({})

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
                rows={element.rows || 3}
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
          <div className="space-y-2">
            {formConfiguration.requirements.map((req, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className={`inline-block w-2 h-2 rounded-full mt-2 ${req.mandatory ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                <div>
                  <p className="text-sm text-gray-700">{req.description}</p>
                  <span className={`text-xs ${req.mandatory ? 'text-red-600' : 'text-blue-600'}`}>
                    {req.mandatory ? 'Mandatory' : 'Optional'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FormRenderer
