import { Phone, MapPin, Mail, Clock } from 'lucide-react';

const ContactCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-500 mb-1">{label}</h3>
        <p className="text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  </div>
);

const ContactSection = ({ id }) => {
  const contactInfo = [
    {
      icon: Phone,
      label: "Phone Number",
      value: "09123456789",
    },
    {
      icon: MapPin,
      label: "Location",
      value: "506 J.P. Laurel Ave, Poblacion District, Davao City, 8000 Davao del Sur",
    },
    {
      icon: Mail,
      label: "Email",
      value: "stidavaoexample@gmail.com",
    },
    {
      icon: Clock,
      label: "Working Hours",
      value: "9am - 9pm",
    },
  ];

  return (
    <section className="py-24 bg-gray-50" id={id}>
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 mb-16">
        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl text-gray-900">
          Get In <span className="text-indigo-600">Touch</span>
        </h1>
        <p className="text-lg text-gray-600 lg:text-xl max-w-3xl mx-auto">
          Want to Contact Us? We'd love to hear from you. Here's how you can reach us.
        </p>
      </div>

      {/* Contact Grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contactInfo.map((item, index) => (
            <ContactCard key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
