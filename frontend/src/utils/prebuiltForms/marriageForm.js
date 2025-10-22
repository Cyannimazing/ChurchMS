// Pre-built Marriage Form Configuration
// This creates a complete marriage application form with all required fields organized in a professional layout

export const createMarriageForm = () => {
  const baseId = Date.now();
  
  // Container for the form
  const mainContainer = {
    id: baseId + 1,
    type: 'container',
    x: 50,
    y: 50,
    width: 820,
    height: 1600,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 2,
    borderRadius: 8,
    padding: 30,
    containerId: null,
    elementId: 'marriage_form_container',
    zIndex: 0
  };

  // Form elements with proper positioning inside the container
  const formElements = [
    mainContainer,
    
    // Header/Title
    {
      id: baseId + 2,
      type: 'heading',
      x: 10,
      y: 10,
      width: 740,
      height: 50,
      content: 'MARRIAGE APPLICATION',
      headingSize: 'h1',
      textAlign: 'center',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'marriage_title',
      zIndex: 1
    },
    
    // Introduction paragraph
    {
      id: baseId + 3,
      type: 'paragraph',
      x: 10,
      y: 70,
      width: 740,
      height: 80,
      content: 'Marriage Application Form\n\nParish staff will complete this form based on details provided by the couple. The marriage date will only be confirmed after verification with both parties and completion of pre-marriage requirements.',
      textAlign: 'Center',
      textColor: '#374151',
      containerId: mainContainer.id,
      elementId: 'marriage_intro',
      zIndex: 1
    },

    // Important note about legal names
    {
      id: baseId + 4,
      type: 'paragraph',
      x: 10,
      y: 160,
      width: 740,
      height: 60,
      content: 'Please use FULL LEGAL names with correct spacing and capitalization. The information used on this form helps us complete the marriage record and marriage certificate.',
      textAlign: 'Center',
      textColor: '#dc2626',
      containerId: mainContainer.id,
      elementId: 'marriage_legal_note',
      zIndex: 1
    },
    
    // Bride's Information Section Header
    {
      id: baseId + 5,
      type: 'heading',
      x: 10,
      y: 240,
      width: 740,
      height: 40,
      content: "Bride's Information",
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'bride_info_header',
      zIndex: 1
    },
    
    // Bride's Full Legal Name
    {
      id: baseId + 6,
      type: 'text',
      x: 10,
      y: 290,
      width: 360,
      height: 40,
      label: "Bride's Full Legal Name (First Middle Last)",
      placeholder: 'Enter bride\'s full legal name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'bride_full_name',
      zIndex: 1
    },
    
    // Bride's Date of Birth
    {
      id: baseId + 7,
      type: 'date',
      x: 380,
      y: 290,
      width: 180,
      height: 40,
      label: "Bride's Date of Birth",
      required: true,
      containerId: mainContainer.id,
      elementId: 'bride_date_of_birth',
      zIndex: 1
    },
    
    // Bride's Place of Birth
    {
      id: baseId + 8,
      type: 'text',
      x: 570,
      y: 290,
      width: 180,
      height: 40,
      label: "Bride's Place of Birth",
      placeholder: 'Enter place of birth',
      required: true,
      containerId: mainContainer.id,
      elementId: 'bride_place_of_birth',
      zIndex: 1
    },
    
    // Bride's Religion
    {
      id: baseId + 9,
      type: 'select',
      x: 10,
      y: 350,
      width: 180,
      height: 40,
      label: "Bride's Religion",
      options: ['Roman Catholic', 'Protestant', 'Orthodox', 'Other Christian', 'Other'],
      required: true,
      containerId: mainContainer.id,
      elementId: 'bride_religion',
      zIndex: 1
    },
    
    // Bride's Address
    {
      id: baseId + 10,
      type: 'text',
      x: 200,
      y: 350,
      width: 280,
      height: 40,
      label: "Bride's Address",
      placeholder: 'Enter street address',
      required: true,
      containerId: mainContainer.id,
      elementId: 'bride_address',
      zIndex: 1
    },
    
    // Bride's City
    {
      id: baseId + 11,
      type: 'text',
      x: 490,
      y: 350,
      width: 120,
      height: 40,
      label: 'City',
      placeholder: 'Enter city',
      required: true,
      containerId: mainContainer.id,
      elementId: 'bride_city',
      zIndex: 1
    },
    
    // Bride's Province
    {
      id: baseId + 12,
      type: 'select',
      x: 620,
      y: 350,
      width: 130,
      height: 40,
      label: 'Province',
      elementId: 'bride_province',
      options: [
        'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay', 'Antique',
        'Apayao', 'Aurora', 'Basilan', 'Bataan', 'Batanes', 'Batangas',
        'Benguet', 'Biliran', 'Bohol', 'Bukidnon', 'Bulacan', 'Cagayan',
        'Camarines Norte', 'Camarines Sur', 'Camiguin', 'Capiz', 'Catanduanes',
        'Cavite', 'Cebu', 'Cotabato', 'Davao de Oro', 'Davao del Norte',
        'Davao del Sur', 'Davao Occidental', 'Davao Oriental', 'Dinagat Islands',
        'Eastern Samar', 'Guimaras', 'Ifugao', 'Ilocos Norte', 'Ilocos Sur',
        'Iloilo', 'Isabela', 'Kalinga', 'La Union', 'Laguna', 'Lanao del Norte',
        'Lanao del Sur', 'Leyte', 'Maguindanao del Norte', 'Maguindanao del Sur',
        'Marinduque', 'Masbate', 'Misamis Occidental', 'Misamis Oriental',
        'Mountain Province', 'Negros Occidental', 'Negros Oriental',
        'Northern Samar', 'Nueva Ecija', 'Nueva Vizcaya', 'Occidental Mindoro',
        'Oriental Mindoro', 'Palawan', 'Pampanga', 'Pangasinan', 'Quezon',
        'Quirino', 'Rizal', 'Romblon', 'Samar', 'Sarangani', 'Siquijor',
        'Sorsogon', 'South Cotabato', 'Southern Leyte', 'Sultan Kudarat',
        'Sulu', 'Surigao del Norte', 'Surigao del Sur', 'Tarlac', 'Tawi-Tawi',
        'Zambales', 'Zamboanga del Norte', 'Zamboanga del Sur',
        'Zamboanga Sibugay'
      ],
      containerId: mainContainer.id,
      required: true,
      zIndex: 1
    },
    
    // Bride's Email and Phone
    {
      id: baseId + 13,
      type: 'email',
      x: 10,
      y: 410,
      width: 240,
      height: 40,
      label: "Bride's Email",
      placeholder: 'Enter email address',
      required: true,
      containerId: mainContainer.id,
      elementId: 'bride_email',
      zIndex: 1
    },
    
    {
      id: baseId + 14,
      type: 'tel',
      x: 260,
      y: 410,
      width: 180,
      height: 40,
      label: "Bride's Phone Number",
      placeholder: '555-555-5555',
      required: true,
      containerId: mainContainer.id,
      elementId: 'bride_phone',
      zIndex: 1
    },
    
    // Groom's Information Section Header
    {
      id: baseId + 15,
      type: 'heading',
      x: 10,
      y: 480,
      width: 740,
      height: 40,
      content: "Groom's Information",
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'groom_info_header',
      zIndex: 1
    },
    
    // Groom's Full Legal Name
    {
      id: baseId + 16,
      type: 'text',
      x: 10,
      y: 530,
      width: 360,
      height: 40,
      label: "Groom's Full Legal Name (First Middle Last)",
      placeholder: 'Enter groom\'s full legal name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'groom_full_name',
      zIndex: 1
    },
    
    // Groom's Date of Birth
    {
      id: baseId + 17,
      type: 'date',
      x: 380,
      y: 530,
      width: 180,
      height: 40,
      label: "Groom's Date of Birth",
      required: true,
      containerId: mainContainer.id,
      elementId: 'groom_date_of_birth',
      zIndex: 1
    },
    
    // Groom's Place of Birth
    {
      id: baseId + 18,
      type: 'text',
      x: 570,
      y: 530,
      width: 180,
      height: 40,
      label: "Groom's Place of Birth",
      placeholder: 'Enter place of birth',
      required: true,
      containerId: mainContainer.id,
      elementId: 'groom_place_of_birth',
      zIndex: 1
    },
    
    // Groom's Religion
    {
      id: baseId + 19,
      type: 'select',
      x: 10,
      y: 590,
      width: 180,
      height: 40,
      label: "Groom's Religion",
      options: ['Roman Catholic', 'Protestant', 'Orthodox', 'Other Christian', 'Other'],
      required: true,
      containerId: mainContainer.id,
      elementId: 'groom_religion',
      zIndex: 1
    },
    
    // Groom's Address
    {
      id: baseId + 20,
      type: 'text',
      x: 200,
      y: 590,
      width: 280,
      height: 40,
      label: "Groom's Address",
      placeholder: 'Enter street address',
      required: true,
      containerId: mainContainer.id,
      elementId: 'groom_address',
      zIndex: 1
    },
    
    // Groom's City
    {
      id: baseId + 21,
      type: 'text',
      x: 490,
      y: 590,
      width: 120,
      height: 40,
      label: 'City',
      placeholder: 'Enter city',
      required: true,
      containerId: mainContainer.id,
      elementId: 'groom_city',
      zIndex: 1
    },
    
    // Groom's Province
    {
      id: baseId + 22,
      type: 'select',
      x: 620,
      y: 590,
      width: 130,
      height: 40,
      label: 'Province',
      elementId: 'groom_province',
      options: [
        'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay', 'Antique',
        'Apayao', 'Aurora', 'Basilan', 'Bataan', 'Batanes', 'Batangas',
        'Benguet', 'Biliran', 'Bohol', 'Bukidnon', 'Bulacan', 'Cagayan',
        'Camarines Norte', 'Camarines Sur', 'Camiguin', 'Capiz', 'Catanduanes',
        'Cavite', 'Cebu', 'Cotabato', 'Davao de Oro', 'Davao del Norte',
        'Davao del Sur', 'Davao Occidental', 'Davao Oriental', 'Dinagat Islands',
        'Eastern Samar', 'Guimaras', 'Ifugao', 'Ilocos Norte', 'Ilocos Sur',
        'Iloilo', 'Isabela', 'Kalinga', 'La Union', 'Laguna', 'Lanao del Norte',
        'Lanao del Sur', 'Leyte', 'Maguindanao del Norte', 'Maguindanao del Sur',
        'Marinduque', 'Masbate', 'Misamis Occidental', 'Misamis Oriental',
        'Mountain Province', 'Negros Occidental', 'Negros Oriental',
        'Northern Samar', 'Nueva Ecija', 'Nueva Vizcaya', 'Occidental Mindoro',
        'Oriental Mindoro', 'Palawan', 'Pampanga', 'Pangasinan', 'Quezon',
        'Quirino', 'Rizal', 'Romblon', 'Samar', 'Sarangani', 'Siquijor',
        'Sorsogon', 'South Cotabato', 'Southern Leyte', 'Sultan Kudarat',
        'Sulu', 'Surigao del Norte', 'Surigao del Sur', 'Tarlac', 'Tawi-Tawi',
        'Zambales', 'Zamboanga del Norte', 'Zamboanga del Sur',
        'Zamboanga Sibugay'
      ],
      containerId: mainContainer.id,
      required: true,
      zIndex: 1
    },
    
    // Groom's Email and Phone
    {
      id: baseId + 23,
      type: 'email',
      x: 10,
      y: 650,
      width: 240,
      height: 40,
      label: "Groom's Email",
      placeholder: 'Enter email address',
      required: true,
      containerId: mainContainer.id,
      elementId: 'groom_email',
      zIndex: 1
    },
    
    {
      id: baseId + 24,
      type: 'tel',
      x: 260,
      y: 650,
      width: 180,
      height: 40,
      label: "Groom's Phone Number",
      placeholder: '555-555-5555',
      required: true,
      containerId: mainContainer.id,
      elementId: 'groom_phone',
      zIndex: 1
    },
    
    
// Parents Information Section Header
    {
      id: baseId + 25,
      type: 'heading',
      x: 10,
      y: 720,
      width: 740,
      height: 40,
      content: 'Parents Information',
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'parents_info_header',
      zIndex: 1
    },
    
    // Bride's Parents
    {
      id: baseId + 26,
      type: 'text',
      x: 10,
      y: 770,
      width: 360,
      height: 40,
      label: "Bride's Father's Full Name",
      placeholder: 'Enter father\'s full name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'bride_father_name',
      zIndex: 1
    },
    
    {
      id: baseId + 27,
      type: 'text',
      x: 390,
      y: 770,
      width: 360,
      height: 40,
      label: "Bride's Mother's Full Name (including maiden name)",
      placeholder: 'Enter mother\'s full name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'bride_mother_name',
      zIndex: 1
    },
    
    // Groom's Parents
    {
      id: baseId + 28,
      type: 'text',
      x: 10,
      y: 830,
      width: 360,
      height: 40,
      label: "Groom's Father's Full Name",
      placeholder: 'Enter father\'s full name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'groom_father_name',
      zIndex: 1
    },
    
    {
      id: baseId + 29,
      type: 'text',
      x: 390,
      y: 830,
      width: 360,
      height: 40,
      label: "Groom's Mother's Full Name (including maiden name)",
      placeholder: 'Enter mother\'s full name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'groom_mother_name',
      zIndex: 1
    },
    
    // Witnesses/Sponsors Section Header
    {
      id: baseId + 30,
      type: 'heading',
      x: 10,
      y: 900,
      width: 740,
      height: 40,
      content: 'Witnesses and Sponsors',
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'witnesses_header',
      zIndex: 1
    },
    
    // Principal Sponsors
    {
      id: baseId + 31,
      type: 'text',
      x: 10,
      y: 950,
      width: 360,
      height: 40,
      label: 'Principal Sponsor 1 (Ninong) - Full Name',
      placeholder: 'Enter principal sponsor name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'principal_sponsor_1',
      zIndex: 1
    },
    
    {
      id: baseId + 32,
      type: 'text',
      x: 390,
      y: 950,
      width: 360,
      height: 40,
      label: 'Principal Sponsor 2 (Ninang) - Full Name',
      placeholder: 'Enter principal sponsor name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'principal_sponsor_2',
      zIndex: 1
    },
    
    // Best Man and Maid of Honor
    {
      id: baseId + 33,
      type: 'text',
      x: 10,
      y: 1010,
      width: 360,
      height: 40,
      label: 'Best Man - Full Name',
      placeholder: 'Enter best man name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'best_man',
      zIndex: 1
    },
    
    {
      id: baseId + 34,
      type: 'text',
      x: 390,
      y: 1010,
      width: 360,
      height: 40,
      label: 'Maid/Matron of Honor - Full Name',
      placeholder: 'Enter maid/matron of honor name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'maid_of_honor',
      zIndex: 1
    },
    
    
// Emergency Contact Section Header
    {
      id: baseId + 35,
      type: 'heading',
      x: 10,
      y: 1080,
      width: 740,
      height: 40,
      content: 'Emergency Contact',
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'emergency_contact_header',
      zIndex: 1
    },
    
    // Emergency Contact Name and Number
    {
      id: baseId + 36,
      type: 'text',
      x: 10,
      y: 1130,
      width: 360,
      height: 40,
      label: 'Emergency Contact Name',
      placeholder: 'Enter contact name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'emergency_contact_name',
      zIndex: 1
    },
    
    {
      id: baseId + 37,
      type: 'tel',
      x: 390,
      y: 1130,
      width: 240,
      height: 40,
      label: 'Emergency Contact Number',
      placeholder: '555-555-5555',
      required: true,
      containerId: mainContainer.id,
      elementId: 'emergency_contact_number',
      zIndex: 1
    },
    
// Additional Information Section Header
    {
      id: baseId + 38,
      type: 'heading',
      x: 10,
      y: 1200,
      width: 740,
      height: 40,
      content: 'Additional Information',
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'additional_info_header',
      zIndex: 1
    },
    
    // Marriage Schedule Information
    {
      id: baseId + 39,
      type: 'paragraph',
      x: 10,
      y: 1250,
      width: 740,
      height: 120,
      content: 'Marriage Schedule Information\n\nMarriages are typically held on Saturdays and Sundays. Please choose a date at least three months in advance to allow time for preparation and completion of all requirements.\n\nAll pre-marriage requirements must be completed before the wedding date can be confirmed.\n\nThe parish reserves the right to reschedule if requirements are not met in time.',
      textAlign: 'left',
      textColor: '#374151',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Special Requests/Comments
    {
      id: baseId + 40,
      type: 'textarea',
      x: 10,
      y: 1390,
      width: 740,
      height: 120,
      label: 'Special Requests or Comments',
      placeholder: 'Enter any special requests, dietary restrictions, accessibility needs, or other important information...',
      rows: 5,
      containerId: mainContainer.id,
      elementId: 'special_requests',
      zIndex: 1
    }
  ];

  // Requirements for the marriage form
  const requirements = [];

  return {
    formElements,
    requirements
  };
};

export default createMarriageForm;