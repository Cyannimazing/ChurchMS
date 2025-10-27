const FaqCard = ({ category, question, answer }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
    <div className="mb-3">
      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{category}</span>
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-3">{question}</h3>
    <p className="text-gray-600 leading-relaxed">{answer}</p>
  </div>
);

const FaqSection = ({ id }) => {
  const faqs = [
    {
      category: 'General',
      question: 'What is FaithSeeker?',
      answer: 'FaithSeeker is an online platform that allows Churchgoer to book sacramental services (e.g., baptism, matrimony) at Roman Catholic churches in Davao City, with features like real-time scheduling and document management.'
    },
    {
      category: 'Booking',
      question: 'How do I book a service?',
      answer: "Browse churches on our interactive map, select a service and time slot, upload required documents, and submit your booking. You'll receive a confirmation via email or app."
    },
    {
      category: 'Payments',
      question: 'What payment methods are supported?',
      answer: 'FaithSeeker supports secure online payments, with GCash integration planned for the future. Check with your selected church for specific payment options.'
    },
    {
      category: 'Churches',
      question: 'How can my church join FaithSeeker?',
      answer: 'Churches can register online, verify credentials, and set up a profile with available services and schedules. Our team will guide you through the setup process.'
    },
    {
      category: 'Documents',
      question: 'What documents are required for bookings?',
      answer: 'Requirements vary by service (e.g., baptismal certificate for matrimony). You can upload documents directly on FaithSeeker, and churches will verify them digitally.'
    },
    {
      category: 'Support',
      question: 'What if I need help?',
      answer: 'Contact our support team via the platform or email. Churches on premium plans receive priority support for faster assistance.'
    }
  ];

  return (
    <section className="py-24 bg-gray-50" id={id}>
      {/* Header Section */}
      <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 mb-16">
        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl text-gray-900">
          Frequently Asked <span className="text-indigo-600">Questions</span>
        </h1>
        <p className="text-lg text-gray-600 lg:text-xl max-w-3xl mx-auto">
          Here are some of the frequently asked questions about using FaithSeeker for church services.
        </p>
      </div>

      {/* FAQ Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faqs.map((faq, index) => (
            <FaqCard key={index} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
