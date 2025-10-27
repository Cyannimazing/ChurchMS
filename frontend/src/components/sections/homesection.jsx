import Image from 'next/image';
import Link from 'next/link';
import { Search, Heart, Users, Calendar } from 'lucide-react';

const ImageGrid = () => {
  const images = [
    { src: '/images/church1.jpg', span: 'md:col-span-2 md:row-span-2' },
    { src: '/images/church2.jpg', span: '' },
    { src: '/images/church3.jpg', span: 'md:row-span-2' },
    { src: '/images/church4.jpg', span: '' },
    { src: '/images/church5.jpg', span: '' },
    { src: '/images/church6.jpg', span: 'md:col-span-2' },
    { src: '/images/church7.jpg', span: '' },
    { src: '/images/church8.jpg', span: 'md:row-span-2' },
    { src: '/images/church9.jpg', span: '' },
    { src: '/images/church10.jpg', span: 'md:col-span-2' },
    { src: '/images/church11.jpg', span: '' },
    { src: '/images/church12.jpg', span: '' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {images.map((item, index) => (
        <div 
          key={index} 
          className={`group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 ${item.span}`}
        >
          <Image
            className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-300"
            src={item.src}
            alt={`Church image ${index + 1}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ))}
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100">
    <div className="bg-indigo-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-indigo-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const HomeSection = () => {
  return (
    <div className="min-h-screen">
      <main>
        {/* Hero Section with Background */}
        <section className="relative min-h-screen py-24 px-4 sm:px-6 lg:px-8 flex items-center">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/heroo.jpg"
              alt="Church background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
          </div>
          
          {/* Content */}
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white drop-shadow-lg">
                Discover the Heart of Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  Ministry
                </span>
              </h1>
              <p className="mb-10 text-lg sm:text-xl text-gray-100 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
                Finding the right church for your spiritual needs is important, and we're here to help! Browse through our listings to discover churches that offer a variety of sacramental services, including baptism, communion, and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                >
                  Get Started
                </Link>
                <Link
                  href="/platform"
                  className="px-8 py-4 bg-white/95 text-gray-900 font-semibold rounded-xl hover:bg-white transition-colors border-2 border-white/20 backdrop-blur-sm shadow-lg"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-indigo-50/30 to-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Why Choose FaithSeeker?
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              A comprehensive platform designed to connect seekers with churches and help ministries thrive.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={Search}
                title="Easy Discovery"
                description="Find churches in your area with our intuitive search and filtering system."
              />
              <FeatureCard
                icon={Heart}
                title="Community Focus"
                description="Connect with vibrant faith communities that align with your spiritual journey."
              />
              <FeatureCard
                icon={Users}
                title="Full Management"
                description="Churches can manage members, events, and services all in one place."
              />
              <FeatureCard
                icon={Calendar}
                title="Event Planning"
                description="Stay updated with services, events, and sacramental schedules."
              />
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Inspiring Spaces of Worship
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Explore beautiful churches and worship spaces in your community.
            </p>
          </div>
          <ImageGrid />
        </section>
      </main>
    </div>
  );
};

export default HomeSection;