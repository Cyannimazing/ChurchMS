import { Search, Calendar, CheckCircle, Church } from 'lucide-react';

const StepCard = ({ number, icon: Icon, title, description, isLast }) => (
  <div className="relative">
    <div className="flex items-start space-x-4">
      {/* Number Circle */}
      <div className="flex-shrink-0">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
          <span className="text-2xl font-bold text-gray-700">{number}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-gray-100 p-2 rounded-lg">
            <Icon className="w-5 h-5 text-gray-700" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
    
    {/* Connecting Line */}
    {!isLast && (
      <div className="ml-8 h-12 w-0.5 bg-gray-200 my-4"></div>
    )}
  </div>
);

const HowItWorksSection = ({ id }) => {
  const steps = [
    {
      number: '01',
      icon: Search,
      title: 'Find Your Church',
      description: 'Browse an interactive map to locate registered Roman Catholic churches in Davao City. Filter by service type (baptism, matrimony, etc.) and proximity.'
    },
    {
      number: '02',
      icon: Calendar,
      title: 'Book a Service',
      description: 'Select your preferred church and available time slot. Submit required documents (e.g., baptismal forms) online—no need to visit in person.'
    },
    {
      number: '03',
      icon: CheckCircle,
      title: 'Get Confirmed',
      description: 'Receive real-time notifications (email/app) when your booking is approved or updated. Track your request status anytime via your account dashboard.'
    },
    {
      number: '04',
      icon: Church,
      title: 'Attend Your Service',
      description: 'Arrive at the church on your scheduled date. Churches manage everything digitally—no paperwork or long queues!'
    }
  ];

  return (
    <section className="py-24 bg-white" id={id}>
      {/* Header Section */}
      <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 mb-16">
        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl text-gray-900">
          How It <span className="text-indigo-600">Works</span>
        </h1>
        <p className="text-lg text-gray-600 lg:text-xl max-w-3xl mx-auto">
          Discover how easy it is to book sacramental services with FaithSeeker.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {steps.map((step, index) => (
          <StepCard key={index} {...step} isLast={index === steps.length - 1} />
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
