import { Calendar, Map, FileText, CreditCard, Users, Bell, Wallet, ClipboardList } from 'lucide-react';

const FeatureCard = ({ icon: Icon, number, title, description }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
    <div className="flex items-start space-x-4">
      <div className="bg-indigo-100 p-3 rounded-xl group-hover:bg-indigo-200 transition-colors">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{number}</span>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

const FeaturesSection = () => {
  const features = [
    {
      icon: Calendar,
      number: '01',
      title: 'Online Booking System',
      description: 'Book sacramental services (baptism, communion, confirmation, matrimony, funeral) online. View real-time availability and schedules for churches in Davao City.'
    },
    {
      icon: Map,
      number: '02',
      title: 'Interactive Church Map',
      description: 'Locate nearby Roman Catholic churches using an integrated map. Filter by proximity and available services.'
    },
    {
      icon: FileText,
      number: '03',
      title: 'Document Management',
      description: 'Upload required documents (e.g., baptismal forms) digitally. Secure storage and easy retrieval for church administrators.'
    },
    {
      icon: CreditCard,
      number: '04',
      title: 'Payment Integration',
      description: 'Secure online payments for service fees and subscriptions (GCash support planned).'
    },
    {
      icon: Users,
      number: '05',
      title: 'Role-Based Dashboards',
      description: 'Church Administrators: Manage staff, schedules, appointments, and verify documents. Staff: Handle service requests and assist with bookings. Churchgoers: Book services, track statuses, and receive notifications.'
    },
    {
      icon: Bell,
      number: '06',
      title: 'Automated Notifications',
      description: 'Real-time updates via email/app for booking confirmations, approvals, or changes.'
    },
    {
      icon: Wallet,
      number: '07',
      title: 'Subscription Management',
      description: 'Churches can subscribe to tiered plans for system access. Admin dashboard for billing, renewals, and payment tracking.'
    },
    {
      icon: ClipboardList,
      number: '08',
      title: 'Staff & Schedule Coordination',
      description: 'Assign roles (priests, secretaries) and manage service slots to avoid conflicts.'
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 mb-16">
        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl text-gray-900">
          Powerful <span className="text-indigo-600">Features</span>
        </h1>
        <p className="text-lg text-gray-600 lg:text-xl max-w-3xl mx-auto">
          Streamline your workflow with powerful tools designed for efficiency and ease.
        </p>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
