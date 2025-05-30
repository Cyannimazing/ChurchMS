const HowItWorksSection = () => {
  return (
    <section className="py-12 bg-gray-50">
      {/* Header Section */}
      <div className="max-w-screen-xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-gray-900">
          How It Works
        </h1>
        <p className="mb-6 text-lg font-normal text-gray-900 lg:text-xl sm:px-4 xl:px-48">
          Discover how easy it is to book sacramental services with FaithSeeker.
        </p>
      </div>

      {/* Timeline List */}
      <div className="flex justify-center px-4">
        <ol className="relative border-l-2 border-gray-200 max-w-md w-full">
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">1</span>
            <h3 className="text-lg font-semibold text-gray-900">Find Your Church</h3>
            <p className="mb-4 text-base font-normal text-gray-900">
              Browse an interactive map to locate registered Roman Catholic churches in Davao City. Filter by service type (baptism, matrimony, etc.) and proximity.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">2</span>
            <h3 className="text-lg font-semibold text-gray-900">Book a Service</h3>
            <p className="text-base font-normal text-gray-900">
              Select your preferred church and available time slot. Submit required documents (e.g., baptismal forms) online—no need to visit in person.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">3</span>
            <h3 className="text-lg font-semibold text-gray-900">Get Confirmed</h3>
            <p className="text-base font-normal text-gray-900">
              Receive real-time notifications (email/app) when your booking is approved or updated. Track your request status anytime via your account dashboard.
            </p>
          </li>
          <li className="ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">4</span>
            <h3 className="text-lg font-semibold text-gray-900">Attend Your Service</h3>
            <p className="text-base font-normal text-gray-900">
              Arrive at the church on your scheduled date. Churches manage everything digitally—no paperwork or long queues!
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
};

export default HowItWorksSection;