'use client'

import React from 'react'

const FormContainer = ({ formConfiguration, formData, setFormData }) => {
  
  // Helper function to update form field values
  const updateField = (fieldKey, newValue) => {
    console.log('Form field updated:', fieldKey, newValue)
    setFormData(prev => ({
      ...prev,
      [fieldKey]: newValue
    }))
  }

  // Calculate canvas height exactly like FormRenderer
  const calculateCanvasHeight = () => {
    if (!formConfiguration?.form_elements || formConfiguration.form_elements.length === 0) {
      return 800
    }

    let maxBottom = 0
    formConfiguration.form_elements.forEach(element => {
      const containerElement = formConfiguration.form_elements.find(el => el.id === element.containerId)
      const isInsideContainer = !!containerElement
      
      // Calculate absolute position using properties if available
      const y = element.properties?.y || element.y || 0
      const height = element.properties?.height || element.height || 40
      
      const absoluteY = isInsideContainer 
        ? ((containerElement.properties?.y || containerElement.y || 0) + 
           (containerElement.properties?.padding || containerElement.padding || 30) + y)
        : y
      
      const elementBottom = absoluteY + height
      if (elementBottom > maxBottom) {
        maxBottom = elementBottom
      }
    })

    // Add some padding at the bottom
    return Math.max(maxBottom + 100, 800)
  }

  // Render individual form elements with proper styling
  const renderFormElement = (element) => {
    const fieldKey = element.elementId || `field_${element.InputFieldID || element.id}`
    const value = formData[fieldKey] || ''

    // Get positioning from saved properties - USE EXACT SAVED VALUES
    const x = element.properties?.x || element.x || 0
    const y = element.properties?.y || element.y || 0
    const width = element.properties?.width || element.width || 300
    const height = element.properties?.height || element.height || 40
    const textAlign = element.properties?.align || element.textAlign || 'left'
    const textColor = element.properties?.color || element.textColor || '#374151'

    // Common styles for absolute positioning
    const commonStyles = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      fontSize: '14px',
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

    switch (element.type) {
      case 'container':
        // Render container as background - should be rendered first
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: element.backgroundColor || element.properties?.backgroundColor || '#ffffff',
              borderColor: element.borderColor || element.properties?.borderColor || '#e5e7eb',
              borderWidth: `${element.borderWidth || element.properties?.borderWidth || 2}px`,
              borderStyle: 'solid',
              borderRadius: `${element.borderRadius || element.properties?.borderRadius || 8}px`,
              zIndex: element.zIndex || 0
            }}
          />
        )

      case 'heading':
        // Define font sizes for each heading level
        const getHeadingStyles = (headingSize) => {
          const sizes = {
            'h1': { fontSize: '2rem', fontWeight: '700' },
            'h2': { fontSize: '1.5rem', fontWeight: '600' },
            'h3': { fontSize: '1.25rem', fontWeight: '600' },
            'h4': { fontSize: '1rem', fontWeight: '500' }
          }
          return sizes[headingSize] || sizes['h2']
        }
        
        const HeadingTag = element.properties?.size || element.headingSize || 'h2'
        const headingStyles = getHeadingStyles(HeadingTag)
        
        return (
          <div key={element.id} style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            display: 'flex',
            alignItems: 'center',
            zIndex: element.zIndex || 1
          }}>
            {React.createElement(HeadingTag, {
              style: {
                textAlign: textAlign,
                color: textColor,
                margin: 0,
                lineHeight: '1.2',
                fontSize: headingStyles.fontSize,
                fontWeight: headingStyles.fontWeight,
                width: '100%',
                padding: '0 8px'
              }
            }, element.properties?.text || element.content || element.label)}
          </div>
        )
        
      case 'paragraph':
        return (
          <div 
            key={element.id} 
            style={{
              ...commonStyles,
              height: `${height}px`,
              display: 'flex',
              alignItems: 'flex-start',
              lineHeight: '1.4',
              padding: '8px',
              zIndex: element.zIndex || 1
            }}
          >
            {element.properties?.text || element.content || element.label}
          </div>
        )

      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <div key={element.id} style={{ position: 'relative', zIndex: element.zIndex || 1 }}>
            {element.label && (
              <label 
                htmlFor={fieldKey} 
                style={labelStyles}
              >
                {element.label}
                {element.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <input
              type={element.type}
              id={fieldKey}
              value={value}
              onChange={(e) => updateField(fieldKey, e.target.value)}
              placeholder={element.placeholder}
              required={element.required}
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
          <div key={element.id} style={{ position: 'relative', zIndex: element.zIndex || 1 }}>
            {element.label && (
              <label 
                htmlFor={fieldKey} 
                style={labelStyles}
              >
                {element.label}
                {element.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <textarea
              id={fieldKey}
              value={value}
              onChange={(e) => updateField(fieldKey, e.target.value)}
              placeholder={element.placeholder}
              required={element.required}
              rows={element.properties?.rows || element.rows || 3}
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
          <div key={element.id} style={{ position: 'relative', zIndex: element.zIndex || 1 }}>
            {element.label && (
              <label 
                htmlFor={fieldKey} 
                style={labelStyles}
              >
                {element.label}
                {element.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <select
              id={fieldKey}
              value={value}
              onChange={(e) => updateField(fieldKey, e.target.value)}
              required={element.required}
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
              {(element.options || []).map((option, optIndex) => (
                <option key={optIndex} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )

      case 'radio':
        return (
          <div key={element.id} style={{ zIndex: element.zIndex || 1 }}>
            {element.label && (
              <div style={labelStyles}>
                {element.label}
                {element.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </div>
            )}
            <div style={{
              ...commonStyles,
              top: `${y}px`
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(element.options || []).map((option, optIndex) => (
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
                      onChange={(e) => updateField(fieldKey, e.target.value)}
                      required={element.required}
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
          <div key={element.id} style={{ zIndex: element.zIndex || 1 }}>
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
                onChange={(e) => updateField(fieldKey, e.target.checked)}
                required={element.required}
                style={{ 
                  marginRight: '12px',
                  transform: 'scale(1.1)'
                }}
              />
              <span>
                {element.label}
                {element.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </span>
            </label>
          </div>
        )

      case 'date':
        return (
          <div key={element.id} style={{ position: 'relative', zIndex: element.zIndex || 1 }}>
            {element.label && (
              <label 
                htmlFor={fieldKey} 
                style={labelStyles}
              >
                {element.label}
                {element.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
            )}
            <input
              type="date"
              id={fieldKey}
              value={value}
              onChange={(e) => updateField(fieldKey, e.target.value)}
              required={element.required}
              style={inputStyles}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        )

      case 'label':
        return (
          <div 
            key={element.id} 
            style={{
              ...commonStyles,
              height: `${height}px`,
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              zIndex: element.zIndex || 1
            }}
          >
            {element.properties?.text || element.label}
          </div>
        )

      default:
        return null
    }
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
      {/* Main container with absolute positioning - matches form builder exactly */}
      <div
        className="relative bg-white overflow-visible"
        style={{
          height: `${calculateCanvasHeight()}px`,
          minWidth: '800px'
        }}
      >
        {/* Render ALL form elements exactly as positioned - containers first, then others */}
        {formConfiguration.form_elements
          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) // Sort by z-index to ensure proper layering
          .map((element) => {
            // Calculate absolute position exactly like form builder and FormRenderer
            const containerElement = formConfiguration.form_elements?.find(el => el.id === element.containerId)
            const isInsideContainer = !!containerElement
            
            // For elements inside containers, calculate absolute position
            let absoluteX, absoluteY
            
            if (isInsideContainer) {
              // Use container position + padding + element position
              absoluteX = (containerElement.properties?.x || containerElement.x || 0) + 
                         (containerElement.properties?.padding || containerElement.padding || 30) + 
                         (element.properties?.x || element.x || 0)
              absoluteY = (containerElement.properties?.y || containerElement.y || 0) + 
                         (containerElement.properties?.padding || containerElement.padding || 30) + 
                         (element.properties?.y || element.y || 0)
            } else {
              // Use direct position
              absoluteX = element.properties?.x || element.x || 0
              absoluteY = element.properties?.y || element.y || 0
            }

            // Create a modified element with absolute positioning
            const absoluteElement = {
              ...element,
              x: absoluteX,
              y: absoluteY
            }

            return renderFormElement(absoluteElement)
          })}
      </div>
    </div>
  )
}

export default FormContainer
