export const createConfirmationForm = () => {
    const baseId = Date.now();

    // Main container
    const mainContainer = {
        id: baseId + 1,
        type: 'container',
        x: 50,
        y: 50,
        width: 820,
        height: 2010,
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
        
        // Candidate's Name
        {
            id: baseId + 4,
            type: 'text',
            x: 10,
            y: 140,
            width: 240,
            height: 40,
            label: 'Candidate\'s Name - First *',
            placeholder: 'First Name',
            required: true,
            containerId: mainContainer.id,
            elementId: 'candidate_first_name'
        },
        {
            id: baseId + 5,
            type: 'text',
            x: 260,
            y: 140,
            width: 240,
            height: 40,
            label: 'Middle',
            placeholder: 'Middle Name',
            containerId: mainContainer.id,
            elementId: 'candidate_middle_name'
        },
        {
            id: baseId + 6,
            type: 'text',
            x: 510,
            y: 140,
            width: 240,
            height: 40,
            label: 'Last',
            placeholder: 'Last Name',
            required: true,
            containerId: mainContainer.id,
            elementId: 'candidate_last_name'
        },
        
        // Gender selection
        {
            id: baseId + 7,
            type: 'radio',
            x: 10,
            y: 200,
            width: 300,
            height: 60,
            label: 'Please choose one *',
            options: ['Male', 'Female'],
            required: true,
            containerId: mainContainer.id,
            elementId: 'candidate_gender'
        },
        
        // Birth Date
        {
            id: baseId + 8,
            type: 'date',
            x: 10,
            y: 280,
            width: 300,
            height: 40,
            label: 'Birth Date *',
            required: true,
            containerId: mainContainer.id,
            elementId: 'candidate_birth_date'
        },
        
        // Location of Birth
        {
            id: baseId + 9,
            type: 'text',
            x: 10,
            y: 340,
            width: 740,
            height: 40,
            label: 'Location of Birth *',
            placeholder: 'Location of Birth',
            required: true,
            containerId: mainContainer.id,
            elementId: 'candidate_birth_place'
        },
        
        // Father's Name
        {
            id: baseId + 10,
            type: 'text',
            x: 10,
            y: 400,
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
            y: 400,
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
            y: 400,
            width: 240,
            height: 40,
            label: 'Last',
            placeholder: 'Last Name',
            containerId: mainContainer.id
        },
        
        // Father's Religion
        {
            id: baseId + 13,
            type: 'text',
            x: 10,
            y: 460,
            width: 360,
            height: 40,
            label: 'Father\'s Religion *',
            placeholder: 'Father\'s Religion',
            required: true,
            containerId: mainContainer.id
        },
        
        // Mother's Name
        {
            id: baseId + 14,
            type: 'text',
            x: 10,
            y: 520,
            width: 240,
            height: 40,
            label: 'Mother\'s Name - First',
            placeholder: 'First Name',
            containerId: mainContainer.id
        },
        {
            id: baseId + 15,
            type: 'text',
            x: 260,
            y: 520,
            width: 240,
            height: 40,
            label: 'Middle',
            placeholder: 'Middle Name',
            containerId: mainContainer.id
        },
        {
            id: baseId + 16,
            type: 'text',
            x: 510,
            y: 520,
            width: 240,
            height: 40,
            label: 'Last',
            placeholder: 'Last Name',
            containerId: mainContainer.id
        },
        
        // Mother's Religion
        {
            id: baseId + 17,
            type: 'text',
            x: 10,
            y: 580,
            width: 360,
            height: 40,
            label: 'Mother\'s Religion *',
            placeholder: 'Mother\'s Religion',
            required: true,
            containerId: mainContainer.id
        },
        
        // Contact Information
        {
            id: baseId + 18,
            type: 'email',
            x: 10,
            y: 640,
            width: 240,
            height: 40,
            label: 'Email Address',
            placeholder: 'Email Address',
            containerId: mainContainer.id
        },
        {
            id: baseId + 19,
            type: 'tel',
            x: 260,
            y: 640,
            width: 240,
            height: 40,
            label: 'Telephone',
            placeholder: 'Telephone',
            containerId: mainContainer.id
        },
        {
            id: baseId + 20,
            type: 'tel',
            x: 510,
            y: 640,
            width: 240,
            height: 40,
            label: 'Cell',
            placeholder: 'Cell',
            containerId: mainContainer.id
        },
        
        // Address
        {
            id: baseId + 21,
            type: 'text',
            x: 10,
            y: 700,
            width: 740,
            height: 40,
            label: 'Address',
            placeholder: 'Address',
            containerId: mainContainer.id
        },
        
        // School (if a child)
        {
            id: baseId + 22,
            type: 'text',
            x: 10,
            y: 760,
            width: 740,
            height: 40,
            label: 'Name of school (if a child)',
            placeholder: 'Name of school (if a child)',
            containerId: mainContainer.id
        },
        
        // Baptized in Eastern Catholic Church
        {
            id: baseId + 23,
            type: 'radio',
            x: 10,
            y: 820,
            width: 600,
            height: 60,
            label: 'Was the person baptized in a Catholic Church? *',
            options: ['Yes', 'No'],
            required: true,
            containerId: mainContainer.id
        },
        {
            id: baseId + 24,
            type: 'paragraph',
            x: 10,
            y: 890,
            width: 740,
            height: 60,
            content: 'If yes, Confirmation was conferred at the time of Baptism, the Sacrament of Confirmation is not repeated.',
            textColor: '#6b7280',
            containerId: mainContainer.id
        },
        
        // Baptized in Orthodox Church
        {
            id: baseId + 25,
            type: 'radio',
            x: 10,
            y: 960,
            width: 600,
            height: 60,
            label: 'Was the person baptized in the Orthodox Church? *',
            options: ['Yes', 'No'],
            required: true,
            containerId: mainContainer.id
        },
        {
            id: baseId + 26,
            type: 'paragraph',
            x: 10,
            y: 1030,
            width: 740,
            height: 60,
            content: 'If yes, Confirmation was conferred at the time of Baptism, the Sacrament of Confirmation is not repeated.',
            textColor: '#6b7280',
            containerId: mainContainer.id
        },
        
        // Baptized in another Christian community
        {
            id: baseId + 27,
            type: 'radio',
            x: 10,
            y: 1100,
            width: 600,
            height: 60,
            label: 'Was the person baptized in another Christian ecclesial community? *',
            options: ['Yes', 'No'],
            required: true,
            containerId: mainContainer.id
        },
        {
            id: baseId + 28,
            type: 'paragraph',
            x: 10,
            y: 1170,
            width: 740,
            height: 60,
            content: 'When making a Profession of Faith, the person is received into the Roman Catholic Church.',
            textColor: '#6b7280',
            containerId: mainContainer.id
        },
        {
            id: baseId + 29,
            type: 'text',
            x: 10,
            y: 1240,
            width: 740,
            height: 40,
            label: 'If yes, which denomination?',
            placeholder: 'Which denomination?',
            containerId: mainContainer.id
        },
        
        // First Reconciliation
        {
            id: baseId + 30,
            type: 'radio',
            x: 10,
            y: 1300,
            width: 600,
            height: 60,
            label: 'Has the person received First Reconciliation? *',
            options: ['Yes', 'No'],
            required: true,
            containerId: mainContainer.id
        },
        
        // First Holy Eucharist
        {
            id: baseId + 31,
            type: 'radio',
            x: 10,
            y: 1380,
            width: 600,
            height: 60,
            label: 'Has the person received First Holy Eucharist? *',
            options: ['Yes', 'No'],
            required: true,
            containerId: mainContainer.id
        },
        
        // Sponsor's Name
        {
            id: baseId + 32,
            type: 'text',
            x: 10,
            y: 1460,
            width: 240,
            height: 40,
            label: 'Sponsor\'s Name - First',
            placeholder: 'First Name',
            required: true,
            containerId: mainContainer.id
        },
        {
            id: baseId + 33,
            type: 'text',
            x: 260,
            y: 1460,
            width: 240,
            height: 40,
            label: 'Middle',
            placeholder: 'Middle Name',
            containerId: mainContainer.id
        },
        {
            id: baseId + 34,
            type: 'text',
            x: 510,
            y: 1460,
            width: 240,
            height: 40,
            label: 'Last',
            placeholder: 'Last Name',
            required: true,
            containerId: mainContainer.id
        },
        
        // Sponsor Gender
        {
            id: baseId + 35,
            type: 'radio',
            x: 10,
            y: 1520,
            width: 300,
            height: 60,
            label: 'Please choose one *',
            options: ['Male', 'Female'],
            required: true,
            containerId: mainContainer.id
        },
        
        // Testimonial of Suitability (Sponsor)
        {
            id: baseId + 36,
            type: 'checkbox',
            x: 10,
            y: 1600,
            width: 700,
            height: 30,
            label: 'Testimonial of Suitability by Parent(s) (if a child) * - Suitable',
            required: true,
            containerId: mainContainer.id
        },
        
        // Second Sponsor (Optional)
        {
            id: baseId + 37,
            type: 'text',
            x: 10,
            y: 1650,
            width: 240,
            height: 40,
            label: 'Second Sponsor\'s Name (Optional) - First',
            placeholder: 'First Name',
            containerId: mainContainer.id
        },
        {
            id: baseId + 38,
            type: 'text',
            x: 260,
            y: 1650,
            width: 240,
            height: 40,
            label: 'Middle',
            placeholder: 'Middle Name',
            containerId: mainContainer.id
        },
        {
            id: baseId + 39,
            type: 'text',
            x: 510,
            y: 1650,
            width: 240,
            height: 40,
            label: 'Last',
            placeholder: 'Last Name',
            containerId: mainContainer.id
        },
        
        // Second Sponsor Gender
        {
            id: baseId + 40,
            type: 'radio',
            x: 10,
            y: 1710,
            width: 300,
            height: 60,
            label: 'Please choose one',
            options: ['Male', 'Female'],
            containerId: mainContainer.id
        },
        
        // Second Sponsor Testimonial
        {
            id: baseId + 41,
            type: 'checkbox',
            x: 10,
            y: 1790,
            width: 700,
            height: 30,
            label: 'Testimonial of Suitability by Parent(s) (if a child) - Suitable',
            containerId: mainContainer.id
        },
        
        // Permission for child under 14
        {
            id: baseId + 42,
            type: 'checkbox',
            x: 10,
            y: 1840,
            width: 700,
            height: 30,
            label: 'Permission of Parent for a child under the age of 14 to make a Profession of Faith * - Permission',
            required: true,
            containerId: mainContainer.id
        },
        
        // Final Permission & Agreement
        {
            id: baseId + 43,
            type: 'checkbox',
            x: 10,
            y: 1890,
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

export default createConfirmationForm;