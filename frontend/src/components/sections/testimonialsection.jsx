import React from "react";

const TestimonialsSection = ({ id }) => {
  const testimonials = [
    {
      name: "Fr. John Santos",
      title: "Parish Priest at St. Mary’s Church",
      quote:
        "FaithSeeker has transformed how we manage sacramental services. The online booking system and real-time scheduling have eliminated conflicts and saved us countless hours.",
      heading: "Streamlined Scheduling Process",
    },
    {
      name: "Maria Cruz",
      title: "Church Administrator at Holy Cross Parish",
      quote:
        "The role-based dashboard allows us to assign tasks efficiently and manage documents securely. It’s a game-changer for organizing baptisms and weddings seamlessly.",
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
        "The automated notifications keep everyone informed about service updates. It’s made communication with parishioners smoother and reduced missed appointments.",
      heading: "Enhanced Communication",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      id={id}
    >
      <section className="py-24 bg-gray-50 w-full flex justify-center">
        <div className="max-w-screen-xl mx-auto text-center">
          <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-black">
            Testimonials
          </h1>
          <p className="mb-6 text-lg font-normal text-black lg:text-xl mx-auto max-w-3xl">
            Hear from those who have experienced the benefits of FaithSeeker.
          </p>
        </div>
      </section>

      <div className="w-full flex justify-center">
        <div className="grid mb-8 border border-gray-200 rounded-lg shadow-lg md:mb-12 md:grid-cols-2 bg-white max-w-screen-xl">
          {testimonials.map((testimonial, index) => (
            <figure
              key={index}
              className={`flex flex-col items-center justify-center p-8 text-center bg-white border-gray-200 shadow-lg ${
                index === 0
                  ? "border-b rounded-t-lg md:rounded-t-none md:rounded-ss-lg md:border-e"
                  : index === 1
                  ? "border-b md:rounded-se-lg"
                  : index === 2
                  ? "border-b md:rounded-es-lg md:border-e md:border-b-0"
                  : "rounded-b-lg md:rounded-se-lg"
              }`}
            >
              <blockquote className="max-w-2xl mx-auto mb-4 text-gray-500 lg:mb-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {testimonial.heading}
                </h3>
                <p className="my-4">{testimonial.quote}</p>
              </blockquote>
              <figcaption className="flex flex-col items-center justify-center">
                <div className="space-y-0.5 font-medium text-center">
                  <div>{testimonial.name}</div>
                  <div className="text-sm text-gray-500">
                    {testimonial.title}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
