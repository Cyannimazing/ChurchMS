export const createConfirmationForm = () => {
    const baseId = Date.now();

    // Main container
    const mainContainer = {
        id: baseId + 1,
        type: 'container',
        x: 50,
        y: 50,
        width: 820,
        height: 1100,
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 2,
        borderRadius: 8,
        padding: 30,
        containerId: null,
        elementId: 'confirmation_form_container',
        zIndex: 0
    };

    const formElements = [
        mainContainer,

        // Title
        {
            id: baseId + 2,
            type: 'heading',
            x: 10,
            y: 10,
            width: 740,
            height: 40,
            content: 'CONFIRMATION REGISTRATION',
            headingSize: 'h1',
            textAlign: 'center',
            textColor: '#1f2937',
            containerId: mainContainer.id,
            elementId: 'confirmation_title',
            zIndex: 1
        },
        
        // Description paragraph
        {
            id: baseId + 3,
            type: 'paragraph',
            x: 10,
            y: 60,
            width: 740,
            height: 70,
            textAlign: 'center',
            content: 'The sacrament of Confirmation is held every two years in our parish. The next celebration will be in 2026. If your child is 12 years old or older, please fill out the form below. You will be contacted when classes for this sacrament begin.',
            textColor: '#374151',
            containerId: mainContainer.id
        },
        
        // Candidate's Full Name
        {
            id: baseId + 4,
            type: 'text',
            x: 10,
            y: 140,
            width: 480,
            height: 40,
            label: 'Candidate\'s Full Name',
            placeholder: 'Full Name',
            required: true,
            containerId: mainContainer.id,
            elementId: 'candidate_full_name'
        },
        
        // Confirmation Name
        {
            id: baseId + 5,
            type: 'text',
            x: 510,
            y: 140,
            width: 240,
            height: 40,
            label: 'Confirmation Name',
            placeholder: 'Confirmation Name',
            required: true,
            containerId: mainContainer.id,
            elementId: 'confirmation_name'
        },
        
        // Birth Date
        {
            id: baseId + 6,
            type: 'date',
            x: 10,
            y: 200,
            width: 360,
            height: 40,
            label: 'Birth Date',
            required: true,
            containerId: mainContainer.id,
            elementId: 'candidate_birth_date'
        },
        
        // Location of Birth
        {
            id: baseId + 7,
            type: 'text',
            x: 390,
            y: 200,
            width: 360,
            height: 40,
            label: 'Location of Birth',
            placeholder: 'Location of Birth',
            required: true,
            containerId: mainContainer.id,
            elementId: 'candidate_birth_place'
        },
        
        // Already Baptized Question
        {
            id: baseId + 8,
            type: 'radio',
            x: 10,
            y: 260,
            width: 400,
            height: 60,
            label: 'Already Baptized?',
            options: ['Yes', 'No'],
            required: true,
            containerId: mainContainer.id,
            elementId: 'already_baptized'
        },
        
        // Baptized Date (conditional - if Yes)
        {
            id: baseId + 9,
            type: 'date',
            x: 10,
            y: 340,
            width: 360,
            height: 40,
            label: 'Baptized Date',
            required: false,
            containerId: mainContainer.id,
            elementId: 'baptized_date'
        },
        
        // Church Name (conditional - if Yes)
        {
            id: baseId + 10,
            type: 'text',
            x: 390,
            y: 340,
            width: 360,
            height: 40,
            label: 'Church Name',
            placeholder: 'Church Name',
            required: false,
            containerId: mainContainer.id,
            elementId: 'baptized_church_name'
        },
        
        // Church Location (conditional - if Yes)
        {
            id: baseId + 11,
            type: 'text',
            x: 10,
            y: 400,
            width: 740,
            height: 40,
            label: 'Church Location',
            placeholder: 'Church Location',
            required: false,
            containerId: mainContainer.id,
            elementId: 'baptized_church_location'
        },
        
        // First Communion Question
        {
            id: baseId + 12,
            type: 'radio',
            x: 10,
            y: 460,
            width: 400,
            height: 60,
            label: 'Already received First Communion?',
            options: ['Yes', 'No'],
            required: true,
            containerId: mainContainer.id,
            elementId: 'already_first_communion'
        },
        
        // First Communion Date (conditional - if Yes)
        {
            id: baseId + 13,
            type: 'date',
            x: 10,
            y: 540,
            width: 360,
            height: 40,
            label: 'First Communion Date',
            required: false,
            containerId: mainContainer.id,
            elementId: 'first_communion_date'
        },
        
        // First Communion Church Name (conditional - if Yes)
        {
            id: baseId + 14,
            type: 'text',
            x: 390,
            y: 540,
            width: 360,
            height: 40,
            label: 'Church Name',
            placeholder: 'Church Name',
            required: false,
            containerId: mainContainer.id,
            elementId: 'first_communion_church_name'
        },
        
        // First Communion Church Location (conditional - if Yes)
        {
            id: baseId + 15,
            type: 'text',
            x: 10,
            y: 600,
            width: 740,
            height: 40,
            label: 'Church Location',
            placeholder: 'Church Location',
            required: false,
            containerId: mainContainer.id,
            elementId: 'first_communion_church_location'
        },
        
        // Father's Full Name
        {
            id: baseId + 16,
            type: 'text',
            x: 10,
            y: 660,
            width: 480,
            height: 40,
            label: 'Father\'s Full Name',
            placeholder: 'Full Name',
            containerId: mainContainer.id,
            elementId: 'father_full_name'
        },
        
        // Father's Religion
        {
            id: baseId + 17,
            type: 'text',
            x: 510,
            y: 660,
            width: 240,
            height: 40,
            label: 'Religion',
            placeholder: 'Religion',
            required: true,
            containerId: mainContainer.id,
            elementId: 'father_religion'
        },
        
        // Mother's Full Name
        {
            id: baseId + 18,
            type: 'text',
            x: 10,
            y: 720,
            width: 480,
            height: 40,
            label: 'Mother\'s Full Name',
            placeholder: 'Full Name',
            containerId: mainContainer.id,
            elementId: 'mother_full_name'
        },
        
        // Mother's Religion
        {
            id: baseId + 19,
            type: 'text',
            x: 510,
            y: 720,
            width: 240,
            height: 40,
            label: 'Religion',
            placeholder: 'Religion',
            required: true,
            containerId: mainContainer.id,
            elementId: 'mother_religion'
        },
        
        // Contact Information
        {
            id: baseId + 20,
            type: 'email',
            x: 10,
            y: 780,
            width: 240,
            height: 40,
            label: 'Email Address',
            placeholder: 'Email Address',
            containerId: mainContainer.id,
            elementId: 'email_address'
        },
        {
            id: baseId + 21,
            type: 'tel',
            x: 260,
            y: 780,
            width: 240,
            height: 40,
            label: 'Telephone',
            placeholder: 'Telephone',
            containerId: mainContainer.id,
            elementId: 'telephone'
        },
        {
            id: baseId + 22,
            type: 'tel',
            x: 510,
            y: 780,
            width: 240,
            height: 40,
            label: 'Cell',
            placeholder: 'Cell',
            containerId: mainContainer.id,
            elementId: 'cell_phone'
        },
        
        // Address
        {
            id: baseId + 23,
            type: 'text',
            x: 10,
            y: 840,
            width: 740,
            height: 40,
            label: 'Address',
            placeholder: 'Address',
            containerId: mainContainer.id,
            elementId: 'address'
        },
        
        // School (if a child)
        {
            id: baseId + 24,
            type: 'text',
            x: 10,
            y: 900,
            width: 740,
            height: 40,
            label: 'Name of school (if a child)',
            placeholder: 'Name of school (if a child)',
            containerId: mainContainer.id,
            elementId: 'school_name'
        },
        
        
        // Sponsor's Full Name
        {
            id: baseId + 25,
            type: 'text',
            x: 10,
            y: 960,
            width: 480,
            height: 40,
            label: 'Sponsor\'s Full Name',
            placeholder: 'Full Name',
            required: true,
            containerId: mainContainer.id,
            elementId: 'sponsor_full_name'
        },
        
        // Sponsor Gender
        {
            id: baseId + 26,
            type: 'radio',
            x: 510,
            y: 960,
            width: 240,
            height: 60,
            label: 'Gender',
            options: ['Male', 'Female'],
            required: true,
            containerId: mainContainer.id,
            elementId: 'sponsor_gender'
        },
        
    ];

    const requirements = [];

    return {
        formElements,
        requirements
    };
};

export default createConfirmationForm;