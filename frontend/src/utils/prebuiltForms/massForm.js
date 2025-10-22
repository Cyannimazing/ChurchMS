export const createMassForm = () => {
  const baseId = Date.now();

  // Container for the form
  const mainContainer = {
    id: baseId + 1,
    type: 'container',
    x: 50,
    y: 50,
    width: 820,
    height: 580,
    backgroundColor: '#ffffff', // Updated to Almond color
    borderColor: '#e5e7eb',
    borderWidth: 2,
    borderRadius: 8,
    padding: 30,
    containerId: null,
    elementId: 'mass_intention_form_container',
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
      content: 'MASS INTENTION',
      headingSize: 'h1',
      textAlign: 'center',
      textColor: '#1f2937',
      containerId: mainContainer.id,
      elementId: 'mass_intention_title',
      zIndex: 1
    },

    // Radio Buttons for intention type
    {
      id: baseId + 3,
      type: 'radio',
      x: 10,
      y: 70,
      width: 720,
      height: 100,
      label: 'Mass Intention Type',
      required: true,
      options: ['THANKSGIVING', 'SPECIAL INTENTION', 'SOULS'],
      containerId: mainContainer.id,
      elementId: 'mass_intention_type',
      zIndex: 1
    },

    // Three intention text lines (1,2,3)
    {
      id: baseId + 4,
      type: 'text',
      x: 10,
      y: 200,
      width: 740,
      height: 40,
      label: '1.',
      placeholder: 'Enter intention / name',
      containerId: mainContainer.id,
      elementId: 'intention_1',
      zIndex: 1
    },
    {
      id: baseId + 5,
      type: 'text',
      x: 10,
      y: 260,
      width: 740,
      height: 40,
      label: '2.',
      placeholder: 'Enter intention / name',
      containerId: mainContainer.id,
      zIndex: 1
    },
    {
      id: baseId + 6,
      type: 'text',
      x: 10,
      y: 320,
      width: 740,
      height: 40,
      label: '3.',
      placeholder: 'Enter intention / name',
      containerId: mainContainer.id,
      zIndex: 1
    },

    // Offered By
    {
      id: baseId + 7,
      type: 'text',
      x: 10,
      y: 380,
      width: 740,
      height: 40,
      label: 'OFFERED BY',
      placeholder: 'Enter name of offerer',
      required: true,
      containerId: mainContainer.id,
      elementId: 'offered_by',
      zIndex: 1
    },

    // Donation
    {
      id: baseId + 8,
      type: 'number',
      x: 10,
      y: 440,
      width: 740,
      height: 40,
      label: 'DONATION',
      placeholder: 'Enter amount',
      containerId: mainContainer.id,
      elementId: 'donation_amount',
      zIndex: 1
    }
  ];

  const requirements = [];

  return {
    formElements,
    requirements
  };
};

export default createMassForm;