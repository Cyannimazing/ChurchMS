"use client";

import React, { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { Button } from "@/components/Button.jsx";
import { X, Download, FileText } from "lucide-react";

const CertificateGenerator = ({ 
  isOpen, 
  onClose, 
  selectedAppointment, 
  certificateType = "marriage",
  staffFormData = {}
}) => {
  const [certificateData, setCertificateData] = useState({});
  const [formAnswers, setFormAnswers] = useState([]);
  const [churchInfo, setChurchInfo] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [selectedSignatureId, setSelectedSignatureId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChurch, setIsLoadingChurch] = useState(false);
  const [isLoadingSignatures, setIsLoadingSignatures] = useState(false);

  // Certificate field mappings for different types
  const certificateFields = {
    marriage: {
      groomName: "Groom Name",
      brideName: "Bride Name", 
      witnesses1: "Principal Sponsor 1",
      witnesses2: "Principal Sponsor 2",
      reverendName: "Reverend Name",
      bookNumber: "Book Number",
      pageNumber: "Page Number", 
      lineNumber: "Line Number",
      signature: "Signature"
    },
    baptism: {
      childName: "Child Name",
      fatherName: "Father Name",
      motherName: "Mother Name",
      birthPlace: "Birth Place",
      birthDate: "Child Birth Date",
      sponsor1: "Sponsor 1",
      sponsor2: "Sponsor 2",
      reverendName: "Reverend Name",
      bookNumber: "Book Number",
      pageNumber: "Page Number",
      lineNumber: "Line Number",
      signature: "Signature"
    },
    firstCommunion: {
      childName: "Child Name",
      fatherName: "Father Name", 
      motherName: "Mother Name",
      reverendName: "Reverend Name",
      bookNumber: "Book Number",
      pageNumber: "Page Number",
      lineNumber: "Line Number",
      signature: "Signature"
    },
    confirmation: {
      confirmandName: "Confirmand Name",
      sponsorName: "Sponsor Name",
      reverendName: "Reverend Name", 
      bookNumber: "Book Number",
      pageNumber: "Page Number",
      lineNumber: "Line Number",
      signature: "Signature"
    }
  };

  const currentFields = certificateFields[certificateType] || certificateFields.marriage;

  useEffect(() => {
    if (isOpen && selectedAppointment) {
      fetchChurchInfo();
      fetchAppointmentData();
      fetchSignatures();
    }
  }, [isOpen, selectedAppointment]);

  const fetchChurchInfo = async () => {
    if (!selectedAppointment) return;
    
    setIsLoadingChurch(true);
    try {
      // First, get appointment details to find the church ID or name
      const appointmentResponse = await axios.get(`/api/appointments/${selectedAppointment.AppointmentID}`);
      const appointment = appointmentResponse.data;
      
      // Get church information - try multiple sources based on what's available
      let churchResponse = null;
      
      if (appointment.church && appointment.church.ChurchID) {
        // Use church ID if available
        churchResponse = await axios.get(`/api/churches/${appointment.church.ChurchID}`);
      } else if (appointment.ChurchName) {
        // Fallback to searching by church name
        const churchesResponse = await axios.get('/api/churches');
        const church = churchesResponse.data.churches?.find(
          c => c.ChurchName === appointment.ChurchName
        );
        if (church) {
          churchResponse = await axios.get(`/api/churches/${church.ChurchID}`);
        }
      }
      
      if (churchResponse && churchResponse.data.church) {
        setChurchInfo(churchResponse.data.church);
      } else {
        // Use fallback church info from appointment if direct fetch fails
        setChurchInfo({
          ChurchName: appointment.ChurchName || 'Holy Church',
          Street: appointment.Street || '',
          City: appointment.City || 'Davao City',
          Province: appointment.Province || 'Davao del Sur'
        });
      }
    } catch (error) {
      console.error('Error fetching church info:', error);
      // Use default church info as fallback
      setChurchInfo({
        ChurchName: selectedAppointment?.ChurchName || 'Holy Church',
        Street: '',
        City: 'Davao City',
        Province: 'Davao del Sur'
      });
    } finally {
      setIsLoadingChurch(false);
    }
  };

  const fetchAppointmentData = async () => {
    if (!selectedAppointment) return;
    
    setIsLoading(true);
    try {
      // Fetch auto-populated certificate data from backend for matrimony
      if (certificateType === 'marriage' || certificateType === 'matrimony') {
        const response = await axios.get(
          `/api/appointments/${selectedAppointment.AppointmentID}/certificate-data/matrimony`
        );

        console.log('API Response:', response.data);
        
        if (response.data.success && response.data.field_data) {
          // Map backend field data to frontend certificate data
          const fieldData = response.data.field_data;
          
          console.log('Field data from API:', fieldData);
          
          // Handle both formats: "Groom Name" or "groomName", "witness1" or "Principal Sponsor 1"
          const today = new Date();
          const day = today.getDate();
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
          const month = monthNames[today.getMonth()];
          const year = today.getFullYear();
          
          const mappedData = {
            groomName: fieldData['Groom Name'] || fieldData['groomName'] || '',
            brideName: fieldData['Bride Name'] || fieldData['brideName'] || '',
            witnesses1: fieldData['Principal Sponsor 1'] || fieldData['witness1'] || fieldData['witnesses1'] || '',
            witnesses2: fieldData['Principal Sponsor 2'] || fieldData['witness2'] || fieldData['witnesses2'] || '',
            reverendName: fieldData['Reverend Name'] || fieldData['reverendName'] || '',
            bookNumber: fieldData['Book Number'] || fieldData['bookNumber'] || '',
            pageNumber: fieldData['Page Number'] || fieldData['pageNumber'] || '',
            lineNumber: fieldData['Line Number'] || fieldData['lineNumber'] || '',
            signature: fieldData['Signature'] || fieldData['signature'] || '',
            issueDateDayMonth: `${day} day of ${month}`,
            issueDateYear: year.toString()
          };
          
          console.log('Mapped certificate data:', mappedData);
          setCertificateData(mappedData);
          return;
        }
      }
      
      // Fetch auto-populated certificate data from backend for baptism
      if (certificateType === 'baptism') {
        const response = await axios.get(
          `/api/appointments/${selectedAppointment.AppointmentID}/certificate-data/baptism`
        );

        console.log('Baptism API Response:', response.data);
        
        if (response.data.success && response.data.field_data) {
          const fieldData = response.data.field_data;
          
          console.log('Baptism field data from API:', fieldData);
          
          const today = new Date();
          const day = today.getDate();
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
          const month = monthNames[today.getMonth()];
          const year = today.getFullYear();
          
          const mappedData = {
            childName: fieldData['childName'] || '',
            fatherName: fieldData['fatherName'] || '',
            motherName: fieldData['motherName'] || '',
            birthPlace: fieldData['birthPlace'] || '',
            birthDate: fieldData['birthDate'] || '',
            sponsor1: fieldData['sponsor1'] || '',
            sponsor2: fieldData['sponsor2'] || '',
            reverendName: fieldData['reverendName'] || '',
            bookNumber: fieldData['bookNumber'] || '',
            pageNumber: fieldData['pageNumber'] || '',
            lineNumber: fieldData['lineNumber'] || '',
            signature: fieldData['signature'] || '',
            issueDateDayMonth: `${day} day of ${month}`,
            issueDateYear: year.toString()
          };
          
          console.log('Mapped baptism certificate data:', mappedData);
          setCertificateData(mappedData);
          return;
        }
      }

      // Fallback: Convert staffFormData to array format for dropdowns
      const mappedAnswers = Object.entries(staffFormData).map(([fieldId, value]) => ({
        fieldId: fieldId,
        fieldLabel: `Field ${fieldId}`,
        AnswerText: value,
        fieldType: 'text'
      }));
      
      setFormAnswers(mappedAnswers);
      
      // Set default values
      const today = new Date();
      const day = today.getDate();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[today.getMonth()];
      const year = today.getFullYear();
      
      setCertificateData({
        issueDateDayMonth: `${day} day of ${month}`,
        issueDateYear: year.toString()
      });
      
    } catch (error) {
      console.error('Error fetching appointment data:', error);
      
      // Fallback on error
      const mappedAnswers = Object.entries(staffFormData).map(([fieldId, value]) => ({
        fieldId: fieldId,
        fieldLabel: `Field ${fieldId}`,
        AnswerText: value,
        fieldType: 'text'
      }));
      
      setFormAnswers(mappedAnswers);
      
      const today = new Date();
      const day = today.getDate();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[today.getMonth()];
      const year = today.getFullYear();
      
      setCertificateData({
        issueDateDayMonth: `${day} day of ${month}`,
        issueDateYear: year.toString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSignatures = async () => {
    if (!selectedAppointment) return;
    
    setIsLoadingSignatures(true);
    try {
      // Get ChurchID from appointment
      let churchId = selectedAppointment?.ChurchID || 
                     selectedAppointment?.church?.ChurchID;
      
      // If no ChurchID, fetch appointment details to get it
      if (!churchId) {
        const appointmentResponse = await axios.get(`/api/appointments/${selectedAppointment.AppointmentID}`);
        churchId = appointmentResponse.data?.ChurchID;
      }
      
      if (!churchId) {
        console.error('No ChurchID found for signatures');
        setSignatures([]);
        return;
      }
      
      console.log('Fetching signatures for ChurchID:', churchId);
      
      // Use existing SignatureController index method with church_id parameter
      const response = await axios.get(`/api/signatures?church_id=${churchId}`);
      
      const signatures = response.data || [];
      setSignatures(signatures);
      
      // Auto-select first signature if available
      if (signatures.length > 0) {
        setSelectedSignatureId(signatures[0].id);
      }
      
    } catch (error) {
      console.error('Error fetching signatures:', error);
      console.error('Full error response:', error.response?.data);
      setSignatures([]);
    } finally {
      setIsLoadingSignatures(false);
    }
  };

  const handleCertificateDataChange = (field, value) => {
    setCertificateData(prev => ({ ...prev, [field]: value }));
  };

  const generateCertificatePDF = async () => {
    if (!churchInfo) {
      alert('Church information is still loading. Please wait...');
      return;
    }
    
    const appointmentDate = new Date(selectedAppointment.AppointmentDate);
    const day = appointmentDate.getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[appointmentDate.getMonth()];
    const year = appointmentDate.getFullYear();
    
    // Convert signature image to base64 if selected
    let signatureImageBase64 = null;
    if (selectedSignatureId) {
      try {
        const response = await axios.get(`/api/signatures/${selectedSignatureId}/image`, {
          responseType: 'blob'
        });
        const blob = response.data;
        signatureImageBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Failed to load signature image:', error);
      }
    }
    
    try {
      // Create verification record
      const recipientName = getRecipientName();
      const issuedBy = certificateData.reverendName || 'Parish Priest';
      
      console.log('Creating certificate verification with data:', {
        appointment_id: selectedAppointment.AppointmentID,
        certificate_type: certificateType === 'marriage' ? 'matrimony' : certificateType,
        recipient_name: recipientName,
        certificate_date: appointmentDate.toISOString().split('T')[0],
        issued_by: issuedBy
      });
      
      const verificationResponse = await axios.post('/api/certificate-verification', {
        appointment_id: selectedAppointment.AppointmentID,
        certificate_type: certificateType === 'marriage' ? 'matrimony' : certificateType,
        certificate_data: {
          ...certificateData,
          church_info: {
            name: churchInfo.ChurchName,
            street: churchInfo.Street,
            city: churchInfo.City,
            province: churchInfo.Province
          }
        },
        recipient_name: recipientName,
        certificate_date: appointmentDate.toISOString().split('T')[0],
        issued_by: issuedBy
      });
      
      console.log('Verification created successfully:', verificationResponse.data);
      const verificationUrl = verificationResponse.data.verification_url;
      const html = generateCertificateHTML(certificateType, certificateData, day, month, year, verificationUrl, signatureImageBase64);
      generatePDFFromHTML(html);
      
    } catch (error) {
      console.error('Error creating verification record:', error);
      console.error('Error details:', error.response?.data);
      
      // Show user-friendly error message
      const errorMsg = error.response?.data?.error || 'Failed to create certificate verification. The certificate will be generated without QR code verification.';
      alert(`Warning: ${errorMsg}`);
      
      // Generate certificate without QR code if verification fails
      const html = generateCertificateHTML(certificateType, certificateData, day, month, year, null, signatureImageBase64);
      generatePDFFromHTML(html);
    }
  };
  
  const getRecipientName = () => {
    switch (certificateType) {
      case 'marriage':
      case 'matrimony':
        return `${certificateData.groomName || ''} & ${certificateData.brideName || ''}`;
      case 'baptism':
      case 'firstCommunion':
      case 'confirmation':
        return certificateData.childName || certificateData.confirmandName || 'N/A';
      default:
        return 'N/A';
    }
  };
  
  const generatePDFFromHTML = (html) => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to generate certificate');
      return;
    }

    printWindow.document.write(html);
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
  };

  const generateCertificateHTML = (type, data, day, month, year, verificationUrl, signatureImageBase64) => {
    // Get church info from selectedAppointment or use defaults
    const churchName = selectedAppointment?.church?.church_name || selectedAppointment?.ChurchName || 'Holy Church';
    const churchStreet = selectedAppointment?.church?.street || selectedAppointment?.Street || '';
    const churchCity = selectedAppointment?.church?.city || selectedAppointment?.City || 'Davao City';
    const churchProvince = selectedAppointment?.church?.province || selectedAppointment?.Province || 'Davao del Sur';
    
    const baseHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Certificate of ${type.charAt(0).toUpperCase() + type.slice(1)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Georgia, serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-size: 16px;
            line-height: 1.6;
            color: #000;
          }
          .certificate-container {
            width: 8.5in;
            height: auto;
            min-height: 13in;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 50px 60px;
            border: 6px solid #000;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: visible;
          }
          .header-section {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 2px solid #e5e7eb;
          }
          .certificate-title {
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 0.15em;
            margin: 0 0 30px 0;
            font-family: 'Trajan Pro', Georgia, serif;
          }
          .church-name {
            font-size: 18px;
            font-weight: 500;
            margin: 0 0 10px 0;
          }
          .content-section {
            padding: 10px 40px;
            margin: 10px 0 20px 0;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
          }
          .certify-text {
            text-align: center;
            font-size: 18px;
            margin-bottom: 27px;
            font-weight: 500;
          }
          .marriage-details {
            max-width: 100%;
            margin: 0;
            line-height: 1.7;
            padding: 0;
          }
          .field-line {
            display: flex;
            align-items: baseline;
            margin-bottom: 17px;
            width: 100%;
            min-height: 24px;
          }
          .field-label {
            white-space: nowrap;
            font-size: 16px;
          }
          .field-value {
            border-bottom: 1px solid #000;
            min-width: 80px;
            padding: 2px 8px;
            text-align: center;
            font-size: 16px;
            font-weight: 500;
          }
          .center-text {
            text-align: center;
            margin: 22px 0;
          }
          .bold-text {
            font-weight: bold;
            letter-spacing: 0.1em;
          }
          .footer-section {
            margin-top: auto;
            font-size: 14px;
            padding: 0 40px;
          }
          .register-info {
            text-align: center;
            margin-bottom: 20px;
          }
          .book-page-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            width: 100%;
            gap: 20px;
          }
          .book-page-line > div {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
          }
          .book-page-line .field-value {
            flex: 1;
            border-bottom: 1px solid #000;
            text-align: center;
            padding: 2px 8px;
          }
          .signature-date-section {
            margin-top: 30px;
            margin-bottom: 25px;
          }
          .signature-date-line {
            display: flex;
            justify-content: space-between;
            align-items: flex-end; /* align bottoms for date and signature */
            gap: 60px;
            margin-bottom: 5px;
          }
          .signature-date-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .signature-date-item .field-value {
            border-bottom: 1.5px solid #000;
            width: 100%;
            text-align: center;
            padding: 6px 8px 10px; /* extra bottom padding for the line under signature */
            margin-bottom: 6px;
            min-height: 32px;
          }
          .signature-image {
            width: 160px;
            height: 60px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
          }
          .signature-date-item .field-label {
            font-size: 14px;
            text-align: center;
          }
          .seal-section {
            text-align: right;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .certificate-container { 
              box-shadow: none; 
              border: 6px solid #000 !important; 
              page-break-inside: avoid;
            }
            @page {
              size: legal;
              margin: 0.5in;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          ${generateCertificateContent(type, data, day, month, year, verificationUrl, signatureImageBase64)}
        </div>
      </body>
      </html>
    `;
    
    return baseHTML;
  };

  const generateCertificateContent = (type, data, day, month, year, verificationUrl, signatureImageBase64) => {
    // Use dynamic church info from API
    const churchName = churchInfo?.ChurchName || 'Holy Church';
    const churchStreet = churchInfo?.Street || '';
    const churchCity = churchInfo?.City || 'Davao City';
    const churchProvince = churchInfo?.Province || 'Davao del Sur';
    
    switch (type) {
      case 'marriage':
        return generateMarriageCertificate(data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl, signatureImageBase64);
      case 'baptism':
        return generateBaptismCertificate(data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl, signatureImageBase64);
      case 'firstCommunion':
        return generateFirstCommunionCertificate(data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl, signatureImageUrl);
      case 'confirmation':
        return generateConfirmationCertificate(data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl, signatureImageUrl);
      default:
        return generateMarriageCertificate(data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl, signatureImageBase64);
    }
  };

  const generateMarriageCertificate = (data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl, signatureImageBase64) => {
    // Format address - only include non-empty parts (exclude province)
    const addressParts = [];
    if (churchStreet) addressParts.push(churchStreet);
    if (churchCity) addressParts.push(churchCity);
    // Province excluded from address
    const fullAddress = addressParts.join(', ');
    
    // Add ordinal suffix to day
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    const dayWithSuffix = `${day}${getOrdinalSuffix(day)}`;
    
    return `
      <!-- Header Section -->
      <div class="header-section">
        <h1 class="certificate-title">CERTIFICATE OF MARRIAGE</h1>
        <div style="text-align: center; margin: 20px 0;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 2v8m0 0v12m0-12h8m-8 0H4" />
          </svg>
        </div>
        <p style="margin: 0 0 10px 0; font-size: 14px;">Parish of</p>
        <p class="church-name">${churchName}</p>
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <p class="certify-text">✤ This is to Certify ✤</p>
        
        <div class="marriage-details">
          <div class="field-line">
            <span class="field-label">That</span>
            <span class="field-value" style="flex: 1;">${data.groomName || 'Cyril Juan B. Narcusa'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">and</span>
            <span class="field-value" style="flex: 1;">${data.brideName || 'Carol Clare R. Balleta'}</span>
          </div>
          
          <p class="center-text">were lawfully <span class="bold-text">MARRIED</span></p>
          
          <div class="field-line">
            <span class="field-label">on the</span>
            <span class="field-value" style="flex: 0 0 60px; text-align: center;">${dayWithSuffix}</span>
            <span class="field-label" style="margin: 0 8px;">day of</span>
            <span class="field-value" style="flex: 1;">${month} ${year}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">at ${churchName},</span>
            <span class="field-value" style="flex: 1; text-align: center;">${fullAddress || '125 Main Street Bayview, Davao City'}</span>
          </div>
          
          <p class="center-text">According to the Rite of the Roman Catholic Church</p>
          <p class="center-text">and in conformity with the laws of the Republic of the Philippines</p>
          
          <div class="field-line">
            <span class="field-label">Rev.</span>
            <span class="field-value" style="flex: 1; text-align: center;">${data.reverendName || 'signed'}</span>
            <span class="field-label" style="margin-left: 10px;">officiating.</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">in the presence of</span>
            <span class="field-value" style="flex: 1;">${data.witnesses1 || 'Ninong Full Name'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">and</span>
            <span class="field-value" style="flex: 1;">${data.witnesses2 || 'Ninang Full Name'}</span>
            <span class="field-label" style="margin-left: 10px;">Witnesses.</span>
          </div>
        </div>
      </div>

      <!-- Footer Section -->
      <div class="footer-section">
        <p class="register-info">As appears in the Marriage Register of this church.</p>
        
        <div class="book-page-line">
          <div>
            <span>Book</span>
            <span class="field-value">${data.bookNumber || '[Book]'}</span>
          </div>
          <div>
            <span>Page</span>
            <span class="field-value">${data.pageNumber || '[Page]'}</span>
          </div>
          <div>
            <span>Line</span>
            <span class="field-value">${data.lineNumber || '[Line]'}</span>
          </div>
        </div>
        
        <div class="signature-date-section">
          <div class="signature-date-line">
            <div class="signature-date-item">
              <div class="field-value">${data.issueDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div class="field-label">Date</div>
            </div>
            <div class="signature-date-item">
              <div class=\"field-value\">${signatureImageBase64 ? `<img src=\"${signatureImageBase64}\" alt=\"Signature\" class=\"signature-image\" />` : (data.signature || '')}</div>
              <div class="field-label">Pastor Signature</div>
            </div>
          </div>
        </div>
        
        ${verificationUrl ? `
        <div class="seal-section" style="display: flex; justify-content: center; align-items: center; margin-top: 20px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verificationUrl)}" 
                 alt="QR Code" 
                 style="width: 80px; height: 80px; border: 1px solid #333;" />
            <div style="text-align: left; font-size: 10px;">
              <p style="margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">SCAN TO VERIFY</p>
              <p style="margin: 2px 0 0 0; color: #666;">Certificate Authenticity</p>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  };

  const generateBaptismCertificate = (data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl, signatureImageBase64) => {
    const fullAddress = [churchStreet, churchCity].filter(Boolean).join(', ');
    
    // Add ordinal suffix to day
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    const dayWithSuffix = `${day}${getOrdinalSuffix(day)}`;
    
    // Generate current date for issue date
    const today = new Date();
    const issueDay = today.getDate();
    const issueMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const issueMonth = issueMonthNames[today.getMonth()];
    const issueYear = today.getFullYear();
    const issueDate = `${issueMonth} ${issueDay}, ${issueYear}`;
    
    return `
      <!-- Header Section -->
      <div class="header-section">
        <h1 class="certificate-title">CERTIFICATE OF BAPTISM</h1>
        <div style="text-align: center; margin: 20px 0;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 2v8m0 0v12m0-12h8m-8 0H4" />
          </svg>
        </div>
        <p style="margin: 0 0 10px 0; font-size: 14px;">Parish of</p>
        <p class="church-name">${churchName}</p>
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <p class="certify-text">✤ This is to Certify ✤</p>
        
        <div class="marriage-details">
          <div class="field-line">
            <span class="field-label">That</span>
            <span class="field-value" style="flex: 1;">${data.childName || '__________________________'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">Child of</span>
            <span class="field-value" style="flex: 1;">${data.fatherName || '__________________________'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">and</span>
            <span class="field-value" style="flex: 1;">${data.motherName || '__________________________'}</span>
          </div>
          
          <div class="field-line" style="margin-top: 20px;">
            <span class="field-label">Born in</span>
            <span class="field-value" style="min-width: 200px; flex: 0 1 auto;">${data.birthPlace || '__________________________'}</span>
            <span class="field-label" style="margin: 0 5px;">on the</span>
            <span class="field-value" style="min-width: 40px; text-align: center;">${data.birthDate ? (() => {
              const bDate = new Date(data.birthDate);
              const day = bDate.getDate();
              const suffix = (day) => {
                if (day > 3 && day < 21) return 'th';
                switch (day % 10) {
                  case 1: return 'st';
                  case 2: return 'nd';
                  case 3: return 'rd';
                  default: return 'th';
                }
              };
              return `${day}${suffix(day)}`;
            })() : '_____'}</span>
            <span class="field-label" style="margin: 0 5px;">day of</span>
            <span class="field-value" style="flex: 1;">${data.birthDate ? (() => {
              const bDate = new Date(data.birthDate);
              const bMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              const bMonth = bMonthNames[bDate.getMonth()];
              const bYear = bDate.getFullYear();
              return `${bMonth}, ${bYear}`;
            })() : '_____________, 20__'}</span>
          </div>
          
          <p class="center-text" style="margin-top: 25px;">was <span class="bold-text">BAPTIZED</span></p>
          
          <div class="field-line">
            <span class="field-label">on the</span>
            <span class="field-value" style="flex: 0 0 50px; text-align: center;">${dayWithSuffix}</span>
            <span class="field-label" style="margin: 0 8px;">day of</span>
            <span class="field-value" style="flex: 1;">${month}, ${year}</span>
          </div>
          
          <div class="field-line" style="margin-top: 20px;">
            <span class="field-label">at ${churchName},</span>
            <span class="field-value" style="flex: 1; text-align: center;">${fullAddress || '123 Main Street, Bayview, Davao City, Davao del Sur'}</span>
          </div>
          
          <p class="center-text">According to the Rite of the Roman Catholic Church,</p>
          
          <div class="field-line">
            <span class="field-label">By</span>
            <span class="field-value" style="flex: 1;">${data.reverendName || '__________________________'}</span>
          </div>
          
          <div class="field-line" style="margin-top: 15px;">
            <span class="field-label">The sponsors being</span>
            <span class="field-value" style="flex: 1;">${data.sponsor1 || '__________________________'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">and</span>
            <span class="field-value" style="flex: 1;">${data.sponsor2 || '__________________________'}</span>
          </div>
        </div>
      </div>

      <!-- Footer Section -->
      <div class="footer-section">
        <p class="register-info">As appears in the Baptismal Register of this church.</p>
        
        <div class="book-page-line">
          <div>
            <span>Book</span>
            <span class="field-value">${data.bookNumber || '______'}</span>
          </div>
          <div>
            <span>Page</span>
            <span class="field-value">${data.pageNumber || '______'}</span>
          </div>
          <div>
            <span>Line</span>
            <span class="field-value">${data.lineNumber || '______'}</span>
          </div>
        </div>
        
        <div class="signature-date-section">
          <div class="signature-date-line">
            <div class="signature-date-item">
              <div class="field-value">${issueDate}</div>
              <div class="field-label">Date</div>
            </div>
            <div class="signature-date-item">
              <div class="field-value">${signatureImageBase64 ? `<img src="${signatureImageBase64}" alt="Signature" class="signature-image" />` : (data.signature || '___________________________')}</div>
              <div class="field-label">Pastor Signature</div>
            </div>
          </div>
        </div>
        
        ${verificationUrl ? `
        <div class="seal-section" style="display: flex; justify-content: center; align-items: center; margin-top: 20px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verificationUrl)}" 
                 alt="QR Code" 
                 style="width: 80px; height: 80px; border: 1px solid #333;" />
            <div style="text-align: left; font-size: 10px;">
              <p style="margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">SCAN TO VERIFY</p>
              <p style="margin: 2px 0 0 0; color: #666;">Certificate Authenticity</p>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  };

  const generateFirstCommunionCertificate = (data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl) => {
    const fullAddress = [churchStreet, churchCity, churchProvince].filter(Boolean).join(', ');
    return `
      <!-- Header Section -->
      <div class="header-section">
        <h1 class="certificate-title">CERTIFICATE OF FIRST COMMUNION</h1>
        <div style="text-align: center; margin: 20px 0;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 2v8m0 0v12m0-12h8m-8 0H4" />
          </svg>
        </div>
        <p style="margin: 0 0 10px 0;">Parish of</p>
        <p class="church-name">${churchName}</p>
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <p class="certify-text">✤ This is to Certify ✤</p>
        
        <div class="marriage-details">
          <div class="field-line">
            <span class="field-label">That</span>
            <span class="field-value" style="flex: 1;">${data.childName || '[Child Name]'}</span>
          </div>
          
          <p class="center-text">received <span class="bold-text">FIRST HOLY COMMUNION</span></p>
          
          <div class="field-line">
            <span class="field-label">on the</span>
            <span class="field-value" style="flex: 0 0 60px; min-width: 60px; max-width: 60px;">${day}</span>
            <span class="field-label" style="margin-left: 8px;">day of</span>
            <span class="field-value" style="flex: 1; max-width: calc(100% - 160px);">${month} ${year}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">at</span>
            <span class="field-value" style="flex: 0 1 auto;">${churchName}</span>
            <span class="field-label" style="margin-left: 8px;">in</span>
            <span class="field-value" style="flex: 1;">${fullAddress}</span>
          </div>
          
          <p class="center-text">According to the Rite of the Roman Catholic Church</p>
          
          <div class="field-line">
            <span class="field-label">Child of</span>
            <span class="field-value" style="flex: 1;">${data.fatherName || '[Father Name]'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">and</span>
            <span class="field-value" style="flex: 1;">${data.motherName || '[Mother Name]'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">Rev.</span>
            <span class="field-value" style="flex: 1;">${data.reverendName || '[Reverend Name]'}</span>
            <span class="field-label" style="margin-left: 10px;">officiating.</span>
          </div>
        </div>
      </div>

      <!-- Footer Section -->
      <div class="footer-section">
        <p class="register-info">As appears in the First Communion Register of this church.</p>
        
        <div class="book-page-line">
          <div>
            <span>Book</span>
            <span class="field-value">${data.bookNumber || '[Book]'}</span>
          </div>
          <div>
            <span>Page</span>
            <span class="field-value">${data.pageNumber || '[Page]'}</span>
          </div>
          <div>
            <span>Line</span>
            <span class="field-value">${data.lineNumber || '[Line]'}</span>
          </div>
        </div>
        
        <div class="signature-date-section">
          <div class="signature-date-line">
            <div class="signature-date-item">
              <div class="field-value">${data.issueDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div class="field-label">Date</div>
            </div>
            <div class="signature-date-item">
              <div class="field-value">${data.signature || ''}</div>
              <div class="field-label">Pastor Signature</div>
            </div>
          </div>
        </div>
        
        <div class="seal-section" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
          <div style="text-align: left; font-size: 12px; color: #666;">
            <p style="margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">PARISH SEAL</p>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verificationUrl)}" 
                 alt="QR Code" 
                 style="width: 80px; height: 80px; border: 1px solid #333;" />
            <div style="text-align: left; font-size: 10px;">
              <p style="margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">SCAN TO VERIFY</p>
              <p style="margin: 2px 0 0 0; color: #666;">Certificate Authenticity</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const generateConfirmationCertificate = (data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl) => {
    const fullAddress = [churchStreet, churchCity, churchProvince].filter(Boolean).join(', ');
    return `
      <!-- Header Section -->
      <div class="header-section">
        <h1 class="certificate-title">CERTIFICATE OF CONFIRMATION</h1>
        <div style="text-align: center; margin: 20px 0;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 2v8m0 0v12m0-12h8m-8 0H4" />
          </svg>
        </div>
        <p style="margin: 0 0 10px 0;">Parish of</p>
        <p class="church-name">${churchName}</p>
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <p class="certify-text">✤ This is to Certify ✤</p>
        
        <div class="marriage-details">
          <div class="field-line">
            <span class="field-label">That</span>
            <span class="field-value" style="flex: 1;">${data.confirmandName || '[Confirmand Name]'}</span>
          </div>
          
          <p class="center-text">was <span class="bold-text">CONFIRMED</span></p>
          
          <div class="field-line">
            <span class="field-label">on the</span>
            <span class="field-value" style="flex: 0 0 60px; min-width: 60px; max-width: 60px;">${day}</span>
            <span class="field-label" style="margin-left: 8px;">day of</span>
            <span class="field-value" style="flex: 1; max-width: calc(100% - 160px);">${month} ${year}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">at</span>
            <span class="field-value" style="flex: 0 1 auto;">${churchName}</span>
            <span class="field-label" style="margin-left: 8px;">in</span>
            <span class="field-value" style="flex: 1;">${fullAddress}</span>
          </div>
          
          <p class="center-text">According to the Rite of the Roman Catholic Church</p>
          
          <div class="field-line">
            <span class="field-label">Sponsor:</span>
            <span class="field-value" style="flex: 1;">${data.sponsorName || '[Sponsor Name]'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">Rev.</span>
            <span class="field-value" style="flex: 1;">${data.reverendName || '[Reverend Name]'}</span>
            <span class="field-label" style="margin-left: 10px;">officiating.</span>
          </div>
        </div>
      </div>

      <!-- Footer Section -->
      <div class="footer-section">
        <p class="register-info">As appears in the Confirmation Register of this church.</p>
        
        <div class="book-page-line">
          <div>
            <span>Book</span>
            <span class="field-value">${data.bookNumber || '[Book]'}</span>
          </div>
          <div>
            <span>Page</span>
            <span class="field-value">${data.pageNumber || '[Page]'}</span>
          </div>
          <div>
            <span>Line</span>
            <span class="field-value">${data.lineNumber || '[Line]'}</span>
          </div>
        </div>
        
        <div class="signature-date-section">
          <div class="signature-date-line">
            <div class="signature-date-item">
              <div class="field-value">${data.issueDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div class="field-label">Date</div>
            </div>
            <div class="signature-date-item">
              <div class="field-value">${data.signature || ''}</div>
              <div class="field-label">Pastor Signature</div>
            </div>
          </div>
        </div>
        
        <div class="seal-section" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
          <div style="text-align: left; font-size: 12px; color: #666;">
            <p style="margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">PARISH SEAL</p>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verificationUrl)}" 
                 alt="QR Code" 
                 style="width: 80px; height: 80px; border: 1px solid #333;" />
            <div style="text-align: left; font-size: 10px;">
              <p style="margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">SCAN TO VERIFY</p>
              <p style="margin: 2px 0 0 0; color: #666;">Certificate Authenticity</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Generate {certificateType.charAt(0).toUpperCase() + certificateType.slice(1)} Certificate
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {(isLoading || isLoadingChurch) ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Preparing certificate...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Certificate Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(currentFields).map(([fieldKey, fieldLabel]) => {
                  // Auto-populated read-only fields for matrimony
                  const matrimonyAutoFields = ['groomName', 'brideName', 'witnesses1', 'witnesses2'];
                  // Auto-populated read-only fields for baptism
                  const baptismAutoFields = ['childName', 'fatherName', 'motherName', 'birthPlace', 'birthDate', 'sponsor1', 'sponsor2'];
                  
                  // Hide auto-populated fields for matrimony
                  if ((certificateType === 'marriage' || certificateType === 'matrimony') && matrimonyAutoFields.includes(fieldKey)) {
                    return null;
                  }
                  
                  // Hide auto-populated fields for baptism
                  if (certificateType === 'baptism' && baptismAutoFields.includes(fieldKey)) {
                    return null;
                  }
                  
                  // Special handling for signature field - use dropdown
                  if (fieldKey === 'signature') {
                    return (
                      <div key={fieldKey} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {fieldLabel}
                        </label>
                        {isLoadingSignatures ? (
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                            Loading signatures...
                          </div>
                        ) : signatures.length > 0 ? (
                          <select
                            value={selectedSignatureId || ''}
                            onChange={(e) => {
                              const signatureId = e.target.value;
                              setSelectedSignatureId(signatureId);
                              // Also update the signature name in certificate data for display
                              const selectedSig = signatures.find(s => s.id == signatureId);
                              handleCertificateDataChange(fieldKey, selectedSig?.name || '');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select a signature</option>
                            {signatures.map((signature) => (
                              <option key={signature.id} value={signature.id}>
                                {signature.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                            No signatures available for this church
                          </div>
                        )}
                        {/* Display selected signature name as read-only field */}
                        {selectedSignatureId && (
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Issued by:
                            </label>
                            <div className="w-full px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                              {signatures.find(s => s.id == selectedSignatureId)?.name || 'Unknown'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Manual input fields for other fields
                  return (
                    <div key={fieldKey} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {fieldLabel}
                      </label>
                      <input
                        type="text"
                        value={certificateData[fieldKey] || ''}
                        onChange={(e) => handleCertificateDataChange(fieldKey, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  onClick={onClose}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={generateCertificatePDF}
                  className="flex items-center"
                  disabled={isLoadingChurch || !churchInfo}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isLoadingChurch ? 'Loading...' : 'Generate Certificate'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;
