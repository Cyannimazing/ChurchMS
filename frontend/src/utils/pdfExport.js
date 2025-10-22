/**
 * PDF Export Utility - Simple Clean Layout
 * Generates clean, simple PDFs matching the sacrament application form style
 */

/**
 * Render form element in a simple, clean layout
 * @param {Object} element - The form element
 * @param {Object} formData - The form data
 * @returns {string} HTML for the form element
 */
const renderSimpleFormElement = (element, formData) => {
  const fieldKey = element.elementId || element.id || `field_${element.InputFieldID}`;
  const value = formData[fieldKey] || element.answer || '';
  
  console.log('PDF Field:', { 
    fieldKey, 
    value, 
    elementType: element.type, 
    label: element.label,
    placeholder: element.placeholder
  });
  // Skip rendering containers and other layout elements
  if (!element.type || element.type === 'container') {
    return '';
  }

  const cleanLabel = (label) => {
    if (!label) return '';
    return label.replace(/0 a 0$/, '').replace(/0+$/, '').trim();
  };
  
  switch (element.type) {
    case 'heading':
      const headingText = element.properties?.text || element.content || element.text || element.label || '';
      if (!headingText) return '';
      
      return `
        <div style="margin: 20px 0 15px 0;">
          <h2 style="
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin: 0;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">${headingText}</h2>
        </div>
      `;
    
    case 'paragraph':
      const paragraphText = element.properties?.text || element.content || element.text || element.label || '';
      if (!paragraphText) return '';
      
      return `
        <div style="margin: 10px 0;">
          <p style="
            font-size: 12px;
            color: #6b7280;
            line-height: 1.4;
            margin: 0;
            text-align: center;
          ">${paragraphText}</p>
        </div>
      `;
    
    case 'text':
    case 'email':
    case 'tel':
    case 'number':
    case 'date':
      const label = cleanLabel(element.label);
      const displayValue = value || element.placeholder || '';
      
      if (!label) return '';
      
      return `
        <div style="margin: 12px 0;">
          <label style="
            display: block;
            font-size: 12px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 4px;
          ">
            ${label}
            ${element.required ? '<span style="color: #ef4444; margin-left: 2px;">*</span>' : ''}
          </label>
          <div style="
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background-color: #f9fafb;
            font-size: 12px;
            color: ${value ? '#111827' : '#9ca3af'};
            min-height: 32px;
            display: flex;
            align-items: center;
          ">
            ${displayValue}
          </div>
        </div>
      `;
    
    case 'textarea':
      const textareaLabel = cleanLabel(element.label);
      const textareaValue = value || element.placeholder || '';
      
      if (!textareaLabel) return '';
      
      return `
        <div style="margin: 20px 0;">
          <label style="
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
          ">
            ${textareaLabel}
            ${element.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : ''}
          </label>
          <div style="
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background-color: #f9fafb;
            font-size: 14px;
            color: ${value ? '#111827' : '#9ca3af'};
            min-height: 80px;
          ">
            ${textareaValue}
          </div>
        </div>
      `;
    
    case 'select':
      const selectLabel = cleanLabel(element.label);
      const selectValue = value || 'Select an option...';
      
      if (!selectLabel) return '';
      
      return `
        <div style="margin: 20px 0;">
          <label style="
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
          ">
            ${selectLabel}
            ${element.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : ''}
          </label>
          <div style="
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background-color: #f9fafb;
            font-size: 14px;
            color: ${value ? '#111827' : '#9ca3af'};
            min-height: 44px;
            display: flex;
            align-items: center;
          ">
            ${selectValue}
          </div>
        </div>
      `;
    
    case 'radio':
      const radioLabel = cleanLabel(element.label);
      const options = element.options || [];
      const selectedOption = value;
      
      if (!radioLabel || options.length === 0) return '';
      
      return `
        <div style="margin: 15px 0;">
          <label style="
            display: block;
            font-size: 12px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
          ">
            ${radioLabel}
            ${element.required ? '<span style="color: #ef4444; margin-left: 2px;">*</span>' : ''}
          </label>
          <div style="display: flex; flex-direction: column; gap: 6px; margin-left: 4px;">
            ${options.map(option => `
              <label style="display: flex; align-items: center; font-size: 12px; color: #374151;">
                <div style="
                  width: 14px;
                  height: 14px;
                  border: 2px solid ${selectedOption === option ? '#3b82f6' : '#d1d5db'};
                  border-radius: 50%;
                  background-color: ${selectedOption === option ? '#3b82f6' : 'white'};
                  margin-right: 8px;
                  position: relative;
                  flex-shrink: 0;
                ">
                  ${selectedOption === option ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 6px; height: 6px; background: white; border-radius: 50%;"></div>' : ''}
                </div>
                <span>${option}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    
    case 'checkbox':
      const checkboxLabel = cleanLabel(element.label);
      const isChecked = !!value;
      
      if (!checkboxLabel) return '';
      
      return `
        <div style="margin: 20px 0;">
          <label style="display: flex; align-items: center; font-size: 14px; color: #374151;">
            <div style="
              width: 16px;
              height: 16px;
              border: 2px solid ${isChecked ? '#3b82f6' : '#d1d5db'};
              border-radius: 3px;
              background-color: ${isChecked ? '#3b82f6' : 'white'};
              margin-right: 10px;
              position: relative;
              flex-shrink: 0;
            ">
              ${isChecked ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold; font-size: 12px;">✓</div>' : ''}
            </div>
            <span>
              ${checkboxLabel}
              ${element.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : ''}
            </span>
          </label>
        </div>
      `;
    
    default:
      return '';
  }
};

/**
 * Calculate canvas height exactly like FormRenderer
 * @param {Object} formConfiguration - The form configuration
 * @returns {number} Canvas height
 */
const calculateCanvasHeight = (formConfiguration) => {
  if (!formConfiguration?.form_elements || formConfiguration.form_elements.length === 0) {
    return 800;
  }

  let maxBottom = 0;
  formConfiguration.form_elements.forEach(element => {
    const containerElement = formConfiguration.form_elements.find(el => el.id === element.containerId);
    const isInsideContainer = !!containerElement;
    
    // Calculate absolute position exactly like FormRenderer
    const absoluteY = isInsideContainer 
      ? (containerElement.y + (containerElement.padding || 30) + element.y)
      : element.y;
    
    const elementBottom = absoluteY + element.height;
    if (elementBottom > maxBottom) {
      maxBottom = elementBottom;
    }
  });

  return Math.max(maxBottom + 100, 800);
};

/**
 * Generate PDF content that matches FormRenderer exactly
 * @param {Object} appointmentDetails - The appointment details
 * @param {Object} formData - The form data filled by staff
 * @param {Object} selectedAppointment - The selected appointment
 * @returns {string} HTML content for PDF
 */
export const generatePDFContent = (appointmentDetails, formData, selectedAppointment) => {
  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Generate form elements in simple sequential layout
  let formElementsHTML = '';
  if (appointmentDetails?.formConfiguration?.form_elements) {
    formElementsHTML = appointmentDetails.formConfiguration.form_elements
      .map(element => renderSimpleFormElement(element, formData))
      .filter(html => html.trim() !== '') // Remove empty elements
      .join('');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${selectedAppointment?.ServiceName} - Application Form</title>
        <style>
            * {
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 15px;
                background-color: #ffffff;
                font-size: 12px;
                line-height: 1.4;
                color: #374151;
            }
            .pdf-container {
                max-width: 800px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
            }
            .header-section {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e5e7eb;
            }
            .service-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 6px 0;
            }
            .appointment-subtitle {
                font-size: 12px;
                color: #6b7280;
                margin: 0 0 10px 0;
            }
            .appointment-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f9fafb;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }
            .info-section {
                flex: 1;
            }
            .info-label {
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                margin-bottom: 4px;
            }
            .info-value {
                font-size: 14px;
                font-weight: 500;
                color: #1f2937;
            }
            .generated-footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #9ca3af;
            }
            @media print {
                body { -webkit-print-color-adjust: exact; }
                .pdf-container { box-shadow: none; border: none; }
            }
        </style>
    </head>
    <body>
        <div class="pdf-container">
            <!-- Header Section -->
            <div class="header-section">
                <h1 class="service-title">${selectedAppointment?.ServiceName || 'Church Service'}</h1>
                <p class="appointment-subtitle">Application Form</p>
            </div>

            <!-- Appointment Info Section -->
            <div class="appointment-info">
                <div class="info-section">
                    <div class="info-label">Appointment Date</div>
                    <div class="info-value">
                        ${selectedAppointment?.AppointmentDate ? formatDate(selectedAppointment.AppointmentDate) : 'N/A'}
                        ${selectedAppointment?.StartTime && selectedAppointment?.EndTime ? 
                          `<br><small>${formatTime(selectedAppointment.StartTime)} - ${formatTime(selectedAppointment.EndTime)}</small>` 
                          : ''}
                    </div>
                </div>
                <div class="info-section">
                    <div class="info-label">Applicant</div>
                    <div class="info-value">
                        ${selectedAppointment?.UserName || 'N/A'}
                        <br><small>${selectedAppointment?.UserEmail || ''}</small>
                    </div>
                </div>
            </div>

            <!-- Form Content -->
            ${formElementsHTML ? `
            <div style="max-width: 550px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px;">
                ${formElementsHTML}
            </div>
            ` : ''}

            <!-- Special Notes if any -->
            ${selectedAppointment?.Notes ? `
            <div style="margin-top: 20px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #92400e;">Special Notes</h3>
                <p style="margin: 0; font-size: 14px; color: #92400e;">${selectedAppointment.Notes}</p>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="generated-footer">
                <p>Generated on ${new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}</p>
                <p>Status: ${selectedAppointment?.Status || 'N/A'}</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Export appointment form as PDF
 * @param {Object} appointmentDetails - The appointment details
 * @param {Object} formData - The form data filled by staff
 * @param {Object} selectedAppointment - The selected appointment
 */
export const exportToPDF = (appointmentDetails, formData, selectedAppointment) => {
  try {
    console.log('PDF Export - appointmentDetails:', appointmentDetails);
    console.log('PDF Export - formData:', formData);
    console.log('PDF Export - selectedAppointment:', selectedAppointment);
    
    const htmlContent = generatePDFContent(appointmentDetails, formData, selectedAppointment);
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close the window after printing (optional)
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
    };

    // Fallback if onload doesn't work
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
      }
    }, 1000);

  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF. Please try again.');
  }
};

/**
 * Check if a service is downloadable
 * @param {Object} appointmentDetails - The appointment details
 * @returns {boolean} Whether the service supports PDF download
 */
export const isServiceDownloadable = (appointmentDetails) => {
  return appointmentDetails?.service?.isDownloadableContent === true ||
         appointmentDetails?.isDownloadableContent === true;
};