export const createHolyCommunionForm = () => {
    const baseId = Date.now();

    // Main container
    const mainContainer = {
        id: baseId + 1,
        type: 'container',
        x: 50,
        y: 50,
        width: 820,
        height: 860,
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 2,
        borderRadius: 8,
        padding: 30,
        containerId: null,
        elementId: 'holy_communion_form_container',
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
            content: 'FIRST COMMUNION REGISTRATION',
            headingSize: 'h1',
            textAlign: 'center',
            textColor: '#1f2937',
            containerId: mainContainer.id,
            elementId: 'first_communion_title',
            zIndex: 1
        },
        
        // Description paragraph
        {
            id: baseId + 3,
            type: 'paragraph',
            x: 10,
            y: 60,
            width: 740,
            height: 120,
            textAlign: 'center',
            content: 'Grade two or above are eligible for First Reconciliation and First Eucharist. Classes will be held on Sundays at the church and will rely on parent involvement. Classes are expected to begin in February, and you will be contacted prior to this date. During the introduction night, a schedule with the upcoming dates will be shared.\n\nThe required textbooks can be obtained from the church office. To register please fill out the online form below, or obtain a paper copy from the office. Call or email for more information at (403) 227-3932 or email@parish.ca',
            textColor: '#374151',
            containerId: mainContainer.id
        },
        
        // Child's Name
        {
            id: baseId + 4,
            type: 'text',
            x: 10,
            y: 210,
            width: 500,
            height: 40,
            label: "Child's Full Name *",
            placeholder: 'Full Name',
            required: true,
            containerId: mainContainer.id,
            elementId: 'child_full_name'
        },
        
        // Gender selection
        {
            id: baseId + 5,
            type: 'radio',
            x: 530,
            y: 210,
            width: 220,
            height: 60,
            label: 'Gender *',
            options: ['Male', 'Female'],
            required: true,
            containerId: mainContainer.id
        },
        
        // Birth Date
        {
            id: baseId + 6,
            type: 'date',
            x: 10,
            y: 290,
            width: 240,
            height: 40,
            label: 'Birth Date *',
            required: true,
            containerId: mainContainer.id
        },
        
        // Place of Birth
        {
            id: baseId + 7,
            type: 'text',
            x: 260,
            y: 290,
            width: 490,
            height: 40,
            label: 'Place of Birth *',
            placeholder: 'Place of Birth',
            required: true,
            containerId: mainContainer.id
        },
        
        // Father's Name
        {
            id: baseId + 8,
            type: 'text',
            x: 10,
            y: 350,
            width: 360,
            height: 40,
            label: 'Father\'s Full Name',
            placeholder: 'Father\'s Full Name',
            containerId: mainContainer.id
        },
        
        // Mother's Name
        {
            id: baseId + 9,
            type: 'text',
            x: 390,
            y: 350,
            width: 360,
            height: 40,
            label: 'Mother\'s Full Name',
            placeholder: 'Mother\'s Full Name',
            containerId: mainContainer.id
        },
        
        // Mother's Maiden Name
        {
            id: baseId + 10,
            type: 'text',
            x: 10,
            y: 410,
            width: 360,
            height: 40,
            label: 'Mother\'s Maiden Name *',
            placeholder: 'Mother\'s Maiden Name',
            required: true,
            containerId: mainContainer.id
        },
        
        // Contact Information
        {
            id: baseId + 11,
            type: 'email',
            x: 10,
            y: 470,
            width: 240,
            height: 40,
            label: 'Email Address',
            placeholder: 'Email Address',
            containerId: mainContainer.id
        },
        {
            id: baseId + 12,
            type: 'tel',
            x: 260,
            y: 470,
            width: 240,
            height: 40,
            label: 'Telephone',
            placeholder: 'Telephone',
            containerId: mainContainer.id
        },
        {
            id: baseId + 13,
            type: 'tel',
            x: 510,
            y: 470,
            width: 240,
            height: 40,
            label: 'Cell',
            placeholder: 'Cell',
            containerId: mainContainer.id
        },
        
        // Address
        {
            id: baseId + 14,
            type: 'text',
            x: 10,
            y: 530,
            width: 500,
            height: 40,
            label: 'Address',
            placeholder: 'Address',
            containerId: mainContainer.id
        },
        {
            id: baseId + 15,
            type: 'text',
            x: 520,
            y: 530,
            width: 110,
            height: 40,
            label: 'Province',
            placeholder: 'Province',
            containerId: mainContainer.id
        },
        {
            id: baseId + 16,
            type: 'text',
            x: 640,
            y: 530,
            width: 110,
            height: 40,
            label: 'Postal Code',
            placeholder: 'Postal Code',
            containerId: mainContainer.id
        },
        
        // Baptism Status
        {
            id: baseId + 17,
            type: 'radio',
            x: 10,
            y: 590,
            width: 600,
            height: 60,
            label: 'Was the child baptized already? *',
            options: ['Yes', 'No'],
            required: true,
            containerId: mainContainer.id
        },
        
        // Church name if baptized
        {
            id: baseId + 18,
            type: 'text',
            x: 10,
            y: 670,
            width: 360,
            height: 40,
            label: 'If yes, state the name of the church',
            placeholder: 'Church name',
            containerId: mainContainer.id
        },
        
        // Baptism Date
        {
            id: baseId + 19,
            type: 'date',
            x: 390,
            y: 670,
            width: 360,
            height: 40,
            label: 'Baptism Date',
            containerId: mainContainer.id
        },
        
        // Church Location
        {
            id: baseId + 20,
            type: 'text',
            x: 10,
            y: 730,
            width: 740,
            height: 40,
            label: 'Church Location',
            placeholder: 'Church location (City, Province)',
            containerId: mainContainer.id
        },
        
    ];

    const requirements = [];

    return {
        formElements,
        requirements
    };
};

export default createHolyCommunionForm;
