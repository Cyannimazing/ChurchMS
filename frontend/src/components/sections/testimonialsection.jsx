import React from "react";
import { Quote } from 'lucide-react';

const TestimonialCard = ({ name, title, quote, heading }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
    <div className="mb-4">
      <Quote className="w-10 h-10 text-indigo-200" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{heading}</h3>
    <p className="text-gray-600 leading-relaxed mb-6">"{quote}"</p>
    <div className="pt-6 border-t border-gray-100">
      <p className="font-semibold text-gray-900">{name}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  </div>
);

const TestimonialsSection = ({ id }) => {
  const testimonials = [
    {
      name: "Fr. John Santos",
      title: "Parish Priest at St. Mary's Church",
      quote:
        "FaithSeeker has transformed how we manage sacramental services. The online booking system and real-time scheduling have eliminated conflicts and saved us countless hours.",
      heading: "Streamlined Scheduling Process",
    },
    {
      name: "Maria Cruz",
      title: "Church Administrator at Holy Cross Parish",
      quote:
        "The role-based dashboard allows us to assign tasks efficiently and manage documents securely. It's a game-changer for organizing baptisms and weddings seamlessly.",
      heading: "Efficient Church Administration",
    },
    {
      name: "Ana Reyes",
      title: "Parishioner at Our Lady of Fatima Church",
      quote:
        "Booking a sacramental service online with FaithSeeker is so convenient. I can upload documents and track my request without visiting the church, saving me time and effort.",
      heading: "Convenient Online Booking",
    },
    {
      name: "Bro. Luis Gomez",
      title: "Church Staff at San Isidro Parish",
      quote:
        "The automated notifications keep everyone informed about service updates. It's made communication with parishioners smoother and reduced missed appointments.",
      heading: "Enhanced Communication",
    },
  ];

  return (
    <section className="py-24 bg-white" id={id}>
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 mb-16">
        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl text-gray-900">
          What People <span className="text-indigo-600">Say</span>
        </h1>
        <p className="text-lg text-gray-600 lg:text-xl max-w-3xl mx-auto">
          Hear from those who have experienced the benefits of FaithSeeker.
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
