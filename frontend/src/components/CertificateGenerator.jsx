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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChurch, setIsLoadingChurch] = useState(false);

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
      godfatherName: "Godfather Name",
      godmotherName: "Godmother Name",
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
            issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          };
          
          console.log('Mapped certificate data:', mappedData);
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
      setCertificateData({
        issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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
      setCertificateData({
        issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      });
    } finally {
      setIsLoading(false);
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
    
    // For now, use a demo URL for the QR code
    const demoUrl = `${window.location.origin}/verify-certificate/demo-${selectedAppointment.AppointmentID}-${Date.now()}`;
    
    try {
      // Try to create verification record
      const recipientName = getRecipientName();
      const issuedBy = certificateData.reverendName || 'Parish Priest';
      
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
      
      const verificationUrl = verificationResponse.data.verification_url;
      const html = generateCertificateHTML(certificateType, certificateData, day, month, year, verificationUrl);
      generatePDFFromHTML(html);
      
    } catch (error) {
      console.error('Error creating verification record:', error);
      // Use demo URL if verification creation fails
      console.log('Using demo URL for QR code:', demoUrl);
      const html = generateCertificateHTML(certificateType, certificateData, day, month, year, demoUrl);
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

  const generateCertificateHTML = (type, data, day, month, year, verificationUrl) => {
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
            height: 14in;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px 30px;
            border: 4px solid #000;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          .header-section {
            text-align: center;
            margin-bottom: 50px;
            padding-bottom: 20px;
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
            padding: 30px 0;
            margin: 30px 0 50px 0;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
          }
          .certify-text {
            text-align: center;
            font-size: 18px;
            margin-bottom: 40px;
          }
          .marriage-details {
            max-width: 650px;
            margin: 0 auto;
            line-height: 2.4;
            padding: 0 20px;
          }
          .field-line {
            display: flex;
            align-items: baseline;
            margin-bottom: 18px;
            width: 100%;
            max-width: 100%;
            overflow: hidden;
          }
          .field-label {
            margin-right: 10px;
            white-space: nowrap;
          }
          .field-value {
            border-bottom: 1px solid #000;
            flex: 1;
            min-width: 100px;
            max-width: 100%;
            padding: 2px 8px;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .center-text {
            text-align: center;
            margin: 30px 0;
          }
          .bold-text {
            font-weight: bold;
            letter-spacing: 0.1em;
          }
          .footer-section {
            margin-top: auto;
            font-size: 14px;
            padding: 0 20px;
          }
          .register-info {
            text-align: center;
            margin-bottom: 25px;
          }
          .book-page-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
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
            gap: 40px;
            margin-bottom: 5px;
          }
          .signature-date-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .signature-date-item .field-value {
            border-bottom: 1px solid #000;
            width: 100%;
            text-align: center;
            padding: 2px 8px;
            margin-bottom: 5px;
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
              border: 4px solid #000; 
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
          ${generateCertificateContent(type, data, day, month, year, verificationUrl)}
        </div>
      </body>
      </html>
    `;
    
    return baseHTML;
  };

  const generateCertificateContent = (type, data, day, month, year, verificationUrl) => {
    // Use dynamic church info from API
    const churchName = churchInfo?.ChurchName || 'Holy Church';
    const churchStreet = churchInfo?.Street || '';
    const churchCity = churchInfo?.City || 'Davao City';
    const churchProvince = churchInfo?.Province || 'Davao del Sur';
    
    switch (type) {
      case 'marriage':
        return generateMarriageCertificate(data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl);
      case 'baptism':
        return generateBaptismCertificate(data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl);
      case 'firstCommunion':
        return generateFirstCommunionCertificate(data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl);
      case 'confirmation':
        return generateConfirmationCertificate(data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl);
      default:
        return generateMarriageCertificate(data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl);
    }
  };

  const generateMarriageCertificate = (data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl) => {
    const fullAddress = [churchStreet, churchCity, churchProvince].filter(Boolean).join(', ');
    return `
      <!-- Header Section -->
      <div class="header-section">
        <h1 class="certificate-title">CERTIFICATE OF MARRIAGE</h1>
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
            <span class="field-value" style="flex: 1;">${data.groomName || '[Groom Name]'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">and</span>
            <span class="field-value" style="flex: 1;">${data.brideName || '[Bride Name]'}</span>
          </div>
          
          <p class="center-text">were lawfully <span class="bold-text">MARRIED</span></p>
          
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
          <p class="center-text">and in conformity with the laws of the Republic of the Philippines</p>
          
          <div class="field-line">
            <span class="field-label">Rev.</span>
            <span class="field-value" style="flex: 1;">${data.reverendName || '[Reverend Name]'}</span>
            <span class="field-label" style="margin-left: 10px;">officiating.</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">in the presence of</span>
            <span class="field-value" style="flex: 1;">${data.witnesses1 || '[Witness 1]'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">and</span>
            <span class="field-value" style="flex: 1;">${data.witnesses2 || '[Witness 2]'}</span>
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

  const generateBaptismCertificate = (data, day, month, year, churchName, churchStreet, churchCity, churchProvince, verificationUrl) => {
    const fullAddress = [churchStreet, churchCity, churchProvince].filter(Boolean).join(', ');
    return `
      <!-- Header Section -->
      <div class="header-section">
        <h1 class="certificate-title">CERTIFICATE OF BAPTISM</h1>
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
          
          <p class="center-text">was <span class="bold-text">BAPTIZED</span></p>
          
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
            <span class="field-label">Godfather:</span>
            <span class="field-value" style="flex: 1;">${data.godfatherName || '[Godfather Name]'}</span>
          </div>
          
          <div class="field-line">
            <span class="field-label">Godmother:</span>
            <span class="field-value" style="flex: 1;">${data.godmotherName || '[Godmother Name]'}</span>
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
        <p class="register-info">As appears in the Baptismal Register of this church.</p>
        
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
              <span className="ml-2">
                {isLoadingChurch ? 'Loading church information...' : 'Loading appointment data...'}
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Church Information Display */}
              {churchInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Church Information</h3>
                  <div className="text-sm text-blue-700">
                    <div><strong>Name:</strong> {churchInfo.ChurchName}</div>
                    {churchInfo.Street && <div><strong>Street:</strong> {churchInfo.Street}</div>}
                    <div><strong>City:</strong> {churchInfo.City}</div>
                    <div><strong>Province:</strong> {churchInfo.Province}</div>
                  </div>
                </div>
              )}
              
              {/* Certificate Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(currentFields).map(([fieldKey, fieldLabel]) => {
                  // Auto-populated read-only fields for matrimony
                  const autoPopulatedFields = ['groomName', 'brideName', 'witnesses1', 'witnesses2'];
                  
                  if ((certificateType === 'marriage' || certificateType === 'matrimony') && autoPopulatedFields.includes(fieldKey)) {
                    // Only show field if it has data
                    if (!certificateData[fieldKey]) return null;
                    
                    return (
                      <div key={fieldKey} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {fieldLabel}
                        </label>
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                          {certificateData[fieldKey]}
                        </div>
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
