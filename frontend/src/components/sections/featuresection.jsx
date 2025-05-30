const FeaturesSection = () => {
  return (
    <section className="py-12 bg-gray-50">
      {/* Header Section */}
      <div className="max-w-screen-xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-gray-900">
          Features
        </h1>
        <p className="mb-6 text-lg font-normal text-gray-900 lg:text-xl sm:px-4 xl:px-48">
          Streamline your workflow with powerful tools designed for efficiency and ease.
        </p>
      </div>

      {/* Timeline Lists */}
      <div className="flex flex-col md:flex-row justify-center space-y-8 md:space-y-0 md:space-x-8 px-4">
        {/* First List */}
        <ol className="relative border-l-2 border-gray-200 max-w-md w-full">
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">1</span>
            <h3 className="text-lg font-semibold text-gray-900">Online Booking System</h3>
            <p className="mb-4 text-base font-normal text-gray-900">
              Book sacramental services (baptism, communion, confirmation, matrimony, funeral) online. View real-time availability and schedules for churches in Davao City.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">2</span>
            <h3 className="text-lg font-semibold text-gray-900">Interactive Church Map</h3>
            <p className="text-base font-normal text-gray-900">
              Locate nearby Roman Catholic churches using an integrated map. Filter by proximity and available services.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">3</span>
            <h3 className="text-lg font-semibold text-gray-900">Document Management</h3>
            <p className="text-base font-normal text-gray-900">
              Upload required documents (e.g., baptismal forms) digitally. Secure storage and easy retrieval for church administrators.
            </p>
          </li>
          <li className="ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">4</span>
            <h3 className="text-lg font-semibold text-gray-900">Payment Integration</h3>
            <p className="text-base font-normal text-gray-900">
              Secure online payments for service fees and subscriptions (GCash support planned).
            </p>
          </li>
        </ol>

        {/* Second List */}
        <ol className="relative border-l-2 border-gray-200 max-w-md w-full">
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">5</span>
            <h3 className="text-lg font-semibold text-gray-900">Role-Based Dashboards</h3>
            <p className="mb-4 text-base font-normal text-gray-900">
              Church Administrators: Manage staff, schedules, appointments, and verify documents. Staff: Handle service requests and assist with bookings. Churchgoers: Book services, track statuses, and receive notifications.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">6</span>
            <h3 className="text-lg font-semibold text-gray-900">Automated Notifications</h3>
            <p className="text-base font-normal text-gray-900">
              Real-time updates via email/app for booking confirmations, approvals, or changes.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">7</span>
            <h3 className="text-lg font-semibold text-gray-900">Subscription Management</h3>
            <p className="text-base font-normal text-gray-900">
              Churches can subscribe to tiered plans for system access. Admin dashboard for billing, renewals, and payment tracking.
            </p>
          </li>
          <li className="ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">8</span>
            <h3 className="text-lg font-semibold text-gray-900">Staff & Schedule Coordination</h3>
            <p className="text-base font-normal text-gray-900">
              Assign roles (priests, secretaries) and manage service slots to avoid conflicts.
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
};

export default FeaturesSection;