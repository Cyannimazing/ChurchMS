const ForChurchesSection = () => {
  return (
    <section className="py-12 bg-gray-50">
      {/* Header Section */}
      <div className="max-w-screen-xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-gray-900">
          How It Works for Your Church
        </h1>
        <p className="mb-6 text-lg font-normal text-gray-900 lg:text-xl sm:px-4 xl:px-48">
          Simplify church operations and enhance parishioner experience with FaithSeeker&apos;s digital tools.
        </p>
      </div>

      {/* Timeline List */}
      <div className="flex justify-center px-4">
        <ol className="relative border-l-2 border-gray-200 max-w-md w-full">
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">1</span>
            <h3 className="text-lg font-semibold text-gray-900">Easy Setup & Registration</h3>
            <p className="mb-4 text-base font-normal text-gray-900">
              Register your church, verify credentials, and set up your profile. Customize your available services (baptism, matrimony, etc.) and schedules.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">2</span>
            <h3 className="text-lg font-semibold text-gray-900">Manage Everything in One Dashboard</h3>
            <p className="text-base font-normal text-gray-900">
              Booking Management: View, approve, or reschedule requests in real time. Staff Coordination: Assign roles (priests, secretaries) and permissions. Document Handling: Securely receive and verify parishioner submissions online.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">3</span>
            <h3 className="text-lg font-semibold text-gray-900">Automated Workflows</h3>
            <p className="text-base font-normal text-gray-900">
              Notifications: Auto-alerts for new bookings, changes, or pending approvals. Reminders: Reduce no-shows with automated service reminders.
            </p>
          </li>
          <li className="ml-6">
            <div className="absolute w-3 h-3 bg-gray-900 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <span className="mb-1 text-sm font-normal leading-none text-gray-900">4</span>
            <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
            <p className="text-base font-normal text-gray-900">
              Unlimited bookings & staff accounts, Priority support, Advanced reporting (future update).
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
};

export default ForChurchesSection;