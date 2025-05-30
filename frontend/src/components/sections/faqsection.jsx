const FaqSection = () => {
  return (
    <section className="py-12 bg-gray-50">
      {/* Header Section */}
      <div className="max-w-screen-xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-gray-900">
          Frequently Asked Questions
        </h1>
        <p className="mb-6 text-lg font-normal text-gray-900 lg:text-xl sm:px-4 xl:px-48">
          Here are some of the frequently asked questions about using FaithSeeker for church services.
        </p>
      </div>

      {/* FAQ Lists */}
      <div className="flex flex-col md:flex-row justify-center space-y-8 md:space-y-0 md:space-x-8 px-4">
        {/* First List */}
        <ol className="relative border-l-2 border-gray-200 max-w-md w-full">
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">General</span>
            <h3 className="text-lg font-semibold text-gray-900">What is FaithSeeker?</h3>
            <p className="mb-4 text-base font-normal text-gray-900">
              FaithSeeker is an online platform that allows parishioners to book sacramental services (e.g., baptism, matrimony) at Roman Catholic churches in Davao City, with features like real-time scheduling and document management.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">Booking</span>
            <h3 className="text-lg font-semibold text-gray-900">How do I book a service?</h3>
            <p className="text-base font-normal text-gray-900">
              Browse churches on our interactive map, select a service and time slot, upload required documents, and submit your booking. You'll receive a confirmation via email or app.
            </p>
          </li>
          <li className="ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">Payments</span>
            <h3 className="text-lg font-semibold text-gray-900">What payment methods are supported?</h3>
            <p className="text-base font-normal text-gray-900">
              FaithSeeker supports secure online payments, with GCash integration planned for the future. Check with your selected church for specific payment options.
            </p>
          </li>
        </ol>

        {/* Second List */}
        <ol className="relative border-l-2 border-gray-200 max-w-md w-full">
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">Churches</span>
            <h3 className="text-lg font-semibold text-gray-900">How can my church join FaithSeeker?</h3>
            <p className="mb-4 text-base font-normal text-gray-900">
              Churches can register online, verify credentials, and set up a profile with available services and schedules. Our team will guide you through the setup process.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">Documents</span>
            <h3 className="text-lg font-semibold text-gray-900">What documents are required for bookings?</h3>
            <p className="text-base font-normal text-gray-900">
              Requirements vary by service (e.g., baptismal certificate for matrimony). You can upload documents directly on FaithSeeker, and churches will verify them digitally.
            </p>
          </li>
          <li className="ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">Support</span>
            <h3 className="text-lg font-semibold text-gray-900">What if I need help?</h3>
            <p className="text-base font-normal text-gray-900">
              Contact our support team via the platform or email. Churches on premium plans receive priority support for faster assistance.
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
};

export default FaqSection;