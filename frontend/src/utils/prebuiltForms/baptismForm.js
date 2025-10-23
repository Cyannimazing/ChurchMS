// Pre-built Baptism Form Configuration
// This creates a complete baptism form with all required fields organized in a professional layout

export const createBaptismForm = () => {
  const baseId = Date.now();
  
  // Container for the form
  const mainContainer = {
    id: baseId + 1,
    type: 'container',
    x: 50,
    y: 50,
    width: 820,
    height: 2000,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 2,
    borderRadius: 8,
    padding: 30,
    containerId: null,
    elementId: 'baptism_form_container',
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
      content: 'BAPTISM APPLICATION',
      headingSize: 'h1',
      textAlign: 'center',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'baptism_title',
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
      content: 'Baptism Information Form\n\nParish staff will complete this form based on details provided by the family. The baptism date will only be confirmed after verification with the family.',
      textAlign: 'Center',
      textColor: '#374151',
      containerId: mainContainer.id,
      elementId: 'baptism_intro',
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
      content: 'Please use FULL LEGAL names with correct spacing and capitalization. The information used on this form helps us complete the baptismal record and baptismal certificate.',
      textAlign: 'Center',
      textColor: '#dc2626',
      containerId: mainContainer.id,
      elementId: 'baptism_legal_note',
      zIndex: 1
    },
    
    // Child's Information Section Header
    {
      id: baseId + 5,
      type: 'heading',
      x: 10,
      y: 240,
      width: 740,
      height: 40,
      content: "Child's Information",
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'child_info_header',
      zIndex: 1
    },
    
    // Child's Full Name
    {
      id: baseId + 6,
      type: 'text',
      x: 10,
      y: 290,
      width: 740,
      height: 40,
      label: "Child's Full Name (First Middle Last)",
      placeholder: 'Enter child\'s full legal name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'child_full_name',
      zIndex: 1
    },
    
    // Child's Gender
    {
      id: baseId + 9,
      type: 'radio',
      x: 10,
      y: 350,
      width: 240,
      height: 80,
      label: "Child's Gender",
      required: true,
      options: ['Male', 'Female'],
      containerId: mainContainer.id,
      elementId: 'child_gender',
      zIndex: 1
    },
    
    // Date of Birth
    {
      id: baseId + 10,
      type: 'date',
      x: 405,
      y: 450,
      width: 346,
      height: 40,
      label: 'Date of Birth',
      required: true,
      containerId: mainContainer.id,
      elementId: 'child_date_of_birth',
      zIndex: 1
    },

    // Place of Birth
    {
      id: baseId + 12,
      type: 'text',
      x: 10,
      y: 450,
      width: 385,
      height: 40,
      label: 'Place of Birth',
      placeholder: 'Enter place of birth',
      required: true,
      containerId: mainContainer.id,
      elementId: 'child_place_of_birth',
      zIndex: 1
    },
    
    // Family Information Section Header
    {
      id: baseId + 13,
      type: 'heading',
      x: 10,
      y: 520,
      width: 740,
      height: 40,
      content: 'Family Information',
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'family_info_header',
      zIndex: 1
    },
    
    // Family Address
    {
      id: baseId + 14,
      type: 'text',
      x: 10,
      y: 570,
      width: 360,
      height: 40,
      label: 'Family Address',
      placeholder: 'Enter street address',
      required: true,
      containerId: mainContainer.id,
      elementId: 'family_address',
      zIndex: 1
    },
    
    // City
    {
      id: baseId + 15,
      type: 'text',
      x: 380,
      y: 570,
      width: 100,
      height: 40,
      label: 'City',
      placeholder: 'Enter city',
      required: true,
      containerId: mainContainer.id,
      elementId: 'family_city',
      zIndex: 1
    },
    
    // Province
    {
      id: baseId + 16,
      type: 'select',
      x: 490,
      y: 570,
      width: 170,
      height: 40,
      label: 'Province',
      elementId: 'family_province',
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
      zIndex: 1
    },

    
    // Zip
    {
      id: baseId + 17,
      type: 'text',
      x: 670,
      y: 570,
      width: 80,
      height: 40,
      label: 'Zip',
      placeholder: 'ZIP code',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Father's Information Section Header
    {
      id: baseId + 18,
      type: 'heading',
      x: 10,
      y: 640,
      width: 740,
      height: 40,
      content: "Father's Information",
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'father_info_header',
      zIndex: 1
    },
    
    // Father's Full Legal Name
    {
      id: baseId + 19,
      type: 'text',
      x: 10,
      y: 690,
      width: 360,
      height: 40,
      label: "Father's Full Legal Name (First Middle Last)",
      placeholder: 'Enter father\'s full legal name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'father_full_name',
      zIndex: 1
    },
    
    // Father's Religion
    {
      id: baseId + 20,
      type: 'text',
      x: 380,
      y: 690,
      width: 180,
      height: 40,
      label: "Father's Religion",
      placeholder: 'Enter religion',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Father's Email
    {
      id: baseId + 21,
      type: 'email',
      x: 10,
      y: 750,
      width: 360,
      height: 40,
      label: "Father's Email",
      placeholder: 'Enter email address',
      required: true,
      containerId: mainContainer.id,
      elementId: 'father_email',
      zIndex: 1
    },
    
    // Father's Cell Phone
    {
      id: baseId + 22,
      type: 'tel',
      x: 380,
      y: 750,
      width: 180,
      height: 40,
      label: "Father's Cell Phone Number",
      placeholder: '555-555-5555',
      required: true,
      containerId: mainContainer.id,
      elementId: 'father_phone',
      zIndex: 1
    },
    
    // Mother's Information Section Header
    {
      id: baseId + 23,
      type: 'heading',
      x: 10,
      y: 820,
      width: 740,
      height: 40,
      content: "Mother's Information",
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'mother_info_header',
      zIndex: 1
    },
    
    // Mother's Full Legal Name
    {
      id: baseId + 24,
      type: 'text',
      x: 10,
      y: 870,
      width: 360,
      height: 40,
      label: "Mother's Full Legal Name (First Middle Last)",
      placeholder: 'Enter mother\'s full legal name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'mother_full_name',
      zIndex: 1
    },
    
    // Mother's Maiden Name
    {
      id: baseId + 25,
      type: 'text',
      x: 380,
      y: 870,
      width: 180,
      height: 40,
      label: "Mother's Maiden Name",
      placeholder: 'Enter maiden name',
      required: true,
      containerId: mainContainer.id,
      elementId: 'mother_maiden_name',
      zIndex: 1
    },
    
    // Mother's Religion
    {
      id: baseId + 26,
      type: 'text',
      x: 570,
      y: 870,
      width: 180,
      height: 40,
      label: "Mother's Religion",
      placeholder: 'Enter religion',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Mother's Email
    {
      id: baseId + 27,
      type: 'email',
      x: 10,
      y: 930,
      width: 360,
      height: 40,
      label: "Mother's Email",
      placeholder: 'Enter email address',
      required: true,
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Mother's Cell Phone
    {
      id: baseId + 28,
      type: 'tel',
      x: 380,
      y: 930,
      width: 180,
      height: 40,
      label: "Mother's Cell Phone Number",
      placeholder: '555-555-5555',
      required: true,
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Marital Information Section Header
    {
      id: baseId + 29,
      type: 'heading',
      x: 10,
      y: 1000,
      width: 740,
      height: 40,
      content: 'Marital Information',
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Parent's Marital Status
    {
      id: baseId + 30,
      type: 'select',
      x: 10,
      y: 1050,
      width: 240,
      height: 40,
      label: "Parent's Marital Status",
      options: ['Married', 'Single', 'Divorced', 'Widowed'],
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Date of Marriage
    {
      id: baseId + 31,
      type: 'date',
      x: 260,
      y: 1050,
      width: 240,
      height: 40,
      label: 'Date of Marriage',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Place of Marriage
    {
      id: baseId + 32,
      type: 'text',
      x: 510,
      y: 1050,
      width: 240,
      height: 40,
      label: 'Place of Marriage',
      placeholder: 'Enter place of marriage',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Godparents Information Header
    {
      id: baseId + 33,
      type: 'paragraph',
      x: 10,
      y: 1120,
      width: 740,
      height: 185,
      content: 'IMPORTANT Information Regarding Godparents / Sponsors:\n\nBeing a Godparent/Sponsor is more than an honorary title. When someone agrees to be a Godparent, it means that they are pledging to play a significant and positive role in that Child\'s life and his/her faith formation and spiritual life.\n\nAccording to Church law, a Godparent/Sponsor MUST be a practicing AND CONFIRMED Catholic, and if married, married by a Catholic priest/deacon.\n\nIf you have two Godparents, Church law requires that one be a man and the other be a woman. You may have a person who is a baptized Christian stand next to a Godparent as a Christian Witness.\n\nHowever, there must always be at least one Godparent/Sponsor who is a practicing AND CONFIRMED Catholic.',
      textAlign: 'Justify',
      textColor: '#dc2626',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Godfather Section Header
    {
      id: baseId + 34,
      type: 'heading',
      x: 10,
      y: 1300,
      width: 360,
      height: 40,
      content: 'Godfather',
      headingSize: 'h3',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Godfather's Name
    {
      id: baseId + 35,
      type: 'text',
      x: 10,
      y: 1350,
      width: 360,
      height: 40,
      label: "Godfather's Name (First Middle Last)",
      placeholder: 'Enter godfather\'s full name',
      required: true,
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Godfather's Religion
    {
      id: baseId + 36,
      type: 'select',
      x: 10,
      y: 1410,
      width: 360,
      height: 40,
      label: "Godfather's Religion",
      required: true,
      options: ['Roman Catholic', 'Protestant', 'Orthodox', 'Other Christian', 'Other'],
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Is Godfather practicing Catholic
    {
      id: baseId + 37,
      type: 'radio',
      x: 10,
      y: 1470,
      width: 180,
      height: 80,
      label: 'Is the Godfather a practicing Catholic?',
      required: true,
      options: ['YES', 'NO'],
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Is Godfather Confirmed
    {
      id: baseId + 38,
      type: 'radio',
      x: 190,
      y: 1470,
      width: 180,
      height: 80,
      label: 'Is the Godfather Confirmed?',
      required: true,
      options: ['YES', 'NO'],
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Godmother Section Header
    {
      id: baseId + 39,
      type: 'heading',
      x: 390,
      y: 1300,
      width: 360,
      height: 40,
      content: 'Godmother',
      headingSize: 'h3',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Godmother's Name
    {
      id: baseId + 40,
      type: 'text',
      x: 390,
      y: 1350,
      width: 360,
      height: 40,
      label: "Godmother's Name (First Middle Last)",
      placeholder: 'Enter godmother\'s full name',
      required: true,
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Godmother's Religion
    {
      id: baseId + 41,
      type: 'select',
      x: 390,
      y: 1410,
      width: 360,
      height: 40,
      label: "Godmother's Religion",
      required: true,
      options: ['Roman Catholic', 'Protestant', 'Orthodox', 'Other Christian', 'Other'],
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Is Godmother practicing Catholic
    {
      id: baseId + 42,
      type: 'radio',
      x: 390,
      y: 1470,
      width: 180,
      height: 80,
      label: 'Is the Godmother a practicing Catholic?',
      required: true,
      options: ['YES', 'NO'],
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Is Godmother Confirmed
    {
      id: baseId + 43,
      type: 'radio',
      x: 570,
      y: 1470,
      width: 180,
      height: 80,
      label: 'Is the Godmother Confirmed?',
      required: true,
      options: ['YES', 'NO'],
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // General Information Section Header
    {
      id: baseId + 44,
      type: 'heading',
      x: 10,
      y: 1580,
      width: 740,
      height: 40,
      content: 'General Information',
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Schedule Information
    {
      id: baseId + 45,
      type: 'paragraph',
      x: 10,
      y: 1630,
      width: 740,
      height: 100,
      content: 'Baptism Schedule\n\nBaptisms are held every Saturday and Sunday at 11:00 AM.\n\nIf a godparent cannot attend, a proxy may stand in. Please provide the proxy’s name so it can be recorded.\n\nPlease choose a date at least one month in advance, unless there is an urgent need.',
      textAlign: 'left',
      textColor: '#374151',
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // First child being baptized
    {
      id: baseId + 50,
      type: 'radio',
      x: 20,
      y: 1730,
      width: 240,
      height: 80,
      label: 'Is this your first child being baptized?',
      required: true,
      options: ['YES', 'NO'],
      containerId: mainContainer.id,
      zIndex: 1
    },
    
    // Additional Comments
    {
      id: baseId + 53,
      type: 'textarea',
      x: 10,
      y: 1810,
      width: 740,
      height: 100,
      label: 'Please list any other comments or special circumstances here',
      placeholder: 'Enter any additional comments...',
      rows: 4,
      containerId: mainContainer.id,
      zIndex: 1
    }
  ];

  // Requirements for the baptism form
  const requirements = [
    
  ];

  return {
    formElements,
    requirements
  };
};

export default createBaptismForm;
