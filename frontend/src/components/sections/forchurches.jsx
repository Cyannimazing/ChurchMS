import { UserPlus, LayoutDashboard, Zap, CreditCard } from 'lucide-react';

const ChurchStepCard = ({ number, icon: Icon, title, description }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-bold text-indigo-600">{number}</span>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

const ForChurchesSection = ({ id }) => {
  const steps = [
    {
      number: '01',
      icon: UserPlus,
      title: 'Easy Setup & Registration',
      description: 'Register your church, verify credentials, and set up your profile. Customize your available services (baptism, matrimony, etc.) and schedules.'
    },
    {
      number: '02',
      icon: LayoutDashboard,
      title: 'Manage Everything in One Dashboard',
      description: 'Booking Management: View, approve, or reschedule requests in real time. Staff Coordination: Assign roles (priests, secretaries) and permissions. Document Handling: Securely receive and verify parishioner submissions online.'
    },
    {
      number: '03',
      icon: Zap,
      title: 'Automated Workflows',
      description: 'Notifications: Auto-alerts for new bookings, changes, or pending approvals. Reminders: Reduce no-shows with automated service reminders.'
    },
    {
      number: '04',
      icon: CreditCard,
      title: 'Subscription Plans',
      description: 'Unlimited bookings & staff accounts, Priority support, Advanced reporting (future update).'
    }
  ];

  return (
    <section className="py-24 bg-white" id={id}>
      {/* Header Section */}
      <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 mb-16">
        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl text-gray-900">
          For <span className="text-indigo-600">Churches</span>
        </h1>
        <p className="text-lg text-gray-600 lg:text-xl max-w-3xl mx-auto">
          Simplify church operations and enhance parishioner experience with FaithSeeker&apos;s digital tools.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => (
            <ChurchStepCard key={index} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ForChurchesSection;
