export const createHolyCommunionForm = () => {
    const baseId = Date.now();

    // Main container
    const mainContainer = {
        id: baseId + 1,
        type: 'container',
        x: 50,
        y: 50,
        width: 820,
        height: 1150,
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
            width: 240,
            height: 40,
            label: 'Name - First',
            placeholder: 'First Name',
            required: true,
            containerId: mainContainer.id,
            elementId: 'child_first_name'
        },
        {
            id: baseId + 5,
            type: 'text',
            x: 260,
            y: 210,
            width: 240,
            height: 40,
            label: 'Middle',
            placeholder: 'Middle Name',
            containerId: mainContainer.id,
            elementId: 'child_middle_name'
        },
        {
            id: baseId + 6,
            type: 'text',
            x: 510,
            y: 210,
            width: 240,
            height: 40,
            label: 'Last',
            placeholder: 'Last Name',
            required: true,
            containerId: mainContainer.id,
            elementId: 'child_last_name'
        },
        
        // Gender selection
        {
            id: baseId + 7,
            type: 'radio',
            x: 10,
            y: 280,
            width: 300,
            height: 60,
            label: 'Please choose one *',
            options: ['Male', 'Female'],
            required: true,
            containerId: mainContainer.id
        },
        
        // Birth Date
        {
            id: baseId + 8,
            type: 'date',
            x: 10,
            y: 360,
            width: 300,
            height: 40,
            label: 'Birth Date *',
            required: true,
            containerId: mainContainer.id
        },
        
        // Location of Birth
        {
            id: baseId + 9,
            type: 'text',
            x: 10,
            y: 420,
            width: 740,
            height: 40,
            label: 'Location of Birth *',
            placeholder: 'Location of Birth',
            required: true,
            containerId: mainContainer.id
        },
        
        // Father's Name
        {
            id: baseId + 10,
            type: 'text',
            x: 10,
            y: 480,
            width: 240,
            height: 40,
            label: 'Father\'s Name - First',
            placeholder: 'First Name',
            containerId: mainContainer.id
        },
        {
            id: baseId + 11,
            type: 'text',
            x: 260,
            y: 480,
            width: 240,
            height: 40,
            label: 'Middle',
            placeholder: 'Middle Name',
            containerId: mainContainer.id
        },
        {
            id: baseId + 12,
            type: 'text',
            x: 510,
            y: 480,
            width: 240,
            height: 40,
            label: 'Last',
            placeholder: 'Last Name',
            containerId: mainContainer.id
        },
        
        // Mother's Name
        {
            id: baseId + 13,
            type: 'text',
            x: 10,
            y: 540,
            width: 240,
            height: 40,
            label: 'Mother\'s Name - First',
            placeholder: 'First Name',
            containerId: mainContainer.id
        },
        {
            id: baseId + 14,
            type: 'text',
            x: 260,
            y: 540,
            width: 240,
            height: 40,
            label: 'Middle',
            placeholder: 'Middle Name',
            containerId: mainContainer.id
        },
        {
            id: baseId + 15,
            type: 'text',
            x: 510,
            y: 540,
            width: 240,
            height: 40,
            label: 'Last',
            placeholder: 'Last Name',
            containerId: mainContainer.id
        },
        
        // Mother's Maiden Name
        {
            id: baseId + 16,
            type: 'text',
            x: 10,
            y: 600,
            width: 360,
            height: 40,
            label: 'Mother\'s Maiden Name *',
            placeholder: 'Mother\'s Maiden Name',
            required: true,
            containerId: mainContainer.id
        },
        
        // Contact Information
        {
            id: baseId + 17,
            type: 'email',
            x: 10,
            y: 660,
            width: 240,
            height: 40,
            label: 'Email Address',
            placeholder: 'Email Address',
            containerId: mainContainer.id
        },
        {
            id: baseId + 18,
            type: 'tel',
            x: 260,
            y: 660,
            width: 240,
            height: 40,
            label: 'Telephone',
            placeholder: 'Telephone',
            containerId: mainContainer.id
        },
        {
            id: baseId + 19,
            type: 'tel',
            x: 510,
            y: 660,
            width: 240,
            height: 40,
            label: 'Cell',
            placeholder: 'Cell',
            containerId: mainContainer.id
        },
        
        // Address
        {
            id: baseId + 20,
            type: 'text',
            x: 10,
            y: 720,
            width: 500,
            height: 40,
            label: 'Address',
            placeholder: 'Address',
            containerId: mainContainer.id
        },
        {
            id: baseId + 21,
            type: 'text',
            x: 520,
            y: 720,
            width: 110,
            height: 40,
            label: 'Province',
            placeholder: 'Province',
            containerId: mainContainer.id
        },
        {
            id: baseId + 22,
            type: 'text',
            x: 640,
            y: 720,
            width: 110,
            height: 40,
            label: 'Postal Code',
            placeholder: 'Postal Code',
            containerId: mainContainer.id
        },
        
        // Baptism in Parish
        {
            id: baseId + 23,
            type: 'radio',
            x: 10,
            y: 780,
            width: 600,
            height: 60,
            label: 'My child was baptised in our parish *',
            options: ['Yes', 'No'],
            required: true,
            containerId: mainContainer.id
        },
        
        // Baptism certificate note
        {
            id: baseId + 24,
            type: 'paragraph',
            x: 10,
            y: 860,
            width: 740,
            height: 100,
            content: 'If your child was baptised in our parish, your child\'s information will be checked by the parish office. No baptismal certificate required. If your child wasn\'t baptised in our parish, you must obtain your child\'s baptismal certificate by contacting the parish where the baptism occurred and ask them to forward it to you personally or email parish@email.ca',
            textColor: '#6b7280',
            containerId: mainContainer.id
        },
        
        // Date of baptism if in parish
        {
            id: baseId + 25,
            type: 'date',
            x: 10,
            y: 980,
            width: 400,
            height: 40,
            label: 'If your child was baptized in our parish, please stipulate the date',
            containerId: mainContainer.id
        },
        
        // Permission & Agreement
        {
            id: baseId + 26,
            type: 'checkbox',
            x: 10,
            y: 1040,
            width: 700,
            height: 30,
            label: 'Permission & Agreement * - I agree and give my permission',
            required: true,
            containerId: mainContainer.id
        }
    ];

    const requirements = [];

    return {
        formElements,
        requirements
    };
};

export default createHolyCommunionForm;
