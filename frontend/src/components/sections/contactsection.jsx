const ContactSection = () => {
  const contactInfo = [
    {
      label: 'Phone Number',
      value: '09123456789',
    },
    {
      label: 'Location',
      value: '506 J.P. Laurel Ave, Poblacion District, Davao City, 8000 Davao del Sur',
    },
    {
      label: 'Email',
      value: 'stidavaoexample@gmail.com',
    },
    {
      label: 'Working Hours',
      value: '9am - 9pm',
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="py-12 bg-gray-50">
        <div className="max-w-screen-xl mx-auto text-center">
          <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-black">
            Contact Us
          </h1>
          <p className="mb-6 text-lg font-normal text-black lg:text-xl sm:px-16 xl:px-48">
            Want to Contact Us? We’d love to hear from you. Here’s how you can reach us.
          </p>
        </div>
      </section>

      <div className="flex justify-center">
        <div className="w-full max-w-md p-4 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-xl font-bold leading-none text-gray-900">Contact Information</h5>
          </div>
          <div className="flow-root">
            <ul role="list" className="divide-y divide-gray-200">
              {contactInfo.map((item, index) => (
                <li key={index} className="py-3 sm:py-4">
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0 ml-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                      <p className="text-sm text-gray-500 truncate">{item.value}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
